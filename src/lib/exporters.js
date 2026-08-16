import { ROLE_MAP } from '../data/roles.js'
import { calcSalary, gradeOf, rateRangeText } from './grading.js'
import { quarterLabel } from './quarters.js'

/**
 * 평가 레코드 1건 → "평평한 한 줄".
 * CSV / TSV(구글 시트 붙여넣기) / 웹훅 전송이 모두 이 형태를 공유한다.
 * 이름·직무·연봉은 평가 시점 스냅샷을 그대로 쓴다(이후 명부가 바뀌어도 과거 평가는 불변).
 */
export function toRow(record) {
  const role = ROLE_MAP[record.roleId]
  const salary = calcSalary(record.currentSalary, record.finalRate)
  const grade = gradeOf(record.average)

  const row = {
    분기: quarterLabel(record.quarter),
    평가일: record.evaluatedAt,
    평가자: record.evaluator ?? '',
    이름: record.name,
    직무: role?.label ?? record.roleId,
  }

  ;(role?.criteria ?? []).forEach((c, i) => {
    row[`항목${i + 1}_명`] = c.label
    row[`항목${i + 1}_점수`] = record.scores[c.id] ?? ''
  })

  Object.assign(row, {
    평균점수: record.average.toFixed(2),
    등급: grade.key,
    추천인상률: rateRangeText(grade),
    확정인상률: `${Number(record.finalRate).toFixed(1)}%`,
    현재연봉: salary.base,
    인상금액: salary.raiseAmount,
    조정후연봉: salary.newSalary,
    '월수령액(세전)': salary.monthlyGross,
    메모: record.memo ?? '',
  })

  return row
}

/** 여러 직무가 섞여도 열이 어긋나지 않도록 모든 키의 합집합을 헤더로 쓴다 */
function headersOf(rows) {
  const seen = []
  rows.forEach((row) =>
    Object.keys(row).forEach((k) => {
      if (!seen.includes(k)) seen.push(k)
    }),
  )
  return seen
}

const escapeCsv = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(records) {
  const rows = records.map(toRow)
  const headers = headersOf(rows)
  const lines = [headers.map(escapeCsv).join(',')]
  rows.forEach((row) => lines.push(headers.map((h) => escapeCsv(row[h] ?? '')).join(',')))
  return lines.join('\r\n')
}

/** 구글 시트에 그대로 붙여넣기 좋은 TSV (탭 구분) */
export function toTsv(records) {
  const rows = records.map(toRow)
  const headers = headersOf(rows)
  const clean = (v) => String(v ?? '').replace(/[\t\n\r]/g, ' ')
  return [
    headers.join('\t'),
    ...rows.map((row) => headers.map((h) => clean(row[h])).join('\t')),
  ].join('\n')
}

/** 백업/복원용 — 명부와 평가를 함께 담는다 */
export function toJson({ employees, evaluations }) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: 'mathsecretary-salary-eval',
      version: 2,
      employees,
      evaluations,
    },
    null,
    2,
  )
}

export function downloadFile(filename, content, mime) {
  // 엑셀에서 한글이 깨지지 않도록 CSV 에는 BOM 을 붙인다
  const parts = mime.startsWith('text/csv') ? ['﻿', content] : [content]
  const url = URL.createObjectURL(new Blob(parts, { type: `${mime};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 비보안 컨텍스트(파일 프로토콜 등) 폴백
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

/**
 * Google Sheets 전송 — Apps Script 웹앱(doPost) URL 로 POST.
 * CORS 프리플라이트를 피하려고 text/plain + no-cors 로 보낸다(응답은 확인 불가).
 * 스크립트 예시는 README 의 "Google Sheets 연동" 참고.
 */
export async function sendToSheets(webhookUrl, records) {
  if (!webhookUrl) throw new Error('웹훅 URL이 비어 있습니다.')
  const payload = { rows: records.map(toRow), sentAt: new Date().toISOString() }
  await fetch(webhookUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  // no-cors 응답은 opaque 라 성공 여부를 읽을 수 없다 — 시트에서 직접 확인해야 한다
  return { sent: payload.rows.length, opaque: true }
}
