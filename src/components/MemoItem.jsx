import { useLayoutEffect, useRef } from 'react';

// 이슈 메모 한 개: 글자를 눌러 바로 고치고, 오른쪽 위 x로 지워요.
export default function MemoItem({ memo, onEdit, onDelete, children }) {
  const ref = useRef(null);
  // 글 길이에 맞춰 높이 자동 조절
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [memo.text]);
  return (
    <div className="memo">
      <button type="button" className="memo-delete" aria-label="메모 지우기" title="메모 지우기" onClick={() => onDelete(memo.id)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <textarea
        ref={ref}
        className="memo-text"
        rows={1}
        value={memo.text}
        aria-label="메모 내용 (눌러서 바로 고치기)"
        onChange={(e) => onEdit(memo.id, e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) onDelete(memo.id); }}
      />
      {children}
    </div>
  );
}
