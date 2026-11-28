import { useEffect, useMemo, useRef, useState } from 'react';
import { loadAll, saveAll, exportBackup, parseBackup, storageMode, onSaveStatus, hasRemoteChanges, retrySave } from './storage/storage.js';
import { allEvents, findEvent } from './data/selectors.js';
import {
  addWorkdays, arrivals, isOffDay, md, parse, prevWorkday, stepsFromTemplate, todayIso, workdayDiff,
} from './engine/dates.js';
import Header from './components/Header.jsx';
import ProductSidebar from './components/ProductSidebar.jsx';
import TaskDetail from './components/TaskDetail.jsx';
import CalendarToolbar from './components/CalendarToolbar.jsx';
import MonthCalendar from './components/MonthCalendar.jsx';
import MonthNav from './components/MonthNav.jsx';
import Notices from './components/Notices.jsx';
import EmptyState from './components/EmptyState.jsx';
import NewProductDialog from './components/NewProductDialog.jsx';
import ProductEditDialog from './components/ProductEditDialog.jsx';
import TemplateEditorDialog from './components/TemplateEditorDialog.jsx';
import TemplateListDialog from './components/TemplateListDialog.jsx';
import ImportConfirmDialog from './components/ImportConfirmDialog.jsx';
import ApplyTemplateDialog from './components/ApplyTemplateDialog.jsx';
import { applyCandidates, freshSteps, recomputeMaterial } from './engine/applyTemplate.js';
import { PRODUCT_TYPES } from './data/constants.js';

const uid = (p) => p + Math.random().toString(36).slice(2, 8);
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);

// 처음에 저장소에서 데이터를 불러온 뒤 달력을 그려요.
export default function App() {
  const [loaded, setLoaded] = useState(null); // { data, key }
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ state: 'demo' });

  const load = (note) => {
    setError(null);
    loadAll()
      .then((data) => setLoaded((x) => ({ data, key: (x?.key || 0) + 1, note })))
      .catch((e) => setError(e.message || String(e)));
  };
  useEffect(() => { load(); return onSaveStatus(setSaveStatus); }, []);

  // 다른 창에 갔다 돌아오면, 그사이 팀원이 바꾼 게 있는지 확인
  useEffect(() => {
    if (storageMode() !== 'sheet') return undefined;
    const onFocus = () => hasRemoteChanges().then((changed) => changed && load('팀원이 바꾼 내용을 불러왔어요.')).catch(() => {});
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (error) {
    return (
      <div className="loading">
        <b>불러오지 못했어요</b>
        <span className="muted">{error}</span>
        <button className="btn primary" onClick={() => load()}>다시 시도</button>
      </div>
    );
  }
  if (!loaded) return <div className="loading"><span className="muted">구글 시트에서 불러오는 중…</span></div>;
  return (
    <CalendarApp
      key={loaded.key}
      initialData={loaded.data}
      initialNote={loaded.note}
      saveStatus={saveStatus}
      onReload={() => load('최신 내용을 다시 불러왔어요.')}
    />
  );
}

function CalendarApp({ initialData, initialNote, saveStatus, onReload }) {
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState(() => data.products[0]?.id || null);
  const [scope, setScope] = useState('one'); // 'one' = 이 제품만, 'all' = 전체 제품
  const [vendor, setVendor] = useState('전체');
  // 미리보기는 예시 데이터가 있는 2026년 12월부터, 실제(구글 시트)는 이번 달부터
  const [view, setView] = useState(() => {
    if (storageMode() === 'demo') return { year: 2026, month: 11 };
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [detailId, setDetailId] = useState(null);
  const [banner, setBanner] = useState(null); // 노란 물어보기 / 빨간 경고
  const [toast, setToast] = useState(initialNote ? { text: initialNote } : null); // 검은 알림 (+ 되돌리기)
  const [backupHidden, setBackupHidden] = useState(false);
  const [dialog, setDialog] = useState(null); // { type, ... }
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 데이터가 바뀌면 저장 (처음 불러온 그대로일 땐 저장 안 함)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    saveAll(data);
  }, [data]);

  const products = data.products;
  const product = products.find((p) => p.id === selectedId) || products[0] || null;
  const detail = detailId ? findEvent(products, detailId) : null;

  // Esc: 열린 창 → 설정 메뉴 → 작업 상세 순서로 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (dialog) setDialog(null);
      else if (settingsOpen) setSettingsOpen(false);
      else setDetailId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, settingsOpen]);

  const visibleProducts = scope === 'one' ? (product ? [product] : []) : products;
  const vendorOptions = useMemo(
    () => [...new Set(visibleProducts.flatMap((p) => p.materials.map((m) => m.vendor)))],
    [visibleProducts]
  );
  const events = useMemo(() => {
    const list = allEvents(visibleProducts);
    return vendor === '전체' ? list : list.filter((e) => e.vendor === vendor);
  }, [visibleProducts, vendor]);

  // ---------- 데이터 바꾸기 도우미 ----------
  const updateProduct = (pid, fn) =>
    setData((d) => ({ ...d, products: d.products.map((p) => (p.id === pid ? fn(p) : p)) }));

  const goToDate = (iso) => {
    const d = parse(iso);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const openDetail = (ev) => {
    setSelectedId(ev.productId);
    setDetailId(ev.id);
    goToDate(ev.date);
  };

  const showToast = (text, undoData) => setToast({ text, undoData });

  // ---------- 일정 옮기기 ----------
  const askMove = (stepId, newDate) => {
    const ev = findEvent(products, stepId);
    if (!ev || newDate === ev.date) return;
    if (isOffDay(newDate)) {
      setBanner({ type: 'offday', stepId, newDate, prev: prevWorkday(newDate) });
      return;
    }
    proposeMove(stepId, newDate);
  };

  const proposeMove = (stepId, newDate) => {
    const ev = findEvent(products, stepId);
    const p = products.find((x) => x.id === ev.productId);
    const mat = p.materials.find((m) => m.id === ev.materialId);
    const delta = workdayDiff(ev.date, newDate);
    const later = mat.steps
      .filter((s) => s.id !== stepId && s.date > ev.date)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((s) => ({ id: s.id, name: s.name, from: s.date, to: addWorkdays(s.date, delta) }));
    if (later.length === 0) {
      applyMove(stepId, newDate, []);
      return;
    }
    setBanner({ type: 'push', stepId, from: ev.date, to: newDate, label: ev.label, matName: mat.name, later });
  };

  const applyMove = (stepId, newDate, later) => {
    const before = data;
    const ev = findEvent(products, stepId);
    const p = products.find((x) => x.id === ev.productId);
    const moves = [{ id: stepId, from: ev.date, to: newDate }, ...later];
    const byId = Object.fromEntries(moves.map((m) => [m.id, m]));
    const next = {
      ...p,
      materials: p.materials.map((m) => ({
        ...m,
        steps: m.steps.map((s) =>
          byId[s.id] ? { ...s, date: byId[s.id].to, changes: [...(s.changes || []), `${md(byId[s.id].from)} → ${md(byId[s.id].to)}`] } : s
        ),
      })),
    };
    updateProduct(p.id, () => next);
    setBanner(null);
    goToDate(newDate);
    showToast(
      later.length ? `${ev.matName} 일정 ${later.length + 1}개를 같이 밀었어요.` : `${ev.label} 날짜를 ${md(newDate)}로 옮겼어요.`,
      before
    );
    // 밀린 일정이 부자재 입고일을 넘으면 빨간 경고
    const late = next.materials.flatMap((m) => m.steps).filter((s) => s.date > next.materialArrival);
    if (late.length) {
      setBanner({ type: 'late', names: late.map((s) => s.name), arrival: next.materialArrival });
    }
  };

  const undo = () => {
    if (toast?.undoData) setData(toast.undoData);
    setToast(null);
    setBanner(null);
  };

  // ---------- 메모 ----------
  const addMemo = (pid, text, stepId) =>
    updateProduct(pid, (p) => ({ ...p, memos: [...p.memos, { id: uid('m'), text, stepId: stepId || null }] }));

  const editMemo = (pid, id, text) =>
    updateProduct(pid, (p) => ({ ...p, memos: p.memos.map((m) => (m.id === id ? { ...m, text } : m)) }));
  const deleteMemo = (pid, id) => {
    const before = data;
    updateProduct(pid, (p) => ({ ...p, memos: p.memos.filter((m) => m.id !== id) }));
    showToast('메모를 지웠어요.', before);
  };

  // ---------- 새 제품 ----------
  const createProduct = (form) => {
    const arr = arrivals(form.launch, form.gaps);
    const fixed = { 런칭: form.launch, '완제품 입고': arr.finished, '부자재 입고': arr.material };
    const pid = uid('p');
    const materials = form.materials.map((row) => {
      const t = data.templates.find((x) => x.id === row.templateId);
      return {
        id: uid(pid + '-'), name: row.kind, vendor: row.vendor, templateId: t.id, templateName: t.name,
        steps: stepsFromTemplate(t, fixed).map((s) => ({
          id: uid('s'), name: s.name, kind: s.kind, date: s.date, rule: s.rule, changes: [],
        })),
      };
    });
    const p = {
      id: pid, name: form.name, type: form.type, channel: form.channel.trim(), maker: form.maker.trim(), owner: form.owner.trim(), color: form.color, launch: form.launch,
      finishedArrival: arr.finished, materialArrival: arr.material, gaps: form.gaps, materials, memos: [],
    };
    setData((d) => ({
      ...d,
      products: [...d.products, p],
      vendors: [...new Set([...d.vendors, ...form.materials.map((m) => m.vendor)])],
    }));
    setSelectedId(pid);
    setDetailId(null);
    setScope('one');
    setVendor('전체');
    const first = materials.flatMap((m) => m.steps).map((s) => s.date).sort()[0] || arr.material;
    goToDate(first);
    setDialog(null);
    showToast(`'${p.name}' 제품을 만들었어요. 일정 ${materials.reduce((n, m) => n + m.steps.length, 0) + 3}개가 생겼어요.`);
  };

  // ---------- 제품 정보 수정 ----------
  const saveProductInfo = (pid, form) => {
    const before = data;
    const old = products.find((p) => p.id === pid);
    const arr = arrivals(form.launch, form.gaps);
    const fixed = { 런칭: form.launch, '완제품 입고': arr.finished, '부자재 입고': arr.material };
    const delta = form.reschedule === 'shift' ? workdayDiff(old.materialArrival, arr.material) : 0;
    const kept = new Set();
    const goneIds = new Set();
    const materials = form.materials.map((row) => {
      if (row.id) {
        kept.add(row.id);
        const m = old.materials.find((x) => x.id === row.id);
        // 필요 일정을 다른 것으로 바꿨으면, 그 필요 일정대로 다시 계산
        if (row.templateId && row.templateId !== m.templateId) {
          const t = data.templates.find((x) => x.id === row.templateId);
          const r = recomputeMaterial({ ...old, launch: form.launch, finishedArrival: arr.finished, materialArrival: arr.material }, m, t, () => uid('s'));
          r.removed.forEach((s) => goneIds.add(s.id));
          return { ...m, name: row.kind.trim(), vendor: (row.vendor || '').trim(), templateId: t.id, templateName: t.name, steps: r.steps };
        }
        return {
          ...m, name: row.kind.trim(), vendor: row.vendor.trim(),
          steps: delta === 0 ? m.steps : m.steps.map((s) => {
            const to = addWorkdays(s.date, delta);
            return { ...s, date: to, changes: [...(s.changes || []), `${md(s.date)} → ${md(to)}, 런칭일 변경`] };
          }),
        };
      }
      const t = data.templates.find((x) => x.id === row.templateId);
      return {
        id: uid(pid + '-'), name: row.kind.trim(), vendor: row.vendor.trim(), templateId: t.id, templateName: t.name,
        steps: stepsFromTemplate(t, fixed).map((s) => ({ id: uid('s'), name: s.name, kind: s.kind, date: s.date, rule: s.rule, changes: [] })),
      };
    });
    const goneSteps = new Set([...goneIds, ...old.materials.filter((m) => !kept.has(m.id)).flatMap((m) => m.steps.map((s) => s.id))]);
    updateProduct(pid, (p) => ({
      ...p, name: form.name.trim(), type: form.type, channel: form.channel.trim(), maker: form.maker.trim(), owner: form.owner.trim(), color: form.color,
      launch: form.launch, gaps: form.gaps, finishedArrival: arr.finished, materialArrival: arr.material, materials,
      memos: p.memos.map((m) => (goneSteps.has(m.stepId) ? { ...m, stepId: null } : m)),
    }));
    setData((d) => ({ ...d, vendors: [...new Set([...d.vendors, ...form.materials.map((m) => m.vendor.trim())])] }));
    setDetailId(null);
    setDialog(null);
    showToast('제품 정보를 고쳤어요.', before);
  };

  // ---------- 필요 일정 ----------
  const saveTemplate = (tpl, returnTo) => {
    const isNew = !data.templates.some((t) => t.id === tpl.id);
    setData((d) => {
      const exists = d.templates.some((t) => t.id === tpl.id);
      return { ...d, templates: exists ? d.templates.map((t) => (t.id === tpl.id ? tpl : t)) : [...d.templates, tpl] };
    });
    const candidates = applyCandidates(products, tpl, isNew);
    if (candidates.length) {
      setDialog({ type: 'applyTemplate', template: tpl, isNew, returnTo });
      return;
    }
    setDialog(returnTo || null);
    showToast(`"${tpl.name}" 필요 일정을 저장했어요. 새로 만드는 제품부터 적용돼요.`);
  };

  // 수정한 필요 일정을 고른 제품의 부자재에 반영
  const applyTemplate = (tpl, materialIds, returnTo) => {
    const before = data;
    const pick = new Set(materialIds);
    setData((d) => ({
      ...d,
      products: d.products.map((p) => {
        if (pick.has('add:' + p.id)) {
          const m = { id: uid(p.id + '-'), name: tpl.materialKind, vendor: '', templateId: tpl.id, templateName: tpl.name, steps: freshSteps(p, tpl, () => uid('s')) };
          return { ...p, materials: [...p.materials, m] };
        }
        if (!p.materials.some((m) => pick.has(m.id))) return p;
        const gone = new Set();
        const materials = p.materials.map((m) => {
          if (!pick.has(m.id)) return m;
          const r = recomputeMaterial(p, m, tpl, () => uid('s'));
          r.removed.forEach((s) => gone.add(s.id));
          return { ...m, templateId: tpl.id, templateName: tpl.name, steps: r.steps };
        });
        return { ...p, materials, memos: p.memos.map((n) => (gone.has(n.stepId) ? { ...n, stepId: null } : n)) };
      }),
    }));
    setDetailId(null);
    setDialog(returnTo || null);
    showToast(`"${tpl.name}"을 ${materialIds.length}곳에 ${materialIds.some((x) => x.startsWith('add:')) ? '추가' : '반영'}했어요.`, before);
  };

  const deleteTemplate = (tpl) => {
    const before = data;
    setData((d) => ({ ...d, templates: d.templates.filter((t) => t.id !== tpl.id) }));
    showToast(`"${tpl.name}" 필요 일정을 지웠어요.`, before);
  };

  // ---------- 백업 ----------
  const doExport = () => {
    const day = exportBackup(data);
    setData((d) => ({ ...d, lastBackupAt: day }));
    setBackupHidden(true);
    setSettingsOpen(false);
    showToast('백업 파일을 내려받았어요.');
  };
  const pickImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setDialog({ type: 'import', fileName: file.name, data: parseBackup(String(reader.result)) });
      } catch (e) {
        showToast(`불러오지 못했어요: ${e.message}`);
      }
    };
    reader.readAsText(file);
    setSettingsOpen(false);
  };
  const confirmImport = (next) => {
    setData(next);
    setSelectedId(next.products[0]?.id || null);
    setDetailId(null);
    setDialog(null);
    showToast('백업 파일로 바꿨어요.');
  };

  const daysSinceBackup = data.lastBackupAt ? daysBetween(data.lastBackupAt, todayIso()) : 999;
  // 구글 시트 모드에선 시트 자체에 변경 기록이 남아서 백업 알림은 안 띄워요.
  const showBackupNag = storageMode() === 'demo' && !backupHidden && products.length > 0 && daysSinceBackup >= 7;

  const headerProps = {
    view,
    onPrev: () => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })),
    onNext: () => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })),
    onToday: () => goToDate(todayIso()),
    onNew: () => setDialog({ type: 'new' }),
    settingsOpen,
    setSettingsOpen,
    lastBackupAt: data.lastBackupAt,
    daysSinceBackup,
    onTemplates: () => { setSettingsOpen(false); setDialog({ type: 'templates' }); },
    onExport: doExport,
    onImportFile: pickImportFile,
    saveStatus,
    onRetrySave: retrySave,
    onReload,
  };

  const dialogs = (
    <>
      {dialog?.type === 'new' && (
        <NewProductDialog
          templates={data.templates}
          vendors={data.vendors}
          productTypes={data.productTypes || PRODUCT_TYPES}
          onTypesChange={(productTypes) => setData((d) => ({ ...d, productTypes }))}
          onClose={() => setDialog(null)}
          onCreate={createProduct}
          onNewTemplate={(draft) => setDialog({ type: 'template', template: null, returnTo: { type: 'new', draft } })}
          draft={dialog.draft}
        />
      )}
      {dialog?.type === 'editProduct' && product && (
        <ProductEditDialog
          product={product}
          templates={data.templates}
          vendors={data.vendors}
          productTypes={data.productTypes || PRODUCT_TYPES}
          onTypesChange={(productTypes) => setData((d) => ({ ...d, productTypes }))}
          onClose={() => setDialog(null)}
          onSave={(f) => saveProductInfo(product.id, f)}
        />
      )}
      {dialog?.type === 'templates' && (
        <TemplateListDialog
          templates={data.templates}
          usage={Object.fromEntries(data.templates.map((t) => [t.id, products.reduce((n, p) => n + p.materials.filter((m) => m.templateId === t.id).length, 0)]))}
          onDelete={deleteTemplate}
          onClose={() => setDialog(null)}
          onEdit={(t) => setDialog({ type: 'template', template: t, returnTo: { type: 'templates' } })}
          onNew={() => setDialog({ type: 'template', template: null, returnTo: { type: 'templates' } })}
        />
      )}
      {dialog?.type === 'template' && (
        <TemplateEditorDialog
          template={dialog.template}
          onClose={() => setDialog(dialog.returnTo || null)}
          onSave={(t) => saveTemplate(t, dialog.returnTo)}
        />
      )}
      {dialog?.type === 'applyTemplate' && (
        <ApplyTemplateDialog
          template={dialog.template}
          candidates={applyCandidates(products, dialog.template, dialog.isNew)}
          isNew={dialog.isNew}
          onSkip={() => { setDialog(dialog.returnTo || null); showToast(`"${dialog.template.name}" 필요 일정을 저장했어요. 새로 만드는 제품부터 적용돼요.`); }}
          onApply={(ids) => applyTemplate(dialog.template, ids, dialog.returnTo)}
        />
      )}
      {dialog?.type === 'import' && (
        <ImportConfirmDialog
          fileName={dialog.fileName}
          data={dialog.data}
          onCancel={() => setDialog(null)}
          onConfirm={() => confirmImport(dialog.data)}
        />
      )}
    </>
  );

  if (!product) {
    return (
      <div className="app">
        <Header {...headerProps} />
        <EmptyState
          templates={data.templates}
          onNew={() => setDialog({ type: 'new' })}
          onImportFile={pickImportFile}
        />
        <Notices toast={toast} onUndo={undo} onCloseToast={() => setToast(null)} />
        {dialogs}
      </div>
    );
  }

  return (
    <div className="app">
      <Header {...headerProps} />
      <div className="layout">
        <aside className="sidebar">
          {detail ? (
            <TaskDetail
              ev={detail}
              product={product}
              onBack={() => setDetailId(null)}
              onMove={(d) => askMove(detail.id, d)}
              onAddMemo={(text) => addMemo(product.id, text, detail.id)}
              onEditMemo={(id, text) => editMemo(product.id, id, text)}
              onDeleteMemo={(id) => deleteMemo(product.id, id)}
            />
          ) : (
            <ProductSidebar
              product={product}
              products={products}
              onSelect={(id) => { setSelectedId(id); setDetailId(null); setVendor('전체'); }}
              onNewProduct={() => setDialog({ type: 'new' })}
              onEditProduct={() => setDialog({ type: 'editProduct' })}
              onOpenStep={(id) => { const ev = findEvent(products, id); if (ev) openDetail(ev); }}
              onAddMemo={(text, stepId) => addMemo(product.id, text, stepId)}
              onEditMemo={(id, text) => editMemo(product.id, id, text)}
              onDeleteMemo={(id) => deleteMemo(product.id, id)}
            />
          )}
        </aside>
        <main className="main">
          <Notices
            banner={banner}
            toast={toast}
            backupNag={showBackupNag ? daysSinceBackup : null}
            onBackupNow={doExport}
            onBackupLater={() => setBackupHidden(true)}
            onPushAll={() => applyMove(banner.stepId, banner.to, banner.later)}
            onPushOne={() => applyMove(banner.stepId, banner.to, [])}
            onOffdayKeep={() => proposeMove(banner.stepId, banner.newDate)}
            onOffdayPrev={() => proposeMove(banner.stepId, banner.prev)}
            onCloseBanner={() => setBanner(null)}
            onUndo={undo}
            onCloseToast={() => setToast(null)}
          />
          <CalendarToolbar
            scope={scope}
            setScope={(s) => { setScope(s); setVendor('전체'); }}
            vendor={vendor}
            setVendor={setVendor}
            vendorOptions={vendorOptions}
            products={visibleProducts}
            center={<MonthNav view={view} onPrev={headerProps.onPrev} onNext={headerProps.onNext} />}
            right={<button className="btn" onClick={headerProps.onToday}>오늘</button>}
          />
          <MonthCalendar
            view={view}
            events={events}
            scope={scope}
            products={products}
            activeId={detailId}
            onPick={openDetail}
            onEmpty={() => setDetailId(null)}
          />
          <p className="foot-note">
            칩을 누르면 왼쪽이 그 작업 상세로 바뀌어요 · 돌아가기: 위 버튼, 달력 빈 칸, Esc · 지금은 예시 데이터예요
          </p>
        </main>
      </div>
      {dialogs}
    </div>
  );
}

