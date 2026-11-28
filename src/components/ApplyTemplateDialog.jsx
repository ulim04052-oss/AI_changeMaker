import { useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import { colorOf } from '../data/constants.js';
import { freshSteps, recomputeMaterial } from '../engine/applyTemplate.js';

// 필요 일정을 저장한 뒤: "이미 만든 제품 중 어디에 반영할까요?"
export default function ApplyTemplateDialog({ template, candidates, isNew, onApply, onSkip }) {
  const [checked, setChecked] = useState(() => new Set(candidates.filter((c) => c.uses).map((c) => c.key)));
  const rows = useMemo(
    () => candidates.map((c) => ({
      ...c,
      preview: c.add
        ? { changed: 0, added: freshSteps(c.product, template, () => 'x').length, removed: [] }
        : recomputeMaterial(c.product, c.material, template, () => 'x'),
    })),
    [candidates, template]
  );
  const toggle = (id) => setChecked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <Modal title={isNew ? '이미 만든 제품에도 추가할까요?' : '이미 만든 제품에도 반영할까요?'} hint={template.name} onClose={onSkip} width={640}>
      <div className="modal-body col gap12">
        <div className="muted">
          {isNew ? (
            <>"{template.name}"을 만들었어요. 체크한 제품에 '{template.materialKind}' 일정이 새로 생겨요. 업체는 나중에 제품 정보 수정에서 적으면 돼요.</>
          ) : (
            <>"{template.name}"을 저장했어요. 반영할 제품을 체크하면 그 부자재 일정이 바뀐 필요 일정대로 다시 계산돼요.
            지금 이 필요 일정을 쓰는 제품은 미리 체크해 뒀어요.</>
          )}
        </div>
        <ul className="apply-list">
          {rows.map(({ key, product, material, uses, add, preview }) => {
            const bits = [];
            if (preview.changed) bits.push(`날짜 바뀜 ${preview.changed}개`);
            if (preview.added) bits.push(`새로 생김 ${preview.added}개`);
            if (preview.removed.length) bits.push(`빠짐 ${preview.removed.length}개 (${preview.removed.map((s) => s.name).join(', ')})`);
            return (
              <li key={key}>
                <label>
                  <input type="checkbox" checked={checked.has(key)} onChange={() => toggle(key)} />
                  <span className="dot" style={{ background: colorOf(product.color).dot }} />
                  <span className="grow">
                    <b>{product.name}</b> · {add ? template.materialKind : material.name}{' '}
                    {!add && material.vendor && <span className="muted">({material.vendor})</span>}
                    <span className="muted small" style={{ display: 'block' }}>
                      {add ? '이 제품에 새로 추가' : uses ? '이 필요 일정 사용 중' : `지금: ${material.templateName || '다른 필요 일정'}`} · {bits.length ? bits.join(' · ') : '바뀌는 날짜 없음'}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {!isNew && <div className="note-box">직접 바꾼 날짜도 필요 일정대로 다시 계산돼요. 반영한 뒤에 마음에 안 들면 '되돌리기'를 누르면 돼요.</div>}
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={onSkip}>{isNew ? '추가 안 함 (새 제품부터)' : '반영 안 함 (새 제품부터)'}</button>
        <div className="grow" />
        <button className="btn primary" disabled={checked.size === 0} onClick={() => onApply([...checked])}>
          선택한 {checked.size}곳에 {isNew ? '추가' : '반영'}
        </button>
      </div>
    </Modal>
  );
}
