/** 분기 키는 '2026-Q3' 형식 문자열 하나로 다룬다 (정렬·비교·저장이 전부 문자열로 끝난다) */

export const quarterKey = (year, q) => `${year}-Q${q}`

export function parseQuarter(key) {
  const [year, q] = String(key).split('-Q')
  return { year: Number(year), q: Number(q) }
}

export function currentQuarter(date = new Date()) {
  return quarterKey(date.getFullYear(), Math.floor(date.getMonth() / 3) + 1)
}

export const quarterLabel = (key) => {
  const { year, q } = parseQuarter(key)
  return `${year}년 ${q}분기`
}

/** '4~6월' — 분기 선택기 보조 표기 */
export const quarterMonths = (key) => {
  const { q } = parseQuarter(key)
  return `${(q - 1) * 3 + 1}~${q * 3}월`
}

/** delta 만큼 앞뒤 분기 이동 */
export function shiftQuarter(key, delta) {
  const { year, q } = parseQuarter(key)
  const index = year * 4 + (q - 1) + delta
  return quarterKey(Math.floor(index / 4), (index % 4) + 1)
}

/** 최근 n개 분기를 과거→현재 순으로 */
export function recentQuarters(key, n = 4) {
  return Array.from({ length: n }, (_, i) => shiftQuarter(key, i - (n - 1)))
}

/** 문자열 정렬이 곧 시간 순서 ('2026-Q3' > '2026-Q2') */
export const compareQuarters = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
