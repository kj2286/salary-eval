/**
 * 평가 → 상대등급 → 권장 인상률(%) 계산 엔진.
 *
 * 설계 전제가 바뀌었다: **이 앱은 연봉 금액을 다루지 않는다.**
 * 평가는 리더가 하고, 금액은 HR 만 안다. 그래서 산출물은 등급과 인상률(%)까지다.
 * 시장 대비 위치(compa-ratio)를 반영한 최종 금액 확정은 HR 단계의 일이다.
 *
 * 등급은 절대 컷오프가 아니라 **상대평가(순위 기반 분포 배분)** 로 정한다.
 * 다만 순수 상대평가는 "전원 우수한 팀에서도 누군가 D" 가 되므로 절대 가드를 둔다.
 */

import { DOMAINS } from '../data/roles.js'
import { promotionIncreaseFor } from '../data/levels.js'

export const round1 = (n) => Math.round(n * 10) / 10
export const round2 = (n) => Math.round(n * 100) / 100

/* ============================ 등급 ============================ */

/**
 * guide: 권장 분포(%). 상대평가에서는 이게 실제 배분 목표다.
 * min: 상대평가를 끄고 절대평가로 돌릴 때만 쓰는 컷오프.
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
export const GRADE_KEYS = GRADES.map((g) => g.key)
/** 0 = S(최상) … 4 = D. 작을수록 좋다. */
export const gradeRank = (key) => Math.max(0, GRADE_KEYS.indexOf(key))
/** 절대평가 컷오프 (상대평가를 끈 경우에만 쓰인다) */
export const absoluteGradeOf = (score) =>
  GRADES.find((g) => score >= g.min) ?? GRADES[GRADES.length - 1]
export const gradeOf = absoluteGradeOf

export const DEFAULT_DISTRIBUTION = Object.fromEntries(GRADES.map((g) => [g.key, g.guide]))

/** 순수 상대평가의 부작용을 막는 절대 가드 */
export const DEFAULT_GUARDS = {
  enabled: true,
  floorScore: 4.0, // 이 점수 이상이면 C·D 로 내리지 않는다 (최소 B)
  ceilScore: 2.5, // 이 점수 미만이면 S·A 로 올리지 않는다 (최대 C)
}

/* ============================ 채점 ============================ */

/**
 * 도메인별 평균 → 레벨 가중치로 가중합.
 * 평가 대상 항목이 없는 도메인의 가중치는 나머지에 비례 재분배한다.
 */
export function scoreEvaluation(groups, scores, fallback = 3) {
  const byDomain = {}
  let weightSum = 0

  for (const g of groups) {
    if (!g.criteria.length) continue
    const avg =
      g.criteria.reduce((acc, c) => acc + (Number(scores?.[c.id]) || fallback), 0) /
      g.criteria.length
    byDomain[g.domain.id] = { avg: round2(avg), weight: g.weight, count: g.criteria.length }
    weightSum += g.weight
  }

  if (!weightSum) return { score: 0, byDomain }

  const score = Object.values(byDomain).reduce((acc, d) => acc + d.avg * (d.weight / weightSum), 0)
  return { score: round2(score), byDomain, effectiveWeightSum: weightSum }
}

export const domainOrder = DOMAINS.map((d) => d.id)

/* ======================= 상대평가 배분 ======================= */

/** 최대잉여법 — 분포(%)를 인원수로 바꾼다. 합이 정확히 total 이 되도록 보정. */
export function largestRemainder(total, percents) {
  const raw = percents.map((p) => (total * p) / 100)
  const base = raw.map((v) => Math.floor(v))
  let rest = total - base.reduce((a, b) => a + b, 0)
  const order = raw
    .map((v, i) => ({ i, r: v - Math.floor(v) }))
    .sort((a, b) => b.r - a.r || a.i - b.i)
  for (let k = 0; k < order.length && rest > 0; k += 1) {
    base[order[k].i] += 1
    rest -= 1
  }
  return base
}

/**
 * 순위 기반 등급 배분.
 *
 * @param entries [{ id, score }]
 * @returns { byId, rankById, targets, counts, adjustments, sorted }
 *
 * 동점 처리: 같은 점수는 반드시 같은 등급을 받는다.
 * 동점 그룹이 등급 경계를 걸치면 그 그룹의 **다수가 속한 등급**으로 몰아준다.
 * (전원 동점이면 다수결에 따라 전원 B 가 된다 — "모두 같으면 모두 기대 충족")
 */
export function assignRelativeGrades(
  entries,
  { distribution = DEFAULT_DISTRIBUTION, guards = DEFAULT_GUARDS } = {},
) {
  const n = entries.length
  const empty = { byId: {}, rankById: {}, targets: [], counts: {}, adjustments: [], sorted: [] }
  if (!n) return empty

  const targets = largestRemainder(
    n,
    GRADES.map((g) => Number(distribution?.[g.key] ?? g.guide)),
  )

  const sorted = [...entries].sort(
    (a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)),
  )

  // 순위 → 등급 인덱스
  const rankGrade = []
  let gi = 0
  let left = targets[0]
  for (let r = 0; r < n; r += 1) {
    while (left <= 0 && gi < GRADES.length - 1) {
      gi += 1
      left = targets[gi]
    }
    rankGrade.push(gi)
    left -= 1
  }

  const byId = {}
  const rankById = {}
  let i = 0
  while (i < n) {
    let j = i
    while (j + 1 < n && sorted[j + 1].score === sorted[i].score) j += 1
    const counts = {}
    for (let k = i; k <= j; k += 1) counts[rankGrade[k]] = (counts[rankGrade[k]] ?? 0) + 1
    const winner = Number(
      Object.entries(counts).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0][0],
    )
    for (let k = i; k <= j; k += 1) {
      byId[sorted[k].id] = GRADES[winner].key
      rankById[sorted[k].id] = i + 1 // 동점은 같은 순위
    }
    i = j + 1
  }

  /**
   * 절대 가드 — 분포보다 상식이 앞선다.
   *
   * 등급 인덱스를 clamp 한 뒤 **단조성**을 다시 강제하는 것이 핵심이다.
   * 단순히 상한만 걸면 "2.40점 C, 2.20점 B" 같은 순위 역전이 생긴다.
   * (clamp 자체는 점수만 보고 걸리므로 동점 그룹의 등급 일치는 그대로 유지된다)
   */
  const adjustments = []
  if (guards?.enabled) {
    const before = { ...byId }
    const clamped = sorted.map((e) => {
      let r = gradeRank(byId[e.id])
      if (e.score >= guards.floorScore) r = Math.min(r, gradeRank('B')) // 최소 B
      if (e.score < guards.ceilScore) r = Math.max(r, gradeRank('C')) // 최대 C
      return r
    })
    // 점수 내림차순이므로 등급 인덱스는 비내림차순이어야 한다
    for (let k = 1; k < clamped.length; k += 1) {
      if (clamped[k] < clamped[k - 1]) clamped[k] = clamped[k - 1]
    }
    sorted.forEach((e, k) => {
      byId[e.id] = GRADE_KEYS[clamped[k]]
      if (byId[e.id] !== before[e.id]) {
        const guardHit =
          e.score >= guards.floorScore
            ? `절대 점수 ${e.score.toFixed(2)} — 하한 가드(${guards.floorScore} 이상은 최소 B)`
            : e.score < guards.ceilScore
              ? `절대 점수 ${e.score.toFixed(2)} — 상한 가드(${guards.ceilScore} 미만은 최대 C)`
              : '순위 역전 방지를 위한 조정'
        adjustments.push({ id: e.id, from: before[e.id], to: byId[e.id], reason: guardHit })
      }
    })
  }

  const counts = Object.fromEntries(
    GRADES.map((g) => [g.key, Object.values(byId).filter((k) => k === g.key).length]),
  )

  return { byId, rankById, targets, counts, adjustments, sorted }
}

/** 등급 경계에 걸친(점수 차 threshold 이내) 인접 쌍 — 캘리브레이션에서 다시 볼 대상 */
export function borderlinePairs(sorted, byId, threshold = 0.15) {
  const out = []
  for (let i = 0; i + 1 < sorted.length; i += 1) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (byId[a.id] === byId[b.id]) continue
    const gap = round2(a.score - b.score)
    if (gap <= threshold) out.push({ upper: a, lower: b, gap, from: byId[a.id], to: byId[b.id] })
  }
  return out
}

/* ==================== 권장 인상률 (금액 없음) ==================== */

/** 기준 재원 4.5% 일 때의 등급별 인상률 밴드(%) */
export const BASE_BUDGET = 4.5

const RATE_BANDS = {
  S: { min: 7, mid: 8, max: 10 },
  A: { min: 5, mid: 6, max: 7 },
  B: { min: 3, mid: 4, max: 5 },
  C: { min: 1, mid: 2, max: 3 },
  D: { min: 0, mid: 0, max: 0 },
}

/** 재원에 비례해 스케일링한 등급별 인상률 밴드 */
export function rateBandFor(gradeKey, budget = BASE_BUDGET) {
  const scale = (Number(budget) || BASE_BUDGET) / BASE_BUDGET
  const b = RATE_BANDS[gradeKey] ?? RATE_BANDS.B
  return { min: round1(b.min * scale), mid: round1(b.mid * scale), max: round1(b.max * scale) }
}

export const rateTable = (budget = BASE_BUDGET) =>
  GRADES.map((g) => ({ grade: g, band: rateBandFor(g.key, budget) }))

/** 권장 분포로 가중한 기대 인상률 — 재원이 현실적인지 보는 지표 */
export function expectedBudget(budget = BASE_BUDGET, distribution = DEFAULT_DISTRIBUTION) {
  return round1(
    GRADES.reduce(
      (acc, g) => acc + rateBandFor(g.key, budget).mid * ((distribution?.[g.key] ?? g.guide) / 100),
      0,
    ),
  )
}

/** 실제 배분 결과로 계산한 평균 인상률 — 재원 초과 여부 판단용 */
export function averageRate(records) {
  if (!records.length) return 0
  return round2(records.reduce((acc, r) => acc + Number(r.finalRate ?? 0), 0) / records.length)
}

/**
 * 최종 인상률 = 성과 인상 + 승급 인상.
 * 승급 인상을 섞지 않는 이유는 본인에게 "무엇 때문에 올랐는지"를 설명하기 위해서다.
 */
export function finalRateOf({ gradeKey, budget, fromLevel, toLevel }) {
  const merit = rateBandFor(gradeKey, budget).mid
  const promotion = promotionIncreaseFor(fromLevel, toLevel ?? fromLevel)
  return { merit, promotion, total: round1(merit + promotion) }
}

/* ==================== 연간 확정(merit cycle) ==================== */

export function annualRollup(quarterEvaluations) {
  const list = [...quarterEvaluations].sort((a, b) => (a.quarter < b.quarter ? -1 : 1))
  if (!list.length) return { score: null, count: 0, quarters: [] }
  const score = round2(list.reduce((acc, r) => acc + Number(r.score ?? 0), 0) / list.length)
  return {
    score,
    count: list.length,
    quarters: list.map((r) => ({ quarter: r.quarter, score: r.score, grade: r.grade })),
    sufficient: list.length >= 2,
  }
}

/* ======================= 직전 대비 변화 ======================= */

/**
 * 직전 기록 대비 증감.
 * - scoreDelta / scorePct: 점수의 절대·상대 변화
 * - gradeMove: 양수면 등급 상승 (S 가 0 이므로 rank 가 줄면 상승)
 * - rateDelta: 인상률 %p 변화
 */
export function deltaOf(current, previous) {
  if (!current || !previous) return null
  const curScore = Number(current.score ?? 0)
  const prevScore = Number(previous.score ?? 0)
  const scoreDelta = round2(curScore - prevScore)
  const scorePct = prevScore ? round1((scoreDelta / prevScore) * 100) : null

  const gradeMove =
    current.grade && previous.grade ? gradeRank(previous.grade) - gradeRank(current.grade) : null

  const rateDelta =
    current.finalRate != null && previous.finalRate != null
      ? round1(Number(current.finalRate) - Number(previous.finalRate))
      : null

  return {
    scoreDelta,
    scorePct,
    gradeMove,
    fromGrade: previous.grade ?? null,
    toGrade: current.grade ?? null,
    rateDelta,
    fromRate: previous.finalRate ?? null,
    toRate: current.finalRate ?? null,
    label: previous.label ?? null,
  }
}

/** 실제 분포 vs 권장 분포 */
export function distributionOf(records, distribution = DEFAULT_DISTRIBUTION) {
  const total = records.length
  return GRADES.map((g) => {
    const count = records.filter((r) => r.grade === g.key).length
    const guide = Number(distribution?.[g.key] ?? g.guide)
    const pct = total ? Math.round((count / total) * 1000) / 10 : 0
    return { grade: g, count, pct, guide, delta: Math.round((pct - guide) * 10) / 10 }
  })
}

/** 2회 연속 A 이상이면 승급 심사 신호 */
export function promotionSignal(annualHistory) {
  const recent = annualHistory.slice(-2)
  if (recent.length < 2) return null
  return recent.every((a) => a.grade === 'S' || a.grade === 'A')
    ? '최근 2회 연속 A 이상 — 승급 심사 대상으로 올릴 것'
    : null
}
