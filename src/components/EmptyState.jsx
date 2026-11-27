import { useRef } from 'react';

export default function EmptyState({ templates, onNew, onImportFile }) {
  const fileRef = useRef(null);
  const ready = templates.map((t) => t.name);
  return (
    <div className="empty">
      <h2>아직 제품이 없어요</h2>
      <p className="muted">
        런칭일만 넣으면 부자재 일정이 달력에 채워져요.<br />
        미리 준비된 필요 일정 {ready.length}개: {ready.join(', ')}
      </p>
      <button className="btn primary lg" onClick={onNew}>+ 첫 제품 만들기</button>
      <button className="btn text" onClick={() => fileRef.current?.click()}>백업 파일이 있어요 → 불러오기</button>
      <input
        ref={fileRef} type="file" accept="application/json,.json" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
