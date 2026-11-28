/**
 * 제품 일정 캘린더 — 구글 Apps Script 서버 코드
 *
 * 이 파일이 하는 일
 *  1) 웹앱 주소로 들어오면 화면(Index.html)을 보여줘요.
 *  2) 화면이 "불러와 줘 / 저장해 줘" 하면 이 스프레드시트의 탭에 읽고 써요.
 *
 * 탭(시트) 구성: 제품 · 부자재 · 일정 · 이슈 메모 · 필요 일정 · 설정
 * ⚠️ 시트를 직접 고칠 때 'id'로 끝나는 칸은 바꾸지 마세요. 서로를 이어 주는 번호예요.
 */

var TABS = {
  products: { name: '제품', headers: ['id', '제품명', '담당', '유형', '제조사', '유통', '런칭일', '부자재 입고', '완제품 입고', '색', '입고 간격'] },
  materials: { name: '부자재', headers: ['id', '제품 id', '부자재', '업체', '필요 일정', '제품명(참고)', '필요 일정 id'] },
  steps: { name: '일정', headers: ['id', '제품 id', '부자재 id', '단계', '작업 유형', '날짜', '규칙', '변경 기록', '제품명(참고)', '부자재(참고)'] },
  memos: { name: '이슈 메모', headers: ['id', '제품 id', '연결 일정 id', '내용', '제품명(참고)'] },
  templates: { name: '필요 일정', headers: ['id', '이름', '부자재 종류', '단계(JSON)'] },
  settings: { name: '설정', headers: ['항목', '값'] },
};

// 작업 유형: 시트에는 사람이 읽기 쉬운 이름으로 저장해요.
var KIND_NAMES = { meet: '보고/회의', sample: '샘플 요청', ct: 'CT', data: '데이터 아웃/입고', mold: '금형/발주', launch: '런칭' };

// ---------- 웹앱 ----------
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('제품 일정 캘린더')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ---------- 처음 한 번 실행: 탭 만들기 ----------
function setup() {
  Object.keys(TABS).forEach(function (key) { sheet_(key); });
  if (getSetting_('revision') === '') setSetting_('revision', '0');
  SpreadsheetApp.getActive().toast('준비 끝! 이제 [배포] 버튼으로 웹앱을 만들면 돼요.', '제품 일정 캘린더', 8);
}

// ---------- 화면에서 부르는 함수들 ----------
function getRevision() {
  return getSetting_('revision') || '0';
}

function getData() {
  var products = readRows_('products');
  var materials = readRows_('materials');
  var steps = readRows_('steps');
  var memos = readRows_('memos');
  var templates = readRows_('templates');
  var kindByName = invert_(KIND_NAMES);

  var data = {
    products: products.map(function (r) {
      var pid = r[0];
      return {
        id: pid, name: r[1], owner: r[2], type: r[3], maker: r[4], channel: r[5],
        launch: r[6], materialArrival: r[7], finishedArrival: r[8], color: r[9] || 'green',
        gaps: parseJson_(r[10], { finishedN: 1, finishedUnit: '달', materialN: 2, materialUnit: '주' }),
        materials: materials.filter(function (m) { return m[1] === pid; }).map(function (m) {
          return {
            id: m[0], name: m[2], vendor: m[3], templateName: m[4], templateId: m[6] || null,
            steps: steps.filter(function (s) { return s[2] === m[0]; }).map(function (s) {
              return {
                id: s[0], name: s[3], kind: kindByName[s[4]] || s[4] || 'meet', date: s[5], rule: s[6],
                changes: s[7] ? String(s[7]).split('\n') : [],
              };
            }),
          };
        }),
        memos: memos.filter(function (n) { return n[1] === pid; }).map(function (n) {
          return { id: n[0], stepId: n[2] || null, text: n[3] };
        }),
      };
    }),
    templates: templates.map(function (t) {
      return { id: t[0], name: t[1], materialKind: t[2], steps: parseJson_(t[3], []) };
    }),
    vendors: parseJson_(getSetting_('vendors'), []),
    lastBackupAt: getSetting_('lastBackupAt') || null,
  };
  return JSON.stringify({ revision: getRevision(), data: data });
}

/**
 * 화면의 데이터 전체를 시트에 저장해요.
 * baseRevision: 화면이 불러왔던 저장본 번호. 그사이 다른 사람이 저장했으면 덮어쓰지 않고 알려줘요.
 */
function saveData(json, baseRevision) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var current = getRevision();
    if (baseRevision !== null && baseRevision !== undefined && String(baseRevision) !== String(current)) {
      return { conflict: true, revision: current };
    }
    var d = JSON.parse(json);
    var P = [], M = [], S = [], N = [];
    (d.products || []).forEach(function (p) {
      P.push([p.id, p.name, p.owner || '', p.type || '', p.maker || '', p.channel || '', p.launch, p.materialArrival, p.finishedArrival, p.color || '', JSON.stringify(p.gaps || {})]);
      (p.materials || []).forEach(function (m) {
        M.push([m.id, p.id, m.name, m.vendor, m.templateName || '', p.name, m.templateId || '']);
        (m.steps || []).forEach(function (s) {
          S.push([s.id, p.id, m.id, s.name, KIND_NAMES[s.kind] || s.kind, s.date, s.rule || '', (s.changes || []).join('\n'), p.name, m.name]);
        });
      });
      (p.memos || []).forEach(function (n) {
        N.push([n.id, p.id, n.stepId || '', n.text, p.name]);
      });
    });
    var T = (d.templates || []).map(function (t) { return [t.id, t.name, t.materialKind || '', JSON.stringify(t.steps || [])]; });

    writeRows_('products', P);
    writeRows_('materials', M);
    writeRows_('steps', S);
    writeRows_('memos', N);
    writeRows_('templates', T);
    setSetting_('vendors', JSON.stringify(d.vendors || []));
    setSetting_('lastBackupAt', d.lastBackupAt || '');
    var next = String(Number(current || 0) + 1);
    setSetting_('revision', next);
    setSetting_('마지막 저장', new Date().toLocaleString('ko-KR') + ' · ' + (Session.getActiveUser().getEmail() || ''));
    return { revision: next };
  } finally {
    lock.releaseLock();
  }
}

// ---------- 시트 도우미 ----------
function sheet_(key) {
  var tab = TABS[key];
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(tab.name);
  if (!sh) {
    sh = ss.insertSheet(tab.name);
    sh.getRange(1, 1, 1, tab.headers.length).setValues([tab.headers]).setFontWeight('bold').setBackground('#EFEFEC');
    sh.setFrozenRows(1);
  }
  return sh;
}

// 2행부터 끝까지, 모두 글자로 읽기 (날짜가 날짜 형식으로 바뀌지 않게)
function readRows_(key) {
  var sh = sheet_(key);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var width = TABS[key].headers.length;
  return sh.getRange(2, 1, last - 1, width).getDisplayValues().filter(function (r) { return r[0] !== ''; });
}

function writeRows_(key, rows) {
  var sh = sheet_(key);
  var width = TABS[key].headers.length;
  sh.getRange(1, 1, 1, width).setValues([TABS[key].headers]); // 칸이 새로 생겼을 때 제목 줄도 맞춰요
  var last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, width).clearContent();
  if (!rows.length) return;
  var range = sh.getRange(2, 1, rows.length, width);
  range.setNumberFormat('@'); // 글자 그대로 저장 (2027-03-16 이 날짜로 바뀌지 않게)
  range.setValues(rows);
}

function getSetting_(name) {
  var rows = readRows_('settings');
  for (var i = 0; i < rows.length; i++) if (rows[i][0] === name) return rows[i][1];
  return '';
}

function setSetting_(name, value) {
  var sh = sheet_('settings');
  var rows = readRows_('settings');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][0] === name) {
      var cell = sh.getRange(i + 2, 2);
      cell.setNumberFormat('@');
      cell.setValue(value);
      return;
    }
  }
  var r = sh.getRange(sh.getLastRow() + 1, 1, 1, 2);
  r.setNumberFormat('@');
  r.setValues([[name, value]]);
}

function parseJson_(text, fallback) {
  try { return text ? JSON.parse(text) : fallback; } catch (e) { return fallback; }
}

function invert_(obj) {
  var out = {};
  Object.keys(obj).forEach(function (k) { out[obj[k]] = k; });
  return out;
}
