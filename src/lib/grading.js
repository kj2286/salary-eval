/**
 * 평가 → 등급 → 인상률 → 연봉 계산.
 * 등급 기준을 바꾸려면 GRADES 의 min/rateMin/rateMax 만 수정하면 된다.
 */

export const GRADES = [
  {
    key: 'S',
    min: 4.5,
    name: '탁월',
    rateMin: 8,
    rateMax: 10,
    openEnded: true, // 8.0% ~ 10.0%+ (상한 초과 협의 가능)
    desc: '기대를 크게 뛰어넘음. 핵심 성과를 주도.',
    badge: 'bg-indigo-600 text-white',
    soft: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    bar: 'bg-indigo-500',
  },
  {
    key: 'A',
    min: 3.8,
    name: '우수',
    rateMin: 5,
    rateMax: 7,
    desc: '기대를 상회. 안정적으로 높은 기여.',
    badge: 'bg-sky-600 text-white',
    soft: 'bg-sky-50 text-sky-700 ring-sky-200',
    bar: 'bg-sky-500',
  },
  {
    key: 'B',
    min: 2.8,
    name: '기대 충족',
    rateMin: 3,
    rateMax: 4,
    desc: '역할에 맞는 성과를 충족.',
    badge: 'bg-emerald-600 text-white',
    soft: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    bar: 'bg-emerald-500',
  },
  {
    key: 'C',
    min: 0,
    name: '개선 필요',
    rateMin: 0,
    rateMax: 0,
    desc: '기대 미달. 동결 및 개선 계획 수립.',
    badge: 'bg-rose-600 text-white',
    soft: 'bg-rose-50 text-rose-700 ring-rose-200',
    bar: 'bg-rose-500',
  },
]

/** 평균 점수 → 등급 객체 */
export function gradeOf(average) {
  return GRADES.find((g) => average >= g.min) ?? GRADES[GRADES.length - 1]
}

/** 점수 맵({항목id: 점수})의 평균. 값이 없는 항목은 기본 3점으로 본다. */
export function averageOf(criteria, scores, fallback = 3) {
  if (!criteria.length) return 0
  const sum = criteria.reduce((acc, c) => acc + (Number(scores?.[c.id]) || fallback), 0)
  return sum / criteria.length
}

/** 등급의 추천 인상률 범위 텍스트 */
export function rateRangeText(grade) {
  if (grade.rateMax === 0 && grade.rateMin === 0) return '0.0% (동결)'
  return `${grade.rateMin.toFixed(1)}% ~ ${grade.rateMax.toFixed(1)}%${grade.openEnded ? '+' : ''}`
}

/** 등급이 정해졌을 때 기본으로 채워줄 인상률 (범위 중앙값) */
export function defaultRateFor(grade) {
  return round1((grade.rateMin + grade.rateMax) / 2)
}

/** 연봉 계산 — 원 단위 반올림 */
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

export const round1 = (n) => Math.round(n * 10) / 10
export const round2 = (n) => Math.round(n * 100) / 100
