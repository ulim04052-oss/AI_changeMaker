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
        <button className="btn icon" aria-label="이전 달" onClick={onPrev}>‹</button>
        <div className="month-label">{view.year}년 {view.month + 1}월</div>
        <button className="btn icon" aria-label="다음 달" onClick={onNext}>›</button>
      </div>
      <button className="btn" onClick={onToday}>오늘</button>
      <div className="grow" />
      <div className="menu-wrap">
        <button className="btn" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}>⚙ 설정</button>
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
