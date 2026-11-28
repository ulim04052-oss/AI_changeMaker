import { useState } from 'react';

// 제품 유형 고르기 · 추가 · 삭제 (목록은 모두가 같이 써요)
export default function TypePicker({ types, value, onChange, onTypesChange }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const list = value && !types.includes(value) ? [...types, value] : types;

  const add = () => {
    const t = text.trim();
    if (!t) return;
    if (!types.includes(t)) onTypesChange([...types, t]);
    onChange(t);
    setText('');
    setAdding(false);
  };
  const remove = (t) => {
    onTypesChange(types.filter((x) => x !== t));
    if (value === t) onChange('');
  };

  return (
    <div className="row wrap gap6">
      {list.map((t) => (
        <span key={t} className={'pill type-pill' + (value === t ? ' on' : '')}>
          <button type="button" className="type-name" onClick={() => onChange(t)} aria-pressed={value === t}>{t}</button>
          {types.includes(t) && (
            <button type="button" className="type-x" aria-label={`${t} 유형 지우기`} title="목록에서 지우기" onClick={() => remove(t)}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          )}
        </span>
      ))}
      {adding ? (
        <span className="row gap6">
          <input
            className="input sm" value={text} autoFocus placeholder="새 유형 이름" aria-label="새 제품 유형"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); add(); }
              if (e.key === 'Escape') { e.stopPropagation(); setAdding(false); }
            }}
          />
          <button type="button" className="btn sm primary" disabled={!text.trim()} onClick={add}>추가</button>
          <button type="button" className="btn sm" onClick={() => setAdding(false)}>취소</button>
        </span>
      ) : (
        <button type="button" className="pill" onClick={() => setAdding(true)}>+ 유형 추가</button>
      )}
    </div>
  );
}
