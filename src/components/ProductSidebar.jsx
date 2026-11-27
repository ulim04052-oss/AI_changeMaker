import { useState } from 'react';
import { KINDS, colorOf } from '../data/constants.js';
import { full, mdw } from '../engine/dates.js';
import { productEvents } from '../data/selectors.js';
import MemoComposer from './MemoComposer.jsx';
import MemoItem from './MemoItem.jsx';

export default function ProductSidebar({ product, products, onSelect, onNewProduct, onOpenStep, onAddMemo, onEditMemo, onDeleteMemo, onEditProduct }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [composing, setComposing] = useState(false);
  const color = colorOf(product.color);
  const t = Math.min(tab, product.materials.length - 1);
  const cur = product.materials[t];
  const events = productEvents(product);
  const byId = Object.fromEntries(events.map((e) => [e.id, e]));

  const rows = cur
    ? [
        ...[...cur.steps].sort((a, b) => (a.date < b.date ? -1 : 1)).map((s) => ({ ...s, open: s.id })),
        { id: 'mat', name: '부자재 입고', kind: 'data', date: product.materialArrival, auto: true, open: `${product.id}:mat` },
        { id: 'launch', name: '런칭', kind: 'launch', date: product.launch, bold: true, open: `${product.id}:launch` },
      ]
    : [];

  return (
    <>
      <div className="menu-wrap">
        <button className="product-switch" style={{ '--dot': color.dot }} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={`${product.name}, 다른 제품으로 바꾸기`}>
          <span className="dot lg" />
          <span className="product-switch-name">{product.name}</span>
          <svg className="switch-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {menuOpen && (
          <div className="menu product-menu">
            {products.map((p) => (
              <button
                key={p.id}
                className={'menu-item row' + (p.id === product.id ? ' current' : '')}
                onClick={() => { onSelect(p.id); setMenuOpen(false); setTab(0); }}
              >
                <span className="dot" style={{ background: colorOf(p.color).dot }} />
                <span className="grow">{p.name}</span>
                <span className="muted small">런칭 {mdw(p.launch).split(' ')[0]}</span>
              </button>
            ))}
            <div className="menu-sep" />
            <button className="menu-item strong" onClick={() => { setMenuOpen(false); onNewProduct(); }}>+ 새 제품 추가</button>
          </div>
        )}
      </div>

      <section className="card clickable" onClick={onEditProduct} title="눌러서 제품 정보 고치기">
        <div className="row">
          <h3 className="card-title grow">제품 정보</h3>
          <button type="button" className="btn sm ghost" onClick={(e) => { e.stopPropagation(); onEditProduct(); }}>수정</button>
        </div>
        <dl className="info-grid">
          <dt>유형</dt><dd>{product.type}</dd>
          <dt>제조사</dt><dd>{product.maker || <span className="muted">미정</span>}</dd>
          <dt>유통</dt><dd>{product.channel || <span className="muted">미정</span>}</dd>
          <dt>런칭일</dt><dd className="strong">{full(product.launch)}</dd>
          <dt>부자재 입고</dt><dd>{full(product.materialArrival)} <span className="muted small">자동 · 공통</span></dd>
          <dt>완제품 입고</dt><dd>{full(product.finishedArrival)} <span className="muted small">자동 계산</span></dd>
        </dl>
        <div className="sep" />
        <h3 className="card-title">부자재 · 업체</h3>
        <ul className="mat-list">
          {product.materials.map((m) => (
            <li key={m.id}><span className="dot sm" /><b>{m.name}</b><span className="muted">{m.vendor}</span></li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3 className="card-title">부자재별 일정</h3>
        <div className="pills">
          {product.materials.map((m, i) => (
            <button key={m.id} className={'pill' + (i === t ? ' on' : '')} onClick={() => setTab(i)}>{m.name}</button>
          ))}
        </div>
        {cur && <div className="muted small">{cur.vendor} · {cur.templateName}</div>}
        <ol className="step-list">
          {rows.map((s) => (
            <li key={s.id}>
              <button className="step-row" onClick={() => onOpenStep(s.open)}>
                <span className="dot" style={{ background: KINDS[s.kind].dot }} />
                <span className={'grow' + (s.bold ? ' strong' : '')}>{s.name}</span>
                {s.auto && <span className="tag">자동</span>}
                {byId[s.open]?.memoCount > 0 && <span className="bubble" aria-label="연결된 메모 수">{byId[s.open].memoCount}</span>}
                <span className="num">{mdw(s.date)}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h3 className="card-title">이슈 메모</h3>
        {product.memos.length === 0 && <div className="muted small">아직 메모가 없어요.</div>}
        {product.memos.map((m) => {
          const linked = m.stepId ? byId[m.stepId] : null;
          return (
            <MemoItem key={m.id} memo={m} onEdit={onEditMemo} onDelete={onDeleteMemo}>
              {linked ? (
                <button
                  className="link-tag"
                  style={{ background: KINDS[linked.kind].tint, color: KINDS[linked.kind].ink }}
                  onClick={() => onOpenStep(linked.id)}
                  title="누르면 달력이 그 날짜로 이동해요"
                >
                  <LinkIcon /> {linked.label} {mdw(linked.date).split(' ')[0]}
                </button>
              ) : (
                <div className="muted small">제품 전체 · 연결 없음</div>
              )}
            </MemoItem>
          );
        })}
        {composing ? (
          <MemoComposer
            steps={events}
            onCancel={() => setComposing(false)}
            onSave={(text, stepId) => { onAddMemo(text, stepId); setComposing(false); }}
          />
        ) : (
          <button className="btn dashed" onClick={() => setComposing(true)}>+ 메모 추가</button>
        )}
      </section>
    </>
  );
}

export function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}
