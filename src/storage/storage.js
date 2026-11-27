// 💾 저장소 창구: 데이터를 읽고 쓰는 건 전부 이 파일 하나만 통해요.
// 지금은 예시 데이터를 메모리에만 들고 있어요 (새로고침하면 처음으로 돌아가요).
// 다음 단계: loadAll/saveAll 안쪽만 localStorage 로 바꾸고,
// 그다음엔 Supabase 로 바꿔요. 화면 코드는 고칠 필요가 없어요.
import { createMockData } from '../data/mockData.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

export function loadAll() {
  // 주소 끝에 ?empty 를 붙이면 "제품이 하나도 없는 첫 화면"을 볼 수 있어요.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('empty')) {
    return { ...clone(createMockData()), products: [] };
  }
  return clone(createMockData());
}

export function saveAll(_data) {
  // TODO(다음 단계): localStorage.setItem('product-schedule', JSON.stringify(_data))
}

export function exportBackup(data) {
  const day = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `제품일정_백업_${day}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return day;
}

// 백업 파일 글자 → 데이터. 모양이 이상하면 오류를 던져요.
export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.templates)) {
    throw new Error('제품일정 백업 파일이 아니에요.');
  }
  return data;
}
