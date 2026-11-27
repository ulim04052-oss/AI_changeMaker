import { useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import { CHANNELS, MATERIAL_KINDS, PRODUCT_COLORS, PRODUCT_TYPES, UNITS } from '../data/constants.js';
import { arrivals, md, mdw, workdayDiff } from '../engine/dates.js';

// 제품 정보 칸을 누르면 뜨는 수정 창 (새 제품 추가와 같은 모양)
export default function ProductEditDialog({ product, templates, vendors, onClose, onSave }) {
  const [f, setF] = useState(() => ({
    name: product.name,
    type: product.type,
    channel: product.channel || '',
    color: product.color,
    launch: product.launch,
    gaps: { ...product.gaps },
    materials: product.materials.map((m) => ({ id: m.id, kind: m.name, vendor: m.vendor, steps: m.steps.length })),
    reschedule: 'arrivals',
  }));
  const [gapOpen, setGapOpen] = useState(false);
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const setGap = (patch) => setF((x) => ({ ...x, gaps: { ...x.gaps, ...patch } }));
  const setMat = (i, patch) => setF((x) => ({ ...x, materials: x.materials.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const customType = !PRODUCT_TYPES.includes(f.type);

  const arr = useMemo(() => (f.launch ? arrivals(f.launch, f.gaps) : null), [f.launch, f.gaps]);
  const datesChanged = arr && (arr.material !== product.materialArrival || arr.finished !== product.finishedArrival || f.launch !== product.launch);
  const shiftDays = arr ? workdayDiff(product.materialArrival, arr.material) : 0;
  const stepCount = product.materials.reduce((n, m) => n + m.steps.length, 0);
  const removed = product.materials.filter((m) => !f.materials.some((x) => x.id === m.id));
  const canSave = f.name.trim() && f.launch && f.materials.every((m) => m.kind.trim() && m.vendor.trim() && (m.id || m.templateId));

  return (
    <Modal title="제품 정보 수정" hint={product.name} onClose={onClose} width={760}>
      <datalist id="edit-vendor-list">{vendors.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="edit-channel-list">{CHANNELS.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="edit-kind-list">{[...MATERIAL_KINDS, '용기', '캡'].map((v) => <option key={v} value={v} />)}</datalist>
      <div className="modal-body col gap20">
        <div className="form-grid">
          <label htmlFor="pe-name">제품명</label>
          <input id="pe-name" className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus />

          <span>제품 유형</span>
          <div className="row wrap gap6">
            {PRODUCT_TYPES.map((t) => (
              <button key={t} type="button" className={'pill' + (f.type === t ? ' on' : '')} onClick={() => set({ type: t })}>{t}</button>
            ))}
            <button type="button" className={'pill' + (customType ? ' on' : '')} onClick={() => set({ type: customType ? f.type : '' })}>+ 직접 입력</button>
            {customType && <input className="input sm" value={f.type} onChange={(e) => set({ type: e.target.value })} aria-label="제품 유형 직접 입력" />}
          </div>

          <label htmlFor="pe-channel">유통</label>
          <input id="pe-channel" className="input" list="edit-channel-list" value={f.channel} onChange={(e) => set({ channel: e.target.value })} placeholder="예: 올리브영" />

          <label htmlFor="pe-launch">런칭일</label>
          <div className="row wrap gap8">
            <input id="pe-launch" type="date" className="input" value={f.launch} onChange={(e) => set({ launch: e.target.value })} />
            <button type="button" className="btn sm" onClick={() => setGapOpen(!gapOpen)}>입고 간격 바꾸기</button>
          </div>

          <span>제품 색</span>
          <div className="row gap8">
            {PRODUCT_COLORS.map((c) => (
              <button
                key={c.id} type="button" aria-label={c.label} aria-pressed={f.color === c.id}
                className={'swatch' + (f.color === c.id ? ' on' : '')} style={{ background: c.dot }}
                onClick={() => set({ color: c.id })}
              />
            ))}
          </div>
        </div>

        {gapOpen && (
          <div className="gap-box">
            <span>완제품 입고 = 런칭</span>
            <input type="number" min="0" className="input num-in" value={f.gaps.finishedN} onChange={(e) => setGap({ finishedN: Math.max(0, +e.target.value) })} aria-label="완제품 입고 간격" />
            <select className="input sm" value={f.gaps.finishedUnit} onChange={(e) => setGap({ finishedUnit: e.target.value })} aria-label="단위">
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
            <span>전 · 부자재 입고 = 완제품 입고</span>
            <input type="number" min="0" className="input num-in" value={f.gaps.materialN} onChange={(e) => setGap({ materialN: Math.max(0, +e.target.value) })} aria-label="부자재 입고 간격" />
            <select className="input sm" value={f.gaps.materialUnit} onChange={(e) => setGap({ materialUnit: e.target.value })} aria-label="단위">
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
            <span>전</span>
          </div>
        )}

        {arr && (
          <div className="col gap8">
            <div className="arrival-row">
              <span className="arrival-name">부자재 입고</span>
              <b className="num">{mdw(arr.material)}</b>
              {arr.material !== product.materialArrival && <span className="muted small">원래 {md(product.materialArrival)}</span>}
            </div>
            <div className="arrival-row">
              <span className="arrival-name">완제품 입고</span>
              <b className="num">{mdw(arr.finished)}</b>
              {arr.finished !== product.finishedArrival && <span className="muted small">원래 {md(product.finishedArrival)}</span>}
            </div>
          </div>
        )}

        {datesChanged && stepCount > 0 && (
          <fieldset className="choice-box">
            <legend>런칭일이 바뀌었어요. 부자재 일정 {stepCount}개는 어떻게 할까요?</legend>
            <label className="row gap8">
              <input type="radio" name="reschedule" checked={f.reschedule === 'arrivals'} onChange={() => set({ reschedule: 'arrivals' })} />
              <span>입고일만 다시 계산하고, 부자재 일정은 그대로 두기</span>
            </label>
            <label className="row gap8">
              <input type="radio" name="reschedule" checked={f.reschedule === 'shift'} onChange={() => set({ reschedule: 'shift' })} />
              <span>부자재 일정도 같이 옮기기 ({shiftDays >= 0 ? '뒤로' : '앞으로'} {Math.abs(shiftDays)}영업일)</span>
            </label>
          </fieldset>
        )}

        <div className="sep" />

        <div className="col gap10">
          <h3 className="card-title">부자재 · 업체</h3>
          {f.materials.map((m, i) => (
            <div key={m.id || 'new' + i} className="mat-row">
              <input className="input strong" list="edit-kind-list" value={m.kind} onChange={(e) => setMat(i, { kind: e.target.value })} aria-label="부자재 종류" />
              <input className="input" list="edit-vendor-list" value={m.vendor} onChange={(e) => setMat(i, { vendor: e.target.value })} aria-label="업체" placeholder="업체" />
              {m.id ? (
                <span className="muted small">일정 {m.steps}개 · 그대로 유지</span>
              ) : (
                <select className="input" value={m.templateId} onChange={(e) => setMat(i, { templateId: e.target.value })} aria-label="필요 일정">
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              <button type="button" className="btn icon" aria-label="이 부자재 빼기" onClick={() => set({ materials: f.materials.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          <button
            type="button" className="btn dashed strong" style={{ alignSelf: 'flex-start' }}
            onClick={() => set({ materials: [...f.materials, { kind: '단상자', vendor: '', templateId: templates.find((t) => t.materialKind === '단상자')?.id || templates[0]?.id }] })}
          >+ 부자재 추가</button>
          {removed.length > 0 && (
            <div className="danger-box">
              {removed.map((m) => m.name).join(', ')}를 빼면 그 일정 {removed.reduce((n, m) => n + m.steps.length, 0)}개도 달력에서 사라져요.
            </div>
          )}
        </div>
      </div>
      <div className="modal-foot">
        <div className="grow" />
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn primary" disabled={!canSave} onClick={() => onSave(f)}>저장</button>
      </div>
    </Modal>
  );
}
