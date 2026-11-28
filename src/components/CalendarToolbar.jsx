import { KINDS, KIND_ORDER, colorOf } from '../data/constants.js';

export default function CalendarToolbar({ scope, setScope, vendor, setVendor, vendorOptions, products, center }) {
  const one = scope === 'one';
  const legend = one
    ? KIND_ORDER.map((k) => ({ key: k, name: KINDS[k].name, c: KINDS[k] }))
    : products.map((p) => ({ key: p.id, name: p.name, c: colorOf(p.color) }));
  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
        <div className="segmented" role="group" aria-label="보기 범위">
          <button className={one ? 'on' : ''} aria-pressed={one} onClick={() => setScope('one')}>이 제품만</button>
          <button className={!one ? 'on' : ''} aria-pressed={!one} onClick={() => setScope('all')}>전체 제품</button>
        </div>
        <label className="vendor-select">
          <span>업체:</span>
          <select value={vendor} onChange={(e) => setVendor(e.target.value)}>
            <option value="전체">전체</option>
            {vendorOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        </div>
        <div className="toolbar-center">{center}</div>
        <div className="toolbar-right" />
      </div>
      <div className="legend">
        {legend.map((l) => (
          <span key={l.key} className="legend-item" style={{ background: l.c.tint, color: l.c.ink }}>
            <span className="dot sm" style={{ background: l.c.dot }} />{l.name}
          </span>
        ))}
      </div>
    </>
  );
}
