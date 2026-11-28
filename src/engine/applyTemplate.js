// 수정한 필요 일정을 이미 만든 제품의 부자재에 다시 적용하는 계산
// ⚠️ 임시 계산기(dates.js)를 쓰는 부분이라, 진짜 계산 엔진이 생기면 같이 바뀌어요.
import { md, stepsFromTemplate } from './dates.js';

// 이 필요 일정을 반영할 수 있는 부자재 목록
export function applyCandidates(products, tpl) {
  const out = [];
  products.forEach((p) =>
    p.materials.forEach((m) => {
      const uses = m.templateId === tpl.id;
      if (uses || m.name === tpl.materialKind) out.push({ product: p, material: m, uses });
    })
  );
  return out;
}

// 부자재 하나를 필요 일정대로 다시 계산 → { steps, changed, added, removed }
export function recomputeMaterial(product, material, tpl, makeId) {
  const fixed = { 런칭: product.launch, '완제품 입고': product.finishedArrival, '부자재 입고': product.materialArrival };
  const fresh = stepsFromTemplate(tpl, fixed);
  const oldByName = {};
  material.steps.forEach((s) => { if (!oldByName[s.name]) oldByName[s.name] = s; });
  const used = new Set();
  let changed = 0;
  let added = 0;
  const steps = fresh.map((s) => {
    const old = oldByName[s.name];
    if (old && !used.has(old.id)) {
      used.add(old.id);
      const moved = old.date !== s.date;
      if (moved) changed++;
      return {
        ...old, kind: s.kind, rule: s.rule, date: s.date,
        changes: moved ? [...(old.changes || []), `${md(old.date)} → ${md(s.date)}, 필요 일정 수정 반영`] : old.changes || [],
      };
    }
    added++;
    return { id: makeId(), name: s.name, kind: s.kind, date: s.date, rule: s.rule, changes: [] };
  });
  const removed = material.steps.filter((s) => !used.has(s.id));
  return { steps, changed, added, removed };
}
