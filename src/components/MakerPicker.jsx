import { MAKERS } from '../data/constants.js';

// 제조사: 자주 쓰는 곳은 버튼으로 바로 고르고, 다른 곳은 직접 적어요.
export default function MakerPicker({ id, value, onChange }) {
  const custom = !MAKERS.includes(value);
  return (
    <div className="row wrap gap6">
      {MAKERS.map((m) => (
        <button key={m} type="button" className={'pill' + (value === m ? ' on' : '')} onClick={() => onChange(m)}>{m}</button>
      ))}
      <button type="button" className={'pill' + (custom ? ' on' : '')} onClick={() => onChange(custom ? value : '')}>+ 직접 입력</button>
      {custom && <input id={id} className="input sm" value={value} onChange={(e) => onChange(e.target.value)} placeholder="제조사 이름" aria-label="제조사 직접 입력" />}
    </div>
  );
}
