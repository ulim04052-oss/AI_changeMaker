// 달력 위 가운데: 이전 달 · 2026년 12월 · 다음 달
export default function MonthNav({ view, onPrev, onNext }) {
  return (
    <div className="month-bar">
      <div className="month-nav">
        <button className="btn icon" aria-label="이전 달" onClick={onPrev}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg></button>
        <div className="month-label">{view.year}년 {view.month + 1}월</div>
        <button className="btn icon" aria-label="다음 달" onClick={onNext}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg></button>
      </div>
    </div>
  );
}
