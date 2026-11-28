import { useRef } from 'react';
import { md } from '../engine/dates.js';

export default function Header({
  onNew, settingsOpen, setSettingsOpen, saveStatus, onRetrySave, onReload,
  lastBackupAt, daysSinceBackup, onTemplates, onExport, onImportFile,
}) {
  const fileRef = useRef(null);
  return (
    <header className="header">
      <div className="brand">제품 일정 캘린더</div>
      <div className="grow" />
      <SaveStatus status={saveStatus} onRetry={onRetrySave} onReload={onReload} />
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

// 저장 상태: 미리보기 / 저장 중 / 저장됨 / 실패 / 다른 사람이 먼저 고침
function SaveStatus({ status, onRetry, onReload }) {
  if (!status) return null;
  const { state, message } = status;
  if (state === 'demo') return <span className="save-pill muted" title="미리보기라서 저장되지 않아요. 새로고침하면 처음으로 돌아가요.">미리보기 · 저장 안 됨</span>;
  if (state === 'saving') return <span className="save-pill muted" role="status">저장 중…</span>;
  if (state === 'saved') return <span className="save-pill ok" role="status">✓ 구글 시트에 저장됨</span>;
  if (state === 'conflict') {
    return (
      <span className="save-pill bad" role="alert">
        다른 팀원이 먼저 고쳐서 방금 바꾼 내용은 저장되지 않았어요.
        <button className="btn sm" onClick={onReload}>최신 내용 불러오기</button>
      </span>
    );
  }
  return (
    <span className="save-pill bad" role="alert" title={message}>
      저장 실패
      <button className="btn sm" onClick={onRetry}>다시 저장</button>
    </span>
  );
}
