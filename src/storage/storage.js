// 💾 저장 창구: 데이터를 읽고 쓰는 건 전부 이 파일 하나만 통해요.
//
// 두 가지 모드가 있어요.
//  - 'sheet' : 구글 Apps Script 웹앱 안에서 열렸을 때 → 구글 시트에 저장 (팀이 같이 봄)
//  - 'demo'  : 그 밖(개발 서버, 미리보기 링크) → 예시 데이터만, 새로고침하면 처음으로
//
// 화면 코드는 어느 모드인지 몰라도 돼요. 이 파일만 바꾸면 저장 장소를 바꿀 수 있어요.
import { createMockData, mockTemplates } from '../data/mockData.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

const gasRun = () =>
  typeof window !== 'undefined' && window.google && window.google.script && window.google.script.run;

export const storageMode = () => (gasRun() ? 'sheet' : 'demo');

// google.script.run 을 Promise 로 감싸기
function call(fn, ...args) {
  return new Promise((resolve, reject) => {
    gasRun()
      .withSuccessHandler(resolve)
      .withFailureHandler((err) => reject(err instanceof Error ? err : new Error(String(err && err.message ? err.message : err))))
      [fn](...args);
  });
}

// ---------- 저장 상태 알림 (화면 위쪽 "저장됨" 표시용) ----------
let status = { state: storageMode() === 'sheet' ? 'saved' : 'demo', message: '' };
const listeners = new Set();
const setStatus = (state, message = '') => {
  status = { state, message };
  listeners.forEach((fn) => fn(status));
};
export function onSaveStatus(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

// ---------- 불러오기 ----------
let revision = null; // 시트의 "몇 번째 저장본"인지. 동시에 고칠 때 덮어쓰기를 막는 데 써요.

function normalize(data) {
  const d = data || {};
  return {
    version: 1,
    products: d.products || [],
    templates: d.templates && d.templates.length ? d.templates : clone(mockTemplates),
    vendors: d.vendors || [],
    lastBackupAt: d.lastBackupAt || null,
  };
}

export async function loadAll() {
  if (storageMode() === 'demo') {
    // 주소 끝에 ?empty 를 붙이면 "제품이 하나도 없는 첫 화면"을 볼 수 있어요.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('empty')) {
      return { ...clone(createMockData()), products: [] };
    }
    return clone(createMockData());
  }
  const res = JSON.parse(await call('getData'));
  revision = res.revision;
  setStatus('saved');
  return normalize(res.data);
}

// 팀원이 그사이 바꿨는지 확인 (창으로 돌아올 때 씀)
export async function hasRemoteChanges() {
  if (storageMode() === 'demo' || pending || inFlight) return false;
  const rev = await call('getRevision');
  return String(rev) !== String(revision);
}

// ---------- 저장하기 ----------
// 글자를 칠 때마다 저장하면 느려서, 손을 멈추고 0.8초 뒤에 한 번에 저장해요.
let pending = null;
let timer = null;
let inFlight = false;

export function saveAll(data) {
  if (storageMode() === 'demo') return;
  pending = data;
  setStatus('saving');
  clearTimeout(timer);
  timer = setTimeout(flush, 800);
}

async function flush() {
  if (inFlight || !pending) return;
  const data = pending;
  pending = null;
  inFlight = true;
  try {
    const res = await call('saveData', JSON.stringify(data), revision);
    if (res && res.conflict) {
      pending = null;
      setStatus('conflict', '다른 팀원이 먼저 고쳤어요.');
      return;
    }
    revision = res.revision;
    setStatus(pending ? 'saving' : 'saved');
  } catch (e) {
    pending = pending || data; // 실패한 내용은 다음에 다시 보내요
    setStatus('error', e.message);
  } finally {
    inFlight = false;
    if (pending && status.state !== 'conflict') {
      clearTimeout(timer);
      timer = setTimeout(flush, status.state === 'error' ? 5000 : 200);
    }
  }
}

export function retrySave() {
  clearTimeout(timer);
  flush();
}

// ---------- 백업 파일 ----------
export function exportBackup(data) {
  const day = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `제품일정_백업_${day}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return day;
}

// 백업 파일 글자 → 데이터. 모양이 이상하면 오류를 던져요.
export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.templates)) {
    throw new Error('제품일정 백업 파일이 아니에요.');
  }
  return data;
}
