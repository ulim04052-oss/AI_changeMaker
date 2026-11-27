import { useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import MakerPicker from './MakerPicker.jsx';
import { MAKERS, CHANNELS, KINDS, MATERIAL_KINDS, PRODUCT_COLORS, PRODUCT_TYPES, UNITS } from '../data/constants.js';
import { arrivals, full, mdw, stepsFromTemplate } from '../engine/dates.js';

const initialForm = (templates) => ({
  name: '',
  type: PRODUCT_TYPES[0],
  channel: '올리브영',
  maker: '코스맥스',
  launch: '2027-04-20',
  color: 'brown',
  gaps: { finishedN: 1, finishedUnit: '달', materialN: 2, materialUnit: '주' },
  materials: [
    { kind: '튜브', vendor: 'KBI', templateId: templates.find((t) => t.materialKind === '튜브')?.id || templates[0]?.id },
    { kind: '라벨', vendor: 'A업체', templateId: templates.find((t) => t.materialKind === '라벨')?.id || templates[0]?.id },
  ],
});

export default function NewProductDialog({ templates, vendors, onClose, onCreate, onNewTemplate, draft }) {
  const [f, setF] = useState(() => draft || initialForm(templates));
  const [gapOpen, setGapOpen] = useState(false);
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const setGap = (patch) => setF((x) => ({ ...x, gaps: { ...x.gaps, ...patch } }));
  const setMat = (i, patch) => setF((x) => ({ ...x, materials: x.materials.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const customType = !PRODUCT_TYPES.includes(f.type);

  const preview = useMemo(() => {
    if (!f.launch) return { rows: [], empties: [] };
    const arr = arrivals(f.launch, f.gaps);
    const fixed = { 런칭: f.launch, '완제품 입고': arr.finished, '부자재 입고': arr.material };
    const rows = [
      { name: '런칭', kind: 'launch', date: f.launch, rule: '', bold: true },
      { name: '완제품 입고', kind: 'data', date: arr.finished, rule: `런칭 ${f.gaps.finishedN}${f.gaps.finishedUnit} 전`, bold: true },
      { name: '부자재 입고 (공통)', kind: 'data', date: arr.material, rule: `완제품 입고 ${f.gaps.materialN}${f.gaps.materialUnit} 전`, bold: true },
    ];
    const empties = [];
    f.materials.forEach((m) => {
      const t = templates.find((x) => x.id === m.templateId);
      if (!t) return;
      if (!t.steps.length) empties.push(m.kind);
      stepsFromTemplate(t, fixed).forEach((s) => rows.push({ name: `${m.kind} · ${s.name}`, kind: s.kind, date: s.date, rule: s.rule }));
    });
    rows.sort((a, b) => (a.date < b.date ? -1 : 1));
    return { rows, empties, arr };
  }, [f, templates]);

  const canCreate = f.name.trim() && f.launch && f.materials.every((m) => m.kind.trim() && m.vendor.trim() && m.templateId);

  return (
    <Modal title="새 제품 추가" hint="상단 [+ 새 제품] 또는 제품 목록 맨 아래에서 열려요" onClose={onClose}>
      <datalist id="vendor-list">{vendors.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="maker-list">{MAKERS.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="channel-list">{CHANNELS.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="kind-list">{[...MATERIAL_KINDS, '용기', '캡'].map((v) => <option key={v} value={v} />)}</datalist>
      <div className="modal-body two-col">
        <div className="col gap20 form-col">
          <div className="col gap12">
            <h3 className="card-title">1 · 기본 정보</h3>
            <div className="form-grid">
              <label htmlFor="np-name">제품명</label>
              <input id="np-name" className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="예: 타입넘버 핸드크림 30ml" autoFocus />

              <span>제품 유형</span>
              <div className="row wrap gap6">
                {PRODUCT_TYPES.map((t) => (
                  <button key={t} type="button" className={'pill' + (f.type === t ? ' on' : '')} onClick={() => set({ type: t })}>{t}</button>
                ))}
                <button type="button" className={'pill' + (customType ? ' on' : '')} onClick={() => set({ type: customType ? f.type : '' })}>+ 직접 입력</button>
                {customType && <input className="input sm" value={f.type} onChange={(e) => set({ type: e.target.value })} placeholder="유형 이름" aria-label="제품 유형 직접 입력" />}
              </div>

              <label htmlFor="np-maker">제조사</label>
              <MakerPicker id="np-maker" value={f.maker} onChange={(v) => set({ maker: v })} />

              <label htmlFor="np-channel">유통</label>
              <input id="np-channel" className="input" list="channel-list" value={f.channel} onChange={(e) => set({ channel: e.target.value })} placeholder="예: 올리브영" />

              <label htmlFor="np-launch">런칭일</label>
              <div className="row wrap gap8">
                <input id="np-launch" type="date" className="input" value={f.launch} onChange={(e) => set({ launch: e.target.value })} />
                <span className="muted small">바꾸면 오른쪽 날짜가 바로 다시 계산돼요</span>
              </div>

              <span>제품 색</span>
              <div className="row gap8">
                {PRODUCT_COLORS.map((c) => (
                  <button
                    key={c.id} type="button" aria-label={c.label} aria-pressed={f.color === c.id}
                    className={'swatch' + (f.color === c.id ? ' on' : '')} style={{ background: c.dot }}
                    onClick={() => set({ color: c.id })}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="sep" />

          <div className="col gap10">
            <h3 className="card-title">2 · 입고일 (자동 계산)</h3>
            <div className="arrival-row">
              <span className="arrival-name">완제품 입고</span>
              <b className="num">{preview.arr ? mdw(preview.arr.finished) : '-'}</b>
              <span className="grow muted small">런칭 <b>{f.gaps.finishedN}{f.gaps.finishedUnit}</b> 전</span>
              <button type="button" className="btn sm" onClick={() => setGapOpen(!gapOpen)}>간격 바꾸기</button>
            </div>
            <div className="arrival-row">
              <span className="arrival-name">부자재 입고</span>
              <b className="num">{preview.arr ? mdw(preview.arr.material) : '-'}</b>
              <span className="grow muted small">완제품 입고 <b>{f.gaps.materialN}{f.gaps.materialUnit}</b> 전 · 아래 부자재 모두 같은 날</span>
            </div>
            {gapOpen && (
              <div className="gap-box">
                <span>완제품 입고 = 런칭</span>
                <input type="number" min="0" className="input num-in" value={f.gaps.finishedN} onChange={(e) => setGap({ finishedN: Math.max(0, +e.target.value) })} aria-label="완제품 입고 간격" />
                <select className="input sm" value={f.gaps.finishedUnit} onChange={(e) => setGap({ finishedUnit: e.target.value })} aria-label="단위">
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
                <span>전 · 부자재 입고 = 완제품 입고</span>
                <input type="number" min="0" className="input num-in" value={f.gaps.materialN} onChange={(e) => setGap({ materialN: Math.max(0, +e.target.value) })} aria-label="부자재 입고 간격" />
                <select className="input sm" value={f.gaps.materialUnit} onChange={(e) => setGap({ materialUnit: e.target.value })} aria-label="단위">
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
                <span>전</span>
                <span className="full-line">이 제품에만 적용돼요. 기본값(1달 · 2주)은 그대로예요.</span>
              </div>
            )}
          </div>

          <div className="sep" />

          <div className="col gap10">
            <h3 className="card-title">3 · 부자재 (종류 · 업체 · 필요 일정)</h3>
            {f.materials.map((m, i) => {
              const t = templates.find((x) => x.id === m.templateId);
              return (
                <div key={i} className="mat-row">
                  <input className="input strong" list="kind-list" value={m.kind} onChange={(e) => setMat(i, { kind: e.target.value })} aria-label="부자재 종류" />
                  <input className="input" list="vendor-list" value={m.vendor} onChange={(e) => setMat(i, { vendor: e.target.value })} aria-label="업체 (목록에서 고르거나 새로 입력)" placeholder="업체" />
                  <select
                    className="input" value={m.templateId || ''} aria-label="필요 일정"
                    onChange={(e) => (e.target.value === '__new' ? onNewTemplate(f) : setMat(i, { templateId: e.target.value }))}
                  >
                    {templates.map((x) => (
                      <option key={x.id} value={x.id}>{x.name} · {x.steps.length ? `단계 ${x.steps.length}개` : '단계 없음'}</option>
                    ))}
                    <option value="__new">+ 새 필요 일정 만들기</option>
                  </select>
                  <button type="button" className="btn icon" aria-label="이 부자재 빼기" onClick={() => set({ materials: f.materials.filter((_, j) => j !== i) })}>×</button>
                  {!t && <span className="muted small">필요 일정을 골라 주세요</span>}
                </div>
              );
            })}
            <div className="row wrap gap8">
              <button
                type="button" className="btn dashed strong"
                onClick={() => set({ materials: [...f.materials, { kind: '단상자', vendor: '', templateId: templates.find((t) => t.materialKind === '단상자')?.id || templates[0]?.id }] })}
              >+ 부자재 추가</button>
              <span className="muted small">업체 칸은 목록에서 고르거나 새 이름을 바로 적으면 돼요</span>
            </div>
          </div>
        </div>

        <aside className="preview">
          <div className="row gap8">
            <span className="dot" style={{ background: PRODUCT_COLORS.find((c) => c.id === f.color).dot }} />
            <b className="grow">미리보기 · 이렇게 달력에 들어가요</b>
          </div>
          <ol className="preview-list">
            {preview.rows.map((r, i) => (
              <li key={i}>
                <span className="dot" style={{ background: KINDS[r.kind].dot }} />
                <span className={'grow' + (r.bold ? ' strong' : '')}>{r.name}</span>
                <span className="muted small">{r.rule}</span>
                <span className={'num date-col' + (r.bold ? ' strong' : '')}>{mdw(r.date)}</span>
              </li>
            ))}
          </ol>
          {preview.empties.length > 0 && (
            <div className="note-box">{preview.empties.join(', ')} 필요 일정은 아직 단계가 없어서 런칭·입고일만 들어가요. 단계는 나중에 채워도 돼요.</div>
          )}
          <div className="muted small">만든 뒤에도 날짜는 칩을 눌러 하나씩 바꿀 수 있어요. 주말·공휴일이면 바로 앞 평일로 당겨요.</div>
          {f.launch && <div className="muted small">런칭 {full(f.launch)}</div>}
        </aside>
      </div>
      <div className="modal-foot">
        <span className="grow muted">달력에 일정 <b>{preview.rows.length}개</b>가 생겨요</span>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn primary" disabled={!canCreate} onClick={() => onCreate(f)}>만들기</button>
      </div>
    </Modal>
  );
}
