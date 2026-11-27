import { md, mdw, weekday } from '../engine/dates.js';

// 달력 바로 위에 뜨는 알림들.
// 노랑 = 물어보기, 빨강 = 규칙을 넘었다는 경고, 검정 = 방금 한 일 알림(+되돌리기)
export default function Notices({
  banner, toast, backupNag, onBackupNow, onBackupLater,
  onPushAll, onPushOne, onOffdayKeep, onOffdayPrev, onCloseBanner, onUndo, onCloseToast,
}) {
  return (
    <>
      {banner?.type === 'push' && (
        <div className="notice ask" role="status">
          <div className="grow">
            <div className="strong">
              {banner.label} 날짜를 {md(banner.from)} → {md(banner.to)}로 옮겨요. 뒤 일정 {banner.later.length}개도 같이 밀까요?
            </div>
            <div className="small">
              같이 밀면 {banner.later.map((l) => `${l.name} ${md(l.from)} → ${md(l.to)}`).join(', ')}로 바뀌어요.
            </div>
          </div>
          <button className="btn ask-solid" onClick={onPushAll}>같이 밀기</button>
          <button className="btn ask-line" onClick={onPushOne}>이것만 옮기기</button>
          <button className="btn ask-line" onClick={onCloseBanner}>취소</button>
        </div>
      )}
      {banner?.type === 'offday' && (
        <div className="notice ask" role="status">
          <div className="grow strong">
            {md(banner.newDate)}는 {['토', '일'].includes(weekday(banner.newDate)) ? weekday(banner.newDate) + '요일' : '공휴일'}이에요. 그래도 이 날로 둘까요?
          </div>
          <button className="btn ask-line" onClick={onOffdayKeep}>그대로 두기</button>
          <button className="btn ask-solid" onClick={onOffdayPrev}>앞 평일({mdw(banner.prev)})로</button>
          <button className="btn ask-line" onClick={onCloseBanner}>취소</button>
        </div>
      )}
      {banner?.type === 'late' && (
        <div className="notice alert" role="alert">
          <div className="grow">
            <div className="strong">⚠ 부자재 입고일({mdw(banner.arrival)})보다 늦은 일정이 생겼어요</div>
            <div className="small">{banner.names.join(', ')} · 런칭일은 자동으로 바뀌지 않아요.</div>
          </div>
          <button className="btn alert-line" onClick={onCloseBanner}>알겠어요, 그대로 두기</button>
        </div>
      )}
      {backupNag != null && !banner && (
        <div className="notice ask" role="status">
          <div className="grow">
            <div className="strong">{backupNag}일 동안 백업하지 않았어요</div>
            <div className="small">이 브라우저에만 저장돼서, 기록을 지우거나 컴퓨터를 바꾸면 사라져요.</div>
          </div>
          <button className="btn ask-solid" onClick={onBackupNow}>지금 내보내기</button>
          <button className="btn ask-line" onClick={onBackupLater}>나중에</button>
        </div>
      )}
      {toast && (
        <div className="notice done" role="status">
          <span className="grow">{toast.text}</span>
          {toast.undoData && <button className="btn done-line" onClick={onUndo}>되돌리기</button>}
          <button className="btn done-line icon" aria-label="닫기" onClick={onCloseToast}>×</button>
        </div>
      )}
    </>
  );
}
