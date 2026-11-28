import { useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import { colorOf } from '../data/constants.js';
import { recomputeMaterial } from '../engine/applyTemplate.js';

// 필요 일정을 저장한 뒤: "이미 만든 제품 중 어디에 반영할까요?"
export default function ApplyTemplateDialog({ template, candidates, onApply, onSkip }) {
  const [checked, setChecked] = useState(() => new Set(candidates.filter((c) => c.uses).map((c) => c.material.id)));
  const rows = useMemo(
    () => candidates.map((c) => ({ ...c, preview: recomputeMaterial(c.product, c.material, template, () => 'x') })),
    [candidates, template]
  );
  const toggle = (id) => setChecked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <Modal title="이미 만든 제품에도 반영할까요?" hint={template.name} onClose={onSkip} width={640}>
      <div className="modal-body col gap12">
        <div className="muted">
          "{template.name}"을 저장했어요. 반영할 제품을 체크하면 그 부자재 일정이 바뀐 필요 일정대로 다시 계산돼요.
          지금 이 필요 일정을 쓰는 제품은 미리 체크해 뒀어요.
        </div>
        <ul className="apply-list">
          {rows.map(({ product, material, uses, preview }) => {
            const bits = [];
            if (preview.changed) bits.push(`날짜 바뀜 ${preview.changed}개`);
            if (preview.added) bits.push(`새로 생김 ${preview.added}개`);
            if (preview.removed.length) bits.push(`빠짐 ${preview.removed.length}개 (${preview.removed.map((s) => s.name).join(', ')})`);
            return (
              <li key={material.id}>
                <label>
                  <input type="checkbox" checked={checked.has(material.id)} onChange={() => toggle(material.id)} />
                  <span className="dot" style={{ background: colorOf(product.color).dot }} />
                  <span className="grow">
                    <b>{product.name}</b> · {material.name} <span className="muted">({material.vendor})</span>
                    <span className="muted small" style={{ display: 'block' }}>
                      {uses ? '이 필요 일정 사용 중' : `지금: ${material.templateName || '다른 필요 일정'}`} · {bits.length ? bits.join(' · ') : '바뀌는 날짜 없음'}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="note-box">직접 바꾼 날짜도 필요 일정대로 다시 계산돼요. 반영한 뒤에 마음에 안 들면 '되돌리기'를 누르면 돼요.</div>
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={onSkip}>반영 안 함 (새 제품부터)</button>
        <div className="grow" />
        <button className="btn primary" disabled={checked.size === 0} onClick={() => onApply([...checked])}>
          선택한 {checked.size}곳에 반영
        </button>
      </div>
    </Modal>
  );
}
