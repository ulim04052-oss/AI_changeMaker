import { useState } from 'react';
import { mdw } from '../engine/dates.js';

// 이슈 메모 쓰기: 내용 + (선택) 연결할 일정
export default function MemoComposer({ steps, fixedStepId, onSave, onCancel }) {
  const [text, setText] = useState('');
  const [stepId, setStepId] = useState(fixedStepId || '');
  const sorted = [...steps].sort((a, b) => (a.date < b.date ? -1 : 1));
  return (
    <form
      className="memo-form"
      onSubmit={(e) => { e.preventDefault(); if (text.trim()) onSave(text.trim(), stepId || null); }}
    >
      <label className="field">
        <span>내용</span>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="예: CT 결과 보고 전에 라벨 컬러 확정 필요" autoFocus />
      </label>
      {!fixedStepId && (
        <label className="field">
          <span>연결할 일정 (선택)</span>
          <select value={stepId} onChange={(e) => setStepId(e.target.value)}>
            <option value="">연결 안 함 (제품 전체 메모)</option>
            {sorted.map((s) => (
              <option key={s.id} value={s.id}>{s.label} {mdw(s.date)}</option>
            ))}
          </select>
        </label>
      )}
      <div className="row gap8">
        <button type="submit" className="btn primary" disabled={!text.trim()}>메모 저장</button>
        <button type="button" className="btn" onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}
