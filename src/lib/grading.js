/**
 * 평가 → 등급 → 인상률 → 연봉 계산 엔진.
 *
 * 예전 버전과의 결정적 차이 3가지
 * 1) 점수: 전 항목 단순평균 → 도메인 평균의 레벨별 가중합
 * 2) 인상률: 등급 1축 → 등급 × compa-ratio 2축 merit matrix (보상 컨설팅 표준)
 * 3) 주기: 분기마다 연봉 인상 → 분기는 평가 기록, 연 1회만 보상 확정
 *    (분기마다 인상률을 복리로 반영하면 연 12~40% 가 된다. 원래 앱의 실질적 버그)
 */

import { DOMAINS } from '../data/roles.js'
import { levelOf, promotionIncreaseFor } from '../data/levels.js'

export const round1 = (n) => Math.round(n * 10) / 10
export const round2 = (n) => Math.round(n * 100) / 100

/* ============================ 등급 ============================ */

/**
 * 5단계. 한국 기업에서 가장 널리 쓰는 S/A/B/C/D 를 그대로 쓴다.
 * guide: 캘리브레이션용 권장 분포(%). 강제배분이 아니라 "쏠렸는지" 를 보는 기준선이다.
 */
export const GRADES = [
  {
    key: 'S',
    min: 4.3,
    name: '탁월',
    guide: 10,
    desc: '레벨 기대치를 크게 상회. 한 단계 위 레벨의 일을 이미 하고 있다.',
    badge: 'bg-indigo-600 text-white',
    soft: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    bar: 'bg-indigo-500',
  },
  {
    key: 'A',
    min: 3.7,
    name: '우수',
    guide: 25,
    desc: '레벨 기대치를 안정적으로 상회. 핵심 과제를 맡길 수 있다.',
    badge: 'bg-sky-600 text-white',
    soft: 'bg-sky-50 text-sky-700 ring-sky-200',
    bar: 'bg-sky-500',
  },
  {
    key: 'B',
    min: 2.9,
    name: '기대 충족',
    guide: 45,
    desc: '레벨에 맞는 성과를 냈다. 대다수가 여기 있는 것이 정상이다.',
    badge: 'bg-emerald-600 text-white',
    soft: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    bar: 'bg-emerald-500',
  },
  {
    key: 'C',
    min: 2.2,
    name: '개선 필요',
    guide: 15,
    desc: '기대에 미달한 영역이 있다. 구체적 개선 목표를 문서로 합의한다.',
    badge: 'bg-amber-600 text-white',
    soft: 'bg-amber-50 text-amber-700 ring-amber-200',
    bar: 'bg-amber-500',
  },
  {
    key: 'D',
    min: 0,
    name: '미흡',
    guide: 5,
    desc: '역할 수행에 문제가 있다. 레벨 재검토 또는 직무 재배치를 논의한다.',
    badge: 'bg-rose-600 text-white',
    soft: 'bg-rose-50 text-rose-700 ring-rose-200',
    bar: 'bg-rose-500',
  },
]

export const GRADE_MAP = Object.fromEntries(GRADES.map((g) => [g.key, g]))
export const gradeOf = (score) => GRADES.find((g) => score >= g.min) ?? GRADES[GRADES.length - 1]

/* ============================ 채점 ============================ */

/**
 * 도메인별 평균 → 레벨 가중치로 가중합.
 * 평가 대상 항목이 하나도 없는 도메인은 가중치를 다른 도메인에 비례 재분배한다.
 * (그래야 리더십 항목이 없는 L1 도 1~5 스케일이 유지된다)
 *
 * @returns { score, byDomain: { [domainId]: { avg, weight, count } } }
 */
export function scoreEvaluation(groups, scores, fallback = 3) {
  const byDomain = {}
  let weightSum = 0

  for (const g of groups) {
    if (!g.criteria.length) continue
    const avg =
      g.criteria.reduce((acc, c) => acc + (Number(scores?.[c.id]) || fallback), 0) / g.criteria.length
    byDomain[g.domain.id] = { avg: round2(avg), weight: g.weight, count: g.criteria.length }
    weightSum += g.weight
  }

  if (!weightSum) return { score: 0, byDomain }

  const score = Object.values(byDomain).reduce((acc, d) => acc + d.avg * (d.weight / weightSum), 0)
  return { score: round2(score), byDomain, effectiveWeightSum: weightSum }
}

/** 화면에서 도메인 순서를 보장하기 위한 헬퍼 */
export const domainOrder = DOMAINS.map((d) => d.id)

/* ======================= compa-ratio ========================= */

/**
 * compa-ratio = 현재 연봉 / 밴드 중위값.
 * 0.9 면 시장 중위 대비 10% 낮게 받고 있다는 뜻.
 * 같은 S 등급이라도 밴드 하단에 있는 사람에게 더 크게 올리는 근거가 된다.
 */
export function compaRatio(salary, band) {
  const mid = Number(band?.mid) || 0
  if (!mid) return null
  return round2((Number(salary) || 0) / mid)
}

/** 밴드 내 위치(0~1). 하단 미만은 음수, 상단 초과는 1 초과. */
export function rangePenetration(salary, band) {
  const min = Number(band?.min) || 0
  const max = Number(band?.max) || 0
  if (max <= min) return null
  return round2(((Number(salary) || 0) - min) / (max - min))
}

export const COMPA_BANDS = [
  { key: 'q1', max: 0.85, label: '~85%', desc: '밴드 하단 — 시장 대비 낮음, 이탈 위험' },
  { key: 'q2', max: 0.95, label: '85~95%', desc: '중위 아래 — 성장 구간' },
  { key: 'q3', max: 1.05, label: '95~105%', desc: '중위 근처 — 적정' },
  { key: 'q4', max: 1.15, label: '105~115%', desc: '중위 위 — 상위 성과자 구간' },
  { key: 'q5', max: Infinity, label: '115%~', desc: '밴드 상단 — 인상보다 승급/일시금 검토' },
]

export const compaBandOf = (ratio) =>
  COMPA_BANDS.find((b) => (ratio ?? 1) < b.max) ?? COMPA_BANDS[COMPA_BANDS.length - 1]

/* ====================== merit matrix ========================= */

/**
 * 기준 재원 4.5% 일 때의 인상률(%) 표.
 * 행=등급, 열=compa-ratio 구간.
 *
 * 설계 원칙
 * - 같은 등급이면 밴드 하단일수록 크게 올린다 (시장 추격)
 * - 같은 compa 라면 등급이 높을수록 크게 올린다 (성과 보상)
 * - D 는 전 구간 0%. 삭감은 넣지 않는다 — 한국에서 임금 삭감은 개별 동의 사안이라
 *   이 앱이 자동으로 계산해 줄 성질의 것이 아니다. (compliance.js 참고)
 *
 * 권장 분포(S10/A25/B45/C15/D5)로 가중하면 가중평균 ≈ 4.4% → 2026 한국 평균 4.6%와 정합.
 */
export const BASE_BUDGET = 4.5

const MATRIX = {
  S: { q1: 12, q2: 10, q3: 8, q4: 6, q5: 4 },
  A: { q1: 9, q2: 7.5, q3: 6, q4: 4.5, q5: 3 },
  B: { q1: 6, q2: 5, q3: 4, q4: 3, q5: 1.5 },
  C: { q1: 3, q2: 2.5, q3: 2, q4: 1, q5: 0 },
  D: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 },
}

/** 재원(budget %)에 비례해 표 전체를 스케일링한 값 */
export function meritRate(gradeKey, compa, budget = BASE_BUDGET) {
  const bandKey = compaBandOf(compa).key
  const base = MATRIX[gradeKey]?.[bandKey] ?? 0
  const scale = (Number(budget) || BASE_BUDGET) / BASE_BUDGET
  return round1(base * scale)
}

/** 화면 표시용 — 재원 반영된 전체 매트릭스 */
export function meritMatrix(budget = BASE_BUDGET) {
  const scale = (Number(budget) || BASE_BUDGET) / BASE_BUDGET
  return GRADES.map((g) => ({
    grade: g,
    cells: COMPA_BANDS.map((b) => ({ band: b, rate: round1(MATRIX[g.key][b.key] * scale) })),
  }))
}

/** 권장 분포로 가중한 기대 인상률 — 재원이 현실적인지 보는 지표 */
export function expectedBudget(budget = BASE_BUDGET) {
  const scale = (Number(budget) || BASE_BUDGET) / BASE_BUDGET
  return round1(
    GRADES.reduce((acc, g) => acc + MATRIX[g.key].q3 * scale * (g.guide / 100), 0),
  )
}

/* ==================== 연간 확정(merit cycle) ==================== */

/**
 * 분기 평가들을 모아 연간 확정 등급을 낸다.
 * - 평가된 분기만 평균 (미평가 분기를 3점으로 채우지 않는다 — 관대화의 주범)
 * - 2개 분기 미만이면 근거 부족으로 표시
 */
export function annualRollup(quarterEvaluations) {
  const list = [...quarterEvaluations].sort((a, b) => (a.quarter < b.quarter ? -1 : 1))
  if (!list.length) return { score: null, grade: null, count: 0, quarters: [] }
  const score = round2(list.reduce((acc, r) => acc + Number(r.score ?? 0), 0) / list.length)
  return {
    score,
    grade: gradeOf(score),
    count: list.length,
    quarters: list.map((r) => ({ quarter: r.quarter, score: r.score, grade: r.grade })),
    sufficient: list.length >= 2,
  }
}

/**
 * 최종 인상률 = merit(등급 × compa) + 승급 인상(레벨이 오른 경우).
 * 승급 인상을 merit 에 섞지 않는 것이 핵심 — 섞으면 "성과 때문인지 승급 때문인지"를
 * 본인에게 설명할 수 없고, 이듬해 기준선이 왜곡된다.
 */
export function finalRateOf({ gradeKey, compa, budget, fromLevel, toLevel }) {
  const merit = meritRate(gradeKey, compa, budget)
  const promotion = promotionIncreaseFor(fromLevel, toLevel ?? fromLevel)
  return { merit, promotion, total: round1(merit + promotion) }
}

/* ========================= 연봉 계산 ========================= */

export function calcSalary(currentSalary, ratePercent) {
  const base = Math.max(0, Number(currentSalary) || 0)
  const rate = Number(ratePercent) || 0
  const raiseAmount = Math.round((base * rate) / 100)
  const newSalary = base + raiseAmount
  return {
    base,
    rate,
    raiseAmount,
    newSalary,
    monthlyGross: Math.round(newSalary / 12),
    monthlyBefore: Math.round(base / 12),
  }
}

/** 실제 분포 vs 권장 분포 — 캘리브레이션 패널용 */
export function distributionOf(records) {
  const total = records.length
  return GRADES.map((g) => {
    const count = records.filter((r) => r.grade === g.key).length
    return {
      grade: g,
      count,
      pct: total ? Math.round((count / total) * 1000) / 10 : 0,
      guide: g.guide,
      delta: total ? Math.round((count / total) * 1000) / 10 - g.guide : 0,
    }
  })
}

/** 레벨 기대치 대비 현재 등급이 승급 신호인지 (2년 연속 A 이상이면 승급 검토) */
export function promotionSignal(annualHistory) {
  const recent = annualHistory.slice(-2)
  if (recent.length < 2) return null
  return recent.every((a) => a.grade === 'S' || a.grade === 'A')
    ? '최근 2회 연속 A 이상 — 승급 심사 대상으로 올릴 것'
    : null
}
