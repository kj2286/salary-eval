/**
 * 한국 IT 직군 보상 밴드 (2026 기준 참고치).
 *
 * ⚠️ 이 숫자는 "우리 회사의 정답"이 아니라 공개 자료로 만든 출발점이다.
 * 실제 운영에서는 화면의 [보상 밴드] 에서 회사 실정에 맞게 덮어써서 쓴다.
 *
 * 근거로 삼은 공개 자료 (2026-08 조사)
 * - 잡플래닛/컴퍼니타임스 개발자 연차별 평균: 1년차 3,766 / 3년차 4,158 / 6년차 5,139 / 10년차 6,214 (만원)
 *   직무별 전 연차 평균: 소프트웨어개발 5,526, 머신러닝 5,035, 안드로이드 5,096, iOS 4,975
 *   10년차 격차: 머신러닝 8,263 ~ 웹퍼블리셔 4,903
 * - 원티드랩 UX 디자이너: 신입 3,045 / 3년차 3,653 / 8년차 4,804
 *   (단, 프로덕트 디자이너·IT 자사 서비스 기준은 이보다 높게 형성 — 신입 3,200~3,800)
 * - 2026 임금인상률: 전체 평균 4.6%, 대기업 3.8% / 중견 4.5% / 중소 4.8%
 * - SW기술자 평균임금 2026: 전년 대비 +4.7%
 *
 * 밴드 폭(min/max)은 mid 대비 배율로 잡는다.
 * 상위 레벨일수록 넓다 — 같은 시니어라도 시장 편차가 크기 때문이다.
 * (Mercer/WTW 관행: 하위 등급 ±15% 내외 → 상위 등급 ±25% 내외)
 */

const SPREAD = {
  L1: { min: 0.9, max: 1.12 },
  L2: { min: 0.88, max: 1.15 },
  L3: { min: 0.85, max: 1.18 },
  L4: { min: 0.85, max: 1.22 },
  L5: { min: 0.82, max: 1.28 },
}

/** 레벨별 중위값(만원). 이 값만 바꾸면 밴드 전체가 따라 움직인다. */
const MID_MAN = {
  designer: { L1: 3400, L2: 4000, L3: 4800, L4: 5800, L5: 7000 },
  fe: { L1: 3800, L2: 4500, L3: 5400, L4: 6600, L5: 8000 },
  be: { L1: 4000, L2: 4700, L3: 5700, L4: 7000, L5: 8500 },
  ai: { L1: 4300, L2: 5100, L3: 6200, L4: 7600, L5: 9200 },
}

const toWon = (man) => Math.round(man) * 10000
const roundTo = (won, unit = 100000) => Math.round(won / unit) * unit

function buildBand(midMan, levelId) {
  const mid = toWon(midMan)
  const s = SPREAD[levelId]
  return { min: roundTo(mid * s.min), mid: roundTo(mid), max: roundTo(mid * s.max) }
}

/** DEFAULT_BANDS[roleId][levelId] = { min, mid, max } (원 단위) */
export const DEFAULT_BANDS = Object.fromEntries(
  Object.entries(MID_MAN).map(([roleId, byLevel]) => [
    roleId,
    Object.fromEntries(
      Object.entries(byLevel).map(([levelId, midMan]) => [levelId, buildBand(midMan, levelId)]),
    ),
  ]),
)

/** 사용자 오버라이드가 있으면 그것을, 없으면 기본 밴드를 돌려준다 */
export function bandFor(roleId, levelId, overrides) {
  const custom = overrides?.[roleId]?.[levelId]
  if (custom && Number(custom.min) > 0 && Number(custom.max) > 0) {
    const min = Number(custom.min)
    const max = Number(custom.max)
    const mid = Number(custom.mid) || Math.round((min + max) / 2)
    return { min, mid, max, custom: true }
  }
  return { ...(DEFAULT_BANDS[roleId]?.[levelId] ?? DEFAULT_BANDS.fe.L2), custom: false }
}

/* ---------- 한국 법정 기준 (연 1회 갱신 필요) ---------- */

export const MINIMUM_WAGE = {
  year: 2026,
  hourly: 10320, // 2026년 최저임금 시간급 (전년 10,030원 대비 +2.9%)
  monthlyHours: 209, // 주 40시간 + 유급주휴 기준 월 환산 시간
  get monthly() {
    return this.hourly * this.monthlyHours // 2,156,880원
  },
  get annual() {
    return this.monthly * 12 // 25,882,560원
  },
}

/** 2026 시장 임금인상률 참고 — 재원(budget) 기본값의 근거 */
export const MARKET_MERIT = {
  year: 2026,
  overall: 4.6,
  large: 3.8,
  mid: 4.5,
  small: 4.8,
  note: '2026년 연봉협상 결과 기준. 인상자 대상 평균은 이보다 높게(7%대) 잡히니 혼동 주의.',
}
