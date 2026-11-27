import { useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import { KINDS, KIND_ORDER, MATERIAL_KINDS, UNITS } from '../data/constants.js';
import { arrivals, mdw, stepsFromTemplate } from '../engine/dates.js';

const EXAMPLE_LAUNCH = '2027-03-16';
const FIXED_BASES = ['부자재 입고', '완제품 입고', '런칭'];

export default function TemplateEditorDialog({ template, onClose, onSave }) {
  const [t, setT] = useState(
    () => template ? JSON.parse(JSON.stringify(template)) : { id: 'tpl-' + Date.now(), name: '', materialKind: '튜브', steps: [] }
  );
  const set = (patch) => setT((x) => ({ ...x, ...patch }));
  const setStep = (i, patch) => setT((x) => ({ ...x, steps: x.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const customKind = !MATERIAL_KINDS.includes(t.materialKind);

  const arr = arrivals(EXAMPLE_LAUNCH, { finishedN: 1, finishedUnit: '달', materialN: 2, materialUnit: '주' });
  const preview = useMemo(() => {
    const fixed = { 런칭: EXAMPLE_LAUNCH, '완제품 입고': arr.finished, '부자재 입고': arr.material };
    return [...stepsFromTemplate(t, fixed), { name: '부자재 입고', kind: 'data', date: arr.material }]
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [t, arr.finished, arr.material]);

  const addStep = () => {
    const last = t.steps[t.steps.length - 1];
    set({ steps: [...t.steps, { name: `새 단계 ${t.steps.length + 1}`, kind: 'sample', base: last ? last.name : '부자재 입고', n: 1, unit: '주' }] });
  };

  return (
    <Modal title="필요 일정 만들기" hint="새 제품 화면의 [+ 새 필요 일정] 또는 설정 › 필요 일정 관리에서 열려요" onClose={onClose}>
      <div className="modal-body two-col">
        <div className="col gap20 form-col wide">
          <div className="form-grid">
            <label htmlFor="tpl-name">이름</label>
            <input id="tpl-name" className="input" value={t.name} onChange={(e) => set({ name: e.target.value })} placeholder="예: 튜브 필요 일정 · KBI" autoFocus />
            <span>부자재 종류</span>
            <div className="row wrap gap6">
              {MATERIAL_KINDS.map((k) => (
                <button key={k} type="button" className={'pill' + (t.materialKind === k ? ' on' : '')} onClick={() => set({ materialKind: k })}>{k}</button>
              ))}
              <button type="button" className={'pill' + (customKind ? ' on' : '')} onClick={() => set({ materialKind: customKind ? t.materialKind : '' })}>+ 직접 입력</button>
              {customKind && <input className="input sm" value={t.materialKind} onChange={(e) => set({ materialKind: e.target.value })} aria-label="부자재 종류 직접 입력" />}
            </div>
          </div>

          <div className="col gap8">
            <div>
              <h3 className="card-title">단계</h3>
              <div className="muted small">순서 번호는 없어요. 각 단계는 "무엇 기준 얼마 전"만 적어요.</div>
            </div>
            <div className="step-grid head">
              <span>단계 이름</span><span>작업 유형 (색)</span><span>기준</span><span>얼마나</span><span>단위</span><span />
            </div>
            {t.steps.map((s, i) => {
              const bases = [...FIXED_BASES, ...t.steps.filter((_, j) => j !== i).map((x) => x.name)];
              return (
                <div key={i} className="step-grid">
                  <input className="input" value={s.name} onChange={(e) => setStep(i, { name: e.target.value })} aria-label="단계 이름" />
                  <label className="kind-select" style={{ '--dot': KINDS[s.kind].dot }}>
                    <span className="dot" />
                    <select value={s.kind} onChange={(e) => setStep(i, { kind: e.target.value })} aria-label="작업 유형">
                      {KIND_ORDER.map((k) => <option key={k} value={k}>{KINDS[k].name}</option>)}
                    </select>
                  </label>
                  <select className="input" value={s.base} onChange={(e) => setStep(i, { base: e.target.value })} aria-label="기준">
                    {bases.map((b) => <option key={b} value={b}>{b} 전</option>)}
                  </select>
                  <div className="stepper">
                    <button type="button" aria-label="줄이기" onClick={() => setStep(i, { n: Math.max(1, s.n - 1) })}>−</button>
                    <span className="num">{s.n}</span>
                    <button type="button" aria-label="늘리기" onClick={() => setStep(i, { n: s.n + 1 })}>+</button>
                  </div>
                  <div className="segmented sm">
                    {UNITS.map((u) => (
                      <button key={u} type="button" className={s.unit === u ? 'on' : ''} onClick={() => setStep(i, { unit: u })}>{u}</button>
                    ))}
                  </div>
                  <button type="button" className="btn icon" aria-label="단계 빼기" onClick={() => set({ steps: t.steps.filter((_, j) => j !== i) })}>×</button>
                </div>
              );
            })}
            <div className="row gap8">
              <button type="button" className="btn dashed strong" onClick={addStep}>+ 단계 추가</button>
              <span className="muted small">"기준"에는 부자재 입고 · 완제품 입고 · 런칭 · 이 필요 일정의 다른 단계를 고를 수 있어요.</span>
            </div>
          </div>
        </div>

        <aside className="preview narrow">
          <b>미리보기</b>
          <div className="muted small">
            예시 런칭일 {mdw(EXAMPLE_LAUNCH)} → 완제품 입고 {mdw(arr.finished)} → 부자재 입고 <b>{mdw(arr.material)}</b>로 계산하면
          </div>
          <ol className="preview-list">
            {preview.map((p, i) => (
              <li key={i}>
                <span className="dot" style={{ background: KINDS[p.kind].dot }} />
                <span className="grow">{p.name}</span>
                <span className="num date-col">{mdw(p.date)}</span>
              </li>
            ))}
          </ol>
          <div className="muted small">단위를 눌러 바꿔보세요. 영업일은 주말·공휴일을 빼고 세고, 주는 7일, 달은 달력 1달이에요.</div>
        </aside>
      </div>
      <div className="modal-foot">
        <span className="grow muted">고치면 <b>새로 만드는 제품부터</b> 적용돼요. 이미 진행 중인 제품 일정은 그대로예요.</span>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn primary" disabled={!t.name.trim() || !t.materialKind.trim()} onClick={() => onSave(t)}>저장</button>
      </div>
    </Modal>
  );
}
