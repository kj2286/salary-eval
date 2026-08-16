const won = new Intl.NumberFormat('ko-KR')

/** 12,345,678 */
export const formatNumber = (n) => won.format(Math.round(Number(n) || 0))

/** 12,345,678원 */
export const formatWon = (n) => `${formatNumber(n)}원`

/** 4,200만원 / 1억 2,000만원 — 카드 보조 표기용 */
export function formatKoreanWon(n) {
  const v = Math.round(Number(n) || 0)
  if (v === 0) return '0원'
  const eok = Math.floor(v / 100_000_000)
  const man = Math.floor((v % 100_000_000) / 10_000)
  const parts = []
  if (eok) parts.push(`${won.format(eok)}억`)
  if (man) parts.push(`${won.format(man)}만`)
  if (!parts.length) return formatWon(v)
  return `${parts.join(' ')}원`
}

/** 숫자 입력에서 콤마·문자 제거 */
export const parseNumber = (value) => {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

/** 2026-08-14 */
export function todayISO(d = new Date()) {
  const kst = new Date(d.getTime() + (9 * 60 + d.getTimezoneOffset()) * 60_000)
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, '0')}-${String(
    kst.getDate(),
  ).padStart(2, '0')}`
}
