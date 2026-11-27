// 저장된 데이터 → 화면에 그리기 좋은 모양으로 바꿔 주는 함수들
import { ruleText } from '../engine/dates.js';

const gapRule = (g) => ({
  finished: ruleText('런칭', g.finishedN, g.finishedUnit),
  material: ruleText('완제품 입고', g.materialN, g.materialUnit),
});

// 한 제품의 모든 일정(칩)을 한 줄 목록으로
export function productEvents(p) {
  const memoCount = (id) => p.memos.filter((m) => m.stepId === id).length;
  const list = [];
  p.materials.forEach((m) =>
    m.steps.forEach((s) =>
      list.push({
        ...s,
        productId: p.id, materialId: m.id, matName: m.name, vendor: m.vendor,
        label: `${m.name} · ${s.name}`, editable: true, memoCount: memoCount(s.id),
      })
    )
  );
  const g = gapRule(p.gaps);
  const fixed = [
    { key: 'mat', name: '부자재 입고 (공통)', kind: 'data', date: p.materialArrival, rule: g.material },
    { key: 'fin', name: '완제품 입고', kind: 'data', date: p.finishedArrival, rule: g.finished },
    { key: 'launch', name: '런칭', kind: 'launch', date: p.launch, rule: '제품의 기준 날짜' },
  ];
  fixed.forEach((f) => {
    const id = `${p.id}:${f.key}`;
    list.push({
      ...f, id, productId: p.id, materialId: null, matName: '', vendor: '',
      label: f.name, editable: false, auto: f.key !== 'launch', changes: [], memoCount: memoCount(id),
    });
  });
  return list;
}

export function allEvents(products) {
  return products.flatMap(productEvents);
}

export function findEvent(products, id) {
  return allEvents(products).find((e) => e.id === id) || null;
}

export function shortName(name) {
  return name.replace('타입넘버 ', '');
}
