// ⚠️ 임시 계산기: 화면을 먼저 보여주려고 만든 간단한 버전이에요.
// 나중에 "데이터·계산 담당(A)"이 만든 진짜 계산 엔진으로 이 파일을 바꿔 끼우면 돼요.
import { HOLIDAYS } from '../data/constants.js';

const W = ['일', '월', '화', '수', '목', '금', '토'];

export const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const toIso = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const todayIso = () => toIso(new Date());

export const weekday = (iso) => W[parse(iso).getDay()];
export const md = (iso) => { const d = parse(iso); return `${d.getMonth() + 1}/${d.getDate()}`; };
export const mdw = (iso) => `${md(iso)} (${weekday(iso)})`;
export const full = (iso) => `${iso} (${weekday(iso)})`;

export const holidayName = (iso) => HOLIDAYS[iso] || '';
export const isOffDay = (iso) => {
  const day = parse(iso).getDay();
  return day === 0 || day === 6 || !!HOLIDAYS[iso];
};

// 주말·공휴일이면 바로 앞 평일로 당기기
export const prevWorkday = (iso) => {
  const x = parse(iso);
  while (isOffDay(toIso(x))) x.setDate(x.getDate() - 1);
  return toIso(x);
};

// 기준일에서 n(영업일/주/달) 전
export const before = (iso, n, unit) => {
  const x = parse(iso);
  if (unit === '달') {
    const day = x.getDate();
    x.setDate(1);
    x.setMonth(x.getMonth() - n);
    const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
    x.setDate(Math.min(day, last));
    return prevWorkday(toIso(x));
  }
  if (unit === '주') {
    x.setDate(x.getDate() - 7 * n);
    return prevWorkday(toIso(x));
  }
  let k = n;
  while (k > 0) {
    x.setDate(x.getDate() - 1);
    if (!isOffDay(toIso(x))) k--;
  }
  return toIso(x);
};

// 영업일 기준으로 n일 더하기 (음수면 빼기)
export const addWorkdays = (iso, n) => {
  const x = parse(iso);
  let k = Math.abs(n);
  const step = n >= 0 ? 1 : -1;
  while (k > 0) {
    x.setDate(x.getDate() + step);
    if (!isOffDay(toIso(x))) k--;
  }
  return toIso(x);
};

// 두 날짜 사이 영업일 차이 (b - a)
export const workdayDiff = (a, b) => {
  if (a === b) return 0;
  const sign = b > a ? 1 : -1;
  const x = parse(a);
  let n = 0;
  while (toIso(x) !== b) {
    x.setDate(x.getDate() + sign);
    if (!isOffDay(toIso(x))) n += sign;
  }
  return n;
};

// 달력 한 달 칸 (일요일 시작, 앞뒤 달 날짜 포함)
export const monthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const weeks = [];
  const cur = new Date(start);
  do {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push({ iso: toIso(cur), num: cur.getDate(), inMonth: cur.getMonth() === month, dow: i });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(days);
  } while (cur.getMonth() === month);
  return weeks;
};

export const ruleText = (base, n, unit) => `${base} ${n}${unit} 전`;

// 런칭일 + 간격 → 완제품 입고, 부자재 입고
export const arrivals = (launch, gaps) => {
  const finished = before(launch, gaps.finishedN, gaps.finishedUnit);
  const material = before(finished, gaps.materialN, gaps.materialUnit);
  return { finished, material };
};

// 필요 일정(단계 목록) → 실제 날짜. 각 단계는 "무엇 기준 얼마 전"만 알아요.
export const stepsFromTemplate = (template, fixed) => {
  const got = { ...fixed };
  const resolve = (s, depth) => {
    if (got[s.name] && !(s.name in fixed)) return got[s.name];
    let base = got[s.base];
    if (!base) {
      const parent = template.steps.find((x) => x.name === s.base);
      base = parent && depth < 20 ? resolve(parent, depth + 1) : fixed['부자재 입고'];
    }
    const d = before(base, s.n, s.unit);
    got[s.name] = d;
    return d;
  };
  return template.steps.map((s) => ({ ...s, date: resolve(s, 0), rule: ruleText(s.base, s.n, s.unit) }));
};
