import { useRef } from 'react';
import { md } from '../engine/dates.js';

export default function Header({
  view, onPrev, onNext, onToday, onNew, settingsOpen, setSettingsOpen,
  lastBackupAt, daysSinceBackup, onTemplates, onExport, onImportFile,
}) {
  const fileRef = useRef(null);
  return (
    <header className="header">
      <div className="brand">제품 일정 캘린더</div>
      <div className="month-nav">
        <button className="btn icon" aria-label="이전 달" onClick={onPrev}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg></button>
        <div className="month-label">{view.year}년 {view.month + 1}월</div>
        <button className="btn icon" aria-label="다음 달" onClick={onNext}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg></button>
      </div>
      <button className="btn" onClick={onToday}>오늘</button>
      <div className="grow" />
      <div className="menu-wrap">
        <button className="btn" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          설정
        </button>
        {settingsOpen && (
          <div className="menu settings-menu" role="menu">
            <button role="menuitem" className="menu-item" onClick={onTemplates}>필요 일정 관리</button>
            <button role="menuitem" className="menu-item" disabled>업체 목록 <span className="soon">준비 중</span></button>
            <button role="menuitem" className="menu-item" disabled>보관한 제품 <span className="soon">준비 중</span></button>
            <div className="menu-sep" />
            <button role="menuitem" className="menu-item strong" onClick={onExport}>백업 파일로 내보내기</button>
            <button role="menuitem" className="menu-item" onClick={() => fileRef.current?.click()}>백업 파일 불러오기</button>
            <div className="menu-note">
              {lastBackupAt ? `마지막 백업: ${md(lastBackupAt)} (${daysSinceBackup === 0 ? '오늘' : daysSinceBackup + '일 전'})` : '아직 백업한 적 없어요'}
            </div>
          </div>
        )}
        <input
          ref={fileRef} type="file" accept="application/json,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ''; }}
        />
      </div>
      <button className="btn primary" onClick={onNew}>+ 새 제품</button>
    </header>
  );
}
