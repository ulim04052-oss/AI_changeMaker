// 화면 가운데 뜨는 창의 공통 틀
export default function Modal({ title, hint, onClose, children, width = 1160 }) {
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <div className="modal-head">
          <h2 className="grow">{title}</h2>
          {hint && <span className="muted small hide-sm">{hint}</span>}
          <button className="btn icon" aria-label="닫기" onClick={onClose}>×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
