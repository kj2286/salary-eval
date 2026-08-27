import { CORE_CRITERIA, ROLE_MAP } from '../data/roles.js'
import { LEVEL_MAP } from '../data/levels.js'
import { GRADE_MAP } from './grading.js'
import { quarterLabel } from './quarters.js'

/**
 * 레코드 1건 → "평평한 한 줄". CSV / TSV / 웹훅이 모두 이 형태를 공유한다.
 *
 * ⚠️ 연봉 금액은 어떤 행에도 들어가지 않는다. 이 앱은 금액을 저장하지 않으며,
 * 내보낸 파일이 그대로 공유돼도 개인 연봉이 새지 않아야 한다.
 */
export const toRow = (record) =>
  record?.year != null ? toDecisionRow(record) : toEvaluationRow(record)

/** 분기 평가 */
export function toEvaluationRow(record) {
  const role = ROLE_MAP[record.roleId]
  const level = LEVEL_MAP[record.levelId] ?? LEVEL_MAP.L2
  const grade = GRADE_MAP[record.grade] ?? GRADE_MAP.B

  const row = {
    구분: '분기평가',
    분기: quarterLabel(record.quarter),
    평가일: record.updatedAt ?? record.evaluatedAt,
    평가자: record.evaluator ?? '',
    이름: record.name,
    직무: role?.label ?? record.roleId,
    레벨: `${level.short} ${level.label}`,
  }

  for (const [domainId, d] of Object.entries(record.byDomain ?? {})) {
    row[`${domainId}_점수`] = d.avg
    row[`${domainId}_가중치`] = `${d.weight}%`
  }

  const criteria = [...(role?.criteria ?? []), ...CORE_CRITERIA]
  criteria.forEach((c) => {
    if (record.scores?.[c.id] != null) row[`항목_${c.label}`] = record.scores[c.id]
  })

  Object.assign(row, {
    가중점수: Number(record.score ?? 0).toFixed(2),
    잠정등급: grade.key,
    메모: record.memo ?? '',
  })
  return row
}

/** 연간 등급 확정 */
export function toDecisionRow(record) {
  const role = ROLE_MAP[record.roleId]
  const from = LEVEL_MAP[record.fromLevel] ?? LEVEL_MAP.L2
  const to = LEVEL_MAP[record.toLevel] ?? from

  return {
    구분: '연간확정',
    연도: `${record.year}년`,
    확정일: record.decidedAt,
    결정자: record.evaluator ?? '',
    이름: record.name,
    직무: role?.label ?? record.roleId,
    레벨: from.id === to.id ? `${to.short} ${to.label}` : `${from.short} → ${to.short} (승급)`,
    평가분기수: record.quarterCount,
    연간점수: Number(record.annualScore ?? 0).toFixed(2),
    등급: record.grade,
    순위: record.rank ? `${record.rank}/${record.cohortSize}` : '',
    '직전대비_점수': record.delta ? Number(record.delta.scoreDelta).toFixed(2) : '',
    '직전대비_점수%': record.delta?.scorePct != null ? `${record.delta.scorePct}%` : '',
    '직전대비_등급': record.delta?.fromGrade
      ? `${record.delta.fromGrade} → ${record.delta.toGrade}`
      : '',
    '직전대비_인상률%p': record.delta?.rateDelta != null ? `${record.delta.rateDelta}%p` : '',
    '성과인상률': `${Number(record.merit).toFixed(1)}%`,
    '승급인상률': `${Number(record.promotion).toFixed(1)}%`,
    확정인상률: `${Number(record.finalRate).toFixed(1)}%`,
    메모: record.memo ?? '',
  }
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

/** 백업/복원용 — 명부·분기평가·연간확정·정책을 함께 담는다 */
export function toJson({ employees, evaluations, decisions, settings }) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: 'mathsecretary-salary-eval',
      version: 4,
      employees,
      evaluations,
      decisions: decisions ?? [],
      settings: settings ?? null,
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
