import { useState } from 'react';
import { KINDS, colorOf } from '../data/constants.js';
import { full } from '../engine/dates.js';
import MemoComposer from './MemoComposer.jsx';
import MemoItem from './MemoItem.jsx';

// 칩을 누르면 왼쪽 패널이 이 화면으로 바뀌어요 (팝업 없음)
export default function TaskDetail({ ev, product, onBack, onMove, onAddMemo, onEditMemo, onDeleteMemo }) {
  const [editingDate, setEditingDate] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draftDate, setDraftDate] = useState(ev.date);
  const commitDate = () => {
    if (draftDate && draftDate !== ev.date) onMove(draftDate);
    setEditingDate(false);
  };
  const kind = KINDS[ev.kind];
  const memos = product.memos.filter((m) => m.stepId === ev.id);

  return (
    <>
      <button className="back-link" onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        <span className="dot" style={{ background: colorOf(product.color).dot }} />
        <span className="grow">{product.name}로 돌아가기</span>
        <kbd>Esc</kbd>
      </button>

      <section className="card detail-head" style={{ borderColor: kind.ink }}>
        <span className="kind-badge" style={{ background: kind.tint, color: kind.ink }}>
          <span className="dot" style={{ background: kind.dot }} />{kind.name}
        </span>
        <h2 className="detail-title">{ev.label}</h2>
        <div className="muted">{product.name}</div>
        <dl className="info-grid">
          <dt>날짜</dt>
          <dd>
            {editingDate && ev.editable ? (
              // 달력에서 화살표로 달을 넘기면 브라우저가 값을 바로 바꿔버려서,
              // 고른 날짜는 '적용'을 눌러야 반영되게 했어요.
              <span className="row gap8 wrap">
                <input
                  type="date"
                  value={draftDate}
                  autoFocus
                  onChange={(e) => setDraftDate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitDate();
                    if (e.key === 'Escape') { e.stopPropagation(); setEditingDate(false); }
                  }}
                  aria-label="새 날짜"
                />
                <button className="btn sm primary" onClick={commitDate} disabled={!draftDate || draftDate === ev.date}>적용</button>
                <button className="btn sm" onClick={() => setEditingDate(false)}>취소</button>
              </span>
            ) : (
              <span className="row gap8 wrap">
                <b>{full(ev.date)}</b>
                {ev.editable ? (
                  <button className="btn sm" onClick={() => { setDraftDate(ev.date); setEditingDate(true); }}>날짜 바꾸기</button>
                ) : (
                  <span className="tag">{ev.manual ? '직접 고름' : ev.auto ? '자동 계산' : '기준일'}</span>
                )}
              </span>
            )}
          </dd>
          {ev.vendor && (<><dt>업체</dt><dd>{ev.vendor}</dd></>)}
          <dt>필요 일정</dt><dd>{ev.rule}</dd>
        </dl>
        {!ev.editable && (
          <div className="muted small">{ev.manual ? '이 날짜는 제품 정보 [수정]에서 바꿀 수 있어요.' : '이 날짜는 런칭일에서 자동으로 계산돼요. 런칭일은 제품 정보 [수정]에서 바꿀 수 있어요.'}</div>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">이 작업에 연결된 메모</h3>
        {memos.length === 0 && !composing && <div className="muted small">아직 없어요.</div>}
        {memos.map((m) => <MemoItem key={m.id} memo={m} onEdit={onEditMemo} onDelete={onDeleteMemo} />)}
        {composing ? (
          <MemoComposer
            steps={[ev]}
            fixedStepId={ev.id}
            onCancel={() => setComposing(false)}
            onSave={(text) => { onAddMemo(text); setComposing(false); }}
          />
        ) : (
          <button className="btn dashed" onClick={() => setComposing(true)}>+ 메모 추가</button>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">변경 기록</h3>
        {(ev.changes || []).length === 0 ? (
          <div className="muted small">바뀐 적 없어요.</div>
        ) : (
          ev.changes.map((c, i) => <div key={i} className="change">{c}</div>)
        )}
      </section>
    </>
  );
}
