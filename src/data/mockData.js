// 예시(가짜) 데이터. 화면을 먼저 보기 위한 것이고, 나중에 진짜 데이터로 바뀌어요.
// 날짜는 모두 'YYYY-MM-DD' 글자로 저장해요.

export const mockTemplates = [
  {
    id: 'tpl-tube', name: '튜브 필요 일정 · KBI', materialKind: '튜브',
    steps: [
      { name: '원단 발주', kind: 'mold', base: '부자재 입고', n: 7, unit: '주' },
      { name: '데이터 아웃', kind: 'data', base: '원단 발주', n: 2, unit: '영업일' },
      { name: 'CT', kind: 'ct', base: '데이터 아웃', n: 1, unit: '영업일' },
      { name: '시안 확정 보고', kind: 'meet', base: 'CT', n: 6, unit: '영업일' },
      { name: '개발회의', kind: 'meet', base: '시안 확정 보고', n: 1, unit: '영업일' },
    ],
  },
  {
    id: 'tpl-label', name: '라벨 필요 일정', materialKind: '라벨',
    steps: [
      { name: '인쇄 발주', kind: 'mold', base: '부자재 입고', n: 3, unit: '주' },
      { name: '라벨 시안 공유', kind: 'meet', base: '인쇄 발주', n: 2, unit: '주' },
    ],
  },
  { id: 'tpl-box', name: '단상자 필요 일정', materialKind: '단상자', steps: [] },
  { id: 'tpl-sanitizer', name: '세니타이저 용기 필요 일정', materialKind: '용기', steps: [] },
];

export const mockVendors = ['KBI', 'A업체', 'B업체', 'C업체', 'D업체'];

const DEFAULT_GAPS = { finishedN: 1, finishedUnit: '달', materialN: 2, materialUnit: '주' };

export const mockProducts = [
  {
    id: 'p1', name: '타입넘버 핸드크림 10ml', type: '튜브형 핸드크림', channel: '올리브영', maker: '코스맥스 / 화이트코스팜', color: 'green', owner: '배유림',
    launch: '2027-03-16', finishedArrival: '2027-02-16', materialArrival: '2027-02-02', gaps: DEFAULT_GAPS,
    materials: [
      {
        id: 'p1-tube', name: '튜브', vendor: 'KBI', templateName: '튜브 필요 일정 · 양산 7주',
        steps: [
          { id: 's1', name: '개발회의', kind: 'meet', date: '2026-12-01', rule: '시안 확정 보고 1영업일 전', changes: [] },
          { id: 's2', name: '시안 확정 보고', kind: 'meet', date: '2026-12-02', rule: 'CT 6영업일 전', changes: [] },
          { id: 's3', name: 'CT', kind: 'ct', date: '2026-12-10', rule: '데이터 아웃 1영업일 전', changes: ['12/8 → 12/10, KBI 요청'] },
          { id: 's4', name: '데이터 아웃', kind: 'data', date: '2026-12-11', rule: '원단 발주 2영업일 전', changes: [] },
          { id: 's5', name: '원단 발주', kind: 'mold', date: '2026-12-15', rule: '부자재 입고 7주 전', changes: [] },
        ],
      },
      {
        id: 'p1-label', name: '라벨', vendor: 'A업체', templateName: '라벨 필요 일정 · 기간 미정',
        steps: [
          { id: 's6', name: '라벨 시안 공유', kind: 'meet', date: '2026-12-08', rule: '인쇄 발주 2주 전', changes: [] },
          { id: 's7', name: '컬러 샘플 요청', kind: 'sample', date: '2026-12-09', rule: '직접 추가한 일정', changes: [] },
          { id: 's8', name: '인쇄 발주', kind: 'mold', date: '2026-12-17', rule: '부자재 입고 3주 전 (직접 수정)', changes: [] },
          { id: 's9', name: 'CT 의뢰', kind: 'ct', date: '2026-12-22', rule: '직접 추가한 일정', changes: [] },
        ],
      },
      {
        id: 'p1-box', name: '단상자', vendor: 'B업체', templateName: '단상자 필요 일정 · 기간 미정',
        steps: [
          { id: 's10', name: '데이터 아웃', kind: 'data', date: '2026-12-18', rule: '직접 추가한 일정', changes: [] },
          { id: 's11', name: '인쇄 발주', kind: 'mold', date: '2026-12-29', rule: '직접 추가한 일정', changes: [] },
        ],
      },
    ],
    memos: [
      { id: 'm1', text: '튜브 원단 선양산 후 캡 사출 진행 필요', stepId: null },
      { id: 'm2', text: 'CT 결과 보고 전에 라벨 컬러 확정 필요', stepId: 's3' },
    ],
  },
  {
    id: 'p2', name: '핸드크림 40ml', type: '튜브형 핸드크림', channel: '올리브영', maker: '코스맥스 / 화이트코스팜', color: 'purple', owner: '배유림',
    launch: '2027-04-01', finishedArrival: '2027-02-26', materialArrival: '2027-02-12', gaps: DEFAULT_GAPS,
    materials: [
      {
        id: 'p2-tube', name: '튜브', vendor: 'KBI', templateName: '튜브 필요 일정 · 양산 7주',
        steps: [
          { id: 's12', name: '데이터 아웃', kind: 'data', date: '2026-12-04', rule: '원단 발주 2영업일 전', changes: [] },
          { id: 's13', name: '원단 발주', kind: 'mold', date: '2026-12-24', rule: '부자재 입고 7주 전', changes: [] },
        ],
      },
      {
        id: 'p2-label', name: '라벨', vendor: 'C업체', templateName: '라벨 필요 일정 · 기간 미정',
        steps: [{ id: 's14', name: '라벨 발주', kind: 'mold', date: '2026-12-16', rule: '직접 추가한 일정', changes: [] }],
      },
    ],
    memos: [{ id: 'm3', text: '40ml 튜브 원단은 10ml와 같은 날 발주 검토', stepId: null }],
  },
  {
    id: 'p3', name: '세니타이저 100ml', type: '세니타이저', channel: '올리브영', maker: '화이트코스팜', color: 'teal', owner: '배유림',
    launch: '2027-04-15', finishedArrival: '2027-03-15', materialArrival: '2027-02-26', gaps: DEFAULT_GAPS,
    materials: [
      {
        id: 'p3-bottle', name: '용기', vendor: 'D업체', templateName: '세니타이저 용기 필요 일정 · 기간 미정',
        steps: [
          { id: 's15', name: '펌프 시안 보고', kind: 'meet', date: '2026-12-03', rule: '직접 추가한 일정', changes: [] },
          { id: 's16', name: '펌프 샘플 요청', kind: 'sample', date: '2026-12-21', rule: '직접 추가한 일정', changes: [] },
        ],
      },
    ],
    memos: [{ id: 'm4', text: '펌프 분사량 테스트 결과 대기', stepId: null }],
  },
];

export const createMockData = () => ({
  version: 1,
  products: mockProducts,
  templates: mockTemplates,
  vendors: mockVendors,
  lastBackupAt: '2026-11-20',
});
