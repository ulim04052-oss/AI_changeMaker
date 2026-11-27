import { useEffect, useMemo, useState } from 'react';
import { loadAll, saveAll, exportBackup, parseBackup } from './storage/storage.js';
import { allEvents, findEvent } from './data/selectors.js';
import {
  addWorkdays, arrivals, isOffDay, md, parse, prevWorkday, stepsFromTemplate, todayIso, workdayDiff,
} from './engine/dates.js';
import Header from './components/Header.jsx';
import ProductSidebar from './components/ProductSidebar.jsx';
import TaskDetail from './components/TaskDetail.jsx';
import CalendarToolbar from './components/CalendarToolbar.jsx';
import MonthCalendar from './components/MonthCalendar.jsx';
import Notices from './components/Notices.jsx';
import EmptyState from './components/EmptyState.jsx';
import NewProductDialog from './components/NewProductDialog.jsx';
import ProductEditDialog from './components/ProductEditDialog.jsx';
import TemplateEditorDialog from './components/TemplateEditorDialog.jsx';
import TemplateListDialog from './components/TemplateListDialog.jsx';
import ImportConfirmDialog from './components/ImportConfirmDialog.jsx';

const uid = (p) => p + Math.random().toString(36).slice(2, 8);
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);

export default function App() {
  const [data, setData] = useState(loadAll);
  const [selectedId, setSelectedId] = useState(() => data.products[0]?.id || null);
  const [scope, setScope] = useState('one'); // 'one' = 이 제품만, 'all' = 전체 제품
  const [vendor, setVendor] = useState('전체');
  const [view, setView] = useState({ year: 2026, month: 11 }); // 예시 데이터가 있는 2026년 12월부터
  const [detailId, setDetailId] = useState(null);
  const [banner, setBanner] = useState(null); // 노란 물어보기 / 빨간 경고
  const [toast, setToast] = useState(null); // 검은 알림 (+ 되돌리기)
  const [backupHidden, setBackupHidden] = useState(false);
  const [dialog, setDialog] = useState(null); // { type, ... }
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => saveAll(data), [data]);

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
        id: uid(pid + '-'), name: row.kind, vendor: row.vendor, templateName: t.name,
        steps: stepsFromTemplate(t, fixed).map((s) => ({
          id: uid('s'), name: s.name, kind: s.kind, date: s.date, rule: s.rule, changes: [],
        })),
      };
    });
    const p = {
      id: pid, name: form.name, type: form.type, channel: form.channel.trim(), color: form.color, launch: form.launch,
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
    const materials = form.materials.map((row) => {
      if (row.id) {
        kept.add(row.id);
        const m = old.materials.find((x) => x.id === row.id);
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
        id: uid(pid + '-'), name: row.kind.trim(), vendor: row.vendor.trim(), templateName: t.name,
        steps: stepsFromTemplate(t, fixed).map((s) => ({ id: uid('s'), name: s.name, kind: s.kind, date: s.date, rule: s.rule, changes: [] })),
      };
    });
    const goneSteps = new Set(old.materials.filter((m) => !kept.has(m.id)).flatMap((m) => m.steps.map((s) => s.id)));
    updateProduct(pid, (p) => ({
      ...p, name: form.name.trim(), type: form.type, channel: form.channel.trim(), color: form.color,
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
    setData((d) => {
      const exists = d.templates.some((t) => t.id === tpl.id);
      return { ...d, templates: exists ? d.templates.map((t) => (t.id === tpl.id ? tpl : t)) : [...d.templates, tpl] };
    });
    setDialog(returnTo || null);
    showToast(`"${tpl.name}" 필요 일정을 저장했어요. 새로 만드는 제품부터 적용돼요.`);
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
  const showBackupNag = !backupHidden && products.length > 0 && daysSinceBackup >= 7;

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
  };

  const dialogs = (
    <>
      {dialog?.type === 'new' && (
        <NewProductDialog
          templates={data.templates}
          vendors={data.vendors}
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
          onClose={() => setDialog(null)}
          onSave={(f) => saveProductInfo(product.id, f)}
        />
      )}
      {dialog?.type === 'templates' && (
        <TemplateListDialog
          templates={data.templates}
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

