import { useState } from 'react';
import Modal from './Modal.jsx';

export default function TemplateListDialog({ templates, usage, onClose, onEdit, onNew, onDelete }) {
  const [asking, setAsking] = useState(null); // 지울지 물어보는 중인 필요 일정 id
  return (
    <Modal title="부자재 필요 일정 관리" hint="부자재마다 쓰는 단계 묶음이에요" onClose={onClose} width={560}>
      <div className="modal-body col gap8">
        {templates.length === 0 && <div className="muted">등록된 필요 일정이 없어요.</div>}
        {templates.map((t) => (
          <div key={t.id} className="tpl-row">
            <button type="button" className="memo-delete" aria-label={`${t.name} 지우기`} title="지우기" onClick={() => setAsking(t.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <div className="grow">
              <div className="strong">{t.name}</div>
              <div className="muted small">
                {t.materialKind} · {t.steps.length ? `단계 ${t.steps.length}개` : '단계 없음'}
                {usage[t.id] ? ` · 제품 ${usage[t.id]}곳에서 사용 중` : ''}
              </div>
            </div>
            {asking !== t.id && <button className="btn sm" onClick={() => onEdit(t)}>수정</button>}
            {asking === t.id && (
                <div className="ask-inline">
                  <span>
                    지울까요?{usage[t.id] ? ' 이미 만든 제품의 일정은 그대로 남아요.' : ''}
                  </span>
                  <div className="row gap6">
                    <button className="btn sm danger" onClick={() => { onDelete(t); setAsking(null); }}>지우기</button>
                    <button className="btn sm" onClick={() => setAsking(null)}>취소</button>
                  </div>
                </div>
            )}
          </div>
        ))}
      </div>
      <div className="modal-foot">
        <span className="grow muted small">수정하면 반영할 제품을 고를 수 있어요.</span>
        <button className="btn primary" onClick={onNew}>+ 새 필요 일정</button>
      </div>
    </Modal>
  );
}
