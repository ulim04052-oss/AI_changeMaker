import Modal from './Modal.jsx';

export default function ImportConfirmDialog({ fileName, data, onCancel, onConfirm }) {
  const memoCount = data.products.reduce((n, p) => n + (p.memos?.length || 0), 0);
  return (
    <Modal title="이 파일로 바꿀까요?" onClose={onCancel} width={440}>
      <div className="modal-body col gap10">
        <div className="muted">
          {fileName}<br />
          제품 {data.products.length}개 · 필요 일정 {data.templates.length}개 · 메모 {memoCount}개
        </div>
        <div className="danger-box">지금 화면의 데이터는 이 파일 내용으로 바뀌어요.</div>
      </div>
      <div className="modal-foot">
        <div className="grow" />
        <button className="btn" onClick={onCancel}>취소</button>
        <button className="btn primary" onClick={onConfirm}>바꾸기</button>
      </div>
    </Modal>
  );
}
