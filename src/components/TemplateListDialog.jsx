import Modal from './Modal.jsx';

export default function TemplateListDialog({ templates, onClose, onEdit, onNew }) {
  return (
    <Modal title="필요 일정 관리" hint="부자재마다 쓰는 단계 묶음이에요" onClose={onClose} width={560}>
      <div className="modal-body col gap8">
        {templates.map((t) => (
          <div key={t.id} className="tpl-row">
            <div className="grow">
              <div className="strong">{t.name}</div>
              <div className="muted small">{t.materialKind} · {t.steps.length ? `단계 ${t.steps.length}개` : '단계 없음'}</div>
            </div>
            <button className="btn sm" onClick={() => onEdit(t)}>고치기</button>
          </div>
        ))}
      </div>
      <div className="modal-foot">
        <span className="grow muted small">고치면 새로 만드는 제품부터 적용돼요.</span>
        <button className="btn primary" onClick={onNew}>+ 새 필요 일정</button>
      </div>
    </Modal>
  );
}
