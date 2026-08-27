/**
 * 커리어 레벨(직무등급) 정의 — 이 앱의 모든 평가·보상 계산의 1차 축.
 *
 * 근거가 된 프레임워크
 * - Radford(Aon) Global Job Level: 전문직(IC) 트랙을 P1 Entry ~ P6 Principal 로 나눈다.
 *   이 앱은 10~20명 규모 조직을 전제로 P1~P5 만 쓴다.
 * - Mercer IPE / WTW GGS / Korn Ferry Hay: 세부 factor 는 다르지만 공통적으로
 *   "영향 범위(scope) × 문제의 모호함 × 타인에 대한 책임" 으로 등급을 가른다.
 *   → scope / ambiguity / accountability 세 줄로 요약해 각 레벨에 박아 둔다.
 *
 * 레벨이 하는 일은 세 가지다.
 * 1) 같은 행동이라도 기대 수준을 다르게 본다 (anchor — "3점"의 의미가 레벨마다 다름)
 * 2) 평가 도메인 가중치를 다르게 준다 (weights — 신입은 기본기, 리더는 영향력)
 * 3) 시장 보상 밴드를 다르게 잡는다 (market.js 의 밴드가 레벨별로 정의됨)
 *
 * 연차(years)는 참고용 힌트일 뿐 승급 조건이 아니다.
 * 한국 IT 관행상 "연차 = 레벨" 로 굳으면 직무급의 의미가 사라진다.
 */

export const LEVELS = [
  {
    id: 'L1',
    label: '신입',
    short: 'L1',
    radford: 'P1 · Entry',
    years: '0~1년',
    scope: '과업(task) 단위',
    ambiguity: '무엇을 할지는 정해져서 온다. 어떻게 할지를 배운다.',
    accountability: '본인 과업의 완수. 도움을 요청하는 것 자체가 역량.',
    anchor: '3점 = 명확히 정의된 과업을, 정해진 방식으로, 리뷰를 받아 기한 내 완수한다.',
    // 도메인 가중치 합 = 100. 신입은 성과 책임보다 기본기 습득이 크다.
    weights: { delivery: 25, craft: 45, collaboration: 30, leadership: 0 },
    promotionFrom: null,
    theme: { chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  },
  {
    id: 'L2',
    label: '주니어',
    short: 'L2',
    radford: 'P2 · Developing',
    years: '1~3년',
    scope: '기능(feature) 단위',
    ambiguity: '요구사항은 주어지지만 구현 방법은 스스로 정한다.',
    accountability: '맡은 기능의 완결. 막히는 지점을 스스로 인지하고 조기에 알린다.',
    anchor: '3점 = 정의된 기능 하나를 상시 감독 없이 완결하고, 놓친 케이스를 리뷰에서 잡아준다.',
    weights: { delivery: 30, craft: 40, collaboration: 25, leadership: 5 },
    promotionFrom: 'L1',
    promotionIncrease: 5,
    theme: { chip: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  },
  {
    id: 'L3',
    label: '미들',
    short: 'L3',
    radford: 'P3 · Career',
    years: '3~6년',
    scope: '제품 영역(product area) 단위',
    ambiguity: '모호한 요구를 스스로 구조화해 실행 가능한 단위로 쪼갠다.',
    accountability: '담당 영역의 결과. 기술·디자인 선택의 트레이드오프를 설명할 수 있다.',
    anchor: '3점 = 모호한 요구를 스스로 정리해 담당 영역을 끝까지 책임지고, 선택의 근거를 남긴다.',
    weights: { delivery: 35, craft: 30, collaboration: 20, leadership: 15 },
    promotionFrom: 'L2',
    promotionIncrease: 7,
    theme: { chip: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  },
  {
    id: 'L4',
    label: '시니어',
    short: 'L4',
    radford: 'P4 · Advanced',
    years: '6~10년',
    scope: '팀 단위 — 본인 산출물 + 팀의 산출물',
    ambiguity: '문제 자체를 정의한다. 무엇을 하지 않을지도 결정한다.',
    accountability: '팀 성과. 남의 실력을 끌어올린 만큼이 본인 성과로 잡힌다.',
    anchor: '3점 = 팀에서 가장 어려운 문제를 맡아 해결하고, 리뷰·멘토링으로 팀 전체 품질을 끌어올린다.',
    weights: { delivery: 30, craft: 25, collaboration: 20, leadership: 25 },
    promotionFrom: 'L3',
    promotionIncrease: 8,
    theme: { chip: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  },
  {
    id: 'L5',
    label: '리드',
    short: 'L5',
    radford: 'P5 · Expert / M3 · Manager',
    years: '8년+',
    scope: '조직 단위 — 여러 팀·직군에 걸친 영향',
    ambiguity: '풀 가치가 있는 문제인지부터 판단한다. 방향을 세운다.',
    accountability: '조직의 결과. 본인이 없어도 굴러가는 구조를 만든다.',
    anchor: '3점 = 직군·팀 경계를 넘는 방향을 세우고, 그 방향대로 다른 사람들이 일하게 만든다.',
    weights: { delivery: 25, craft: 20, collaboration: 20, leadership: 35 },
    promotionFrom: 'L4',
    promotionIncrease: 10,
    theme: { chip: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  },
]

export const LEVEL_MAP = Object.fromEntries(LEVELS.map((l) => [l.id, l]))
export const LEVEL_IDS = LEVELS.map((l) => l.id)

export const levelOf = (id) => LEVEL_MAP[id] ?? LEVEL_MAP.L2
export const levelIndex = (id) => Math.max(0, LEVEL_IDS.indexOf(id))

/** a 에서 b 로 갈 때의 승급 단계 수 (음수면 강등) */
export const levelDelta = (fromId, toId) => levelIndex(toId) - levelIndex(fromId)

/** L2 -> L3 승급 시 붙는 승급 인상률(%). 여러 단계면 합산. */
export function promotionIncreaseFor(fromId, toId) {
  const from = levelIndex(fromId)
  const to = levelIndex(toId)
  if (to <= from) return 0
  return LEVELS.slice(from + 1, to + 1).reduce((sum, l) => sum + (l.promotionIncrease ?? 0), 0)
}
