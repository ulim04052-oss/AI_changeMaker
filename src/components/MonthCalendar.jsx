import { KINDS, colorOf } from '../data/constants.js';
import { holidayName, monthGrid, todayIso } from '../engine/dates.js';
import { shortName } from '../data/selectors.js';

const DOWS = ['일', '월', '화', '수', '목', '금', '토'];

export default function MonthCalendar({ view, events, scope, products, activeId, onPick, onEmpty }) {
  const one = scope === 'one';
  const weeks = monthGrid(view.year, view.month);
  const today = todayIso();
  const byDay = {};
  events.forEach((e) => (byDay[e.date] = byDay[e.date] || []).push(e));
  const pById = Object.fromEntries(products.map((p) => [p.id, p]));

  return (
    <div className="calendar-scroll">
      <div className="calendar" role="grid" aria-label={`${view.year}년 ${view.month + 1}월`}>
        <div className="cal-row head" role="row">
          {DOWS.map((d, i) => (
            <div key={d} role="columnheader" className={'cal-dow' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '')}>{d}</div>
          ))}
        </div>
        {weeks.map((w) => (
          <div key={w[0].iso} className="cal-row" role="row">
            {w.map((day) => {
              const hol = holidayName(day.iso);
              const off = day.dow === 0 || day.dow === 6 || hol;
              const cls = ['cal-cell', !day.inMonth && 'out', off && 'off', day.iso === today && 'today'].filter(Boolean).join(' ');
              const numCls = !day.inMonth ? '' : day.dow === 0 || hol ? 'sun' : day.dow === 6 ? 'sat' : '';
              return (
                <div
                  key={day.iso}
                  role="gridcell"
                  className={cls}
                  onClick={(e) => { if (e.target === e.currentTarget) onEmpty(); }}
                >
                  <div className="cal-num" onClick={onEmpty}>
                    <span className={numCls}>{day.num}</span>
                    {hol && <span className="hol">{hol}</span>}
                  </div>
                  {(byDay[day.iso] || []).map((e) => {
                    const p = pById[e.productId];
                    const c = one ? KINDS[e.kind] : colorOf(p.color);
                    const sub = one ? e.vendor : [shortName(p.name), e.vendor].filter(Boolean).join(' · ');
                    return (
                      <button
                        key={e.id}
                        className={'chip' + (e.id === activeId ? ' active' : '') + (e.kind === 'launch' ? ' launch' : '')}
                        style={{ background: c.tint, color: c.ink, '--ink': c.ink }}
                        onClick={() => onPick(e)}
                        title={`${e.label} · ${p.name}`}
                      >
                        <span className="chip-top">
                          {one && <span className="dot sm" style={{ background: KINDS[e.kind].dot }} />}
                          <span className="chip-label">{e.label}</span>
                          {e.memoCount > 0 && (
                            <span className="chip-bubble" style={{ background: c.ink }} aria-label={`메모 ${e.memoCount}개`}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                              {e.memoCount}
                            </span>
                          )}
                        </span>
                        {sub && <span className="chip-sub">{sub}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
