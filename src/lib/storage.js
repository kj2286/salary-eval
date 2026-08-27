import { useEffect, useState } from 'react'
import { gradeOf } from './grading.js'

/** localStorage 백업 useState — 브라우저를 닫아도 명부·평가가 남는다 */
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* 용량 초과·사생활 보호 모드 등 — 저장 실패는 무시 */
    }
  }, [key, value])

  return [value, setValue]
}

export const STORAGE_KEYS = {
  employees: 'salary-eval:employees:v3',
  evaluations: 'salary-eval:evaluations:v3', // 분기 평가 (보상 정보 없음)
  decisions: 'salary-eval:decisions:v3', // 연간 보상 확정 (직원×연도 1건)
  drafts: 'salary-eval:drafts:v3',
  settings: 'salary-eval:settings:v3',
}

const V2_KEYS = {
  employees: 'salary-eval:employees:v2',
  evaluations: 'salary-eval:evaluations:v2',
  settings: 'salary-eval:settings:v2',
}

export const newId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/**
 * v2 → v3 마이그레이션.
 *
 * v2 는 항목 id 자체가 달랐고(직무별 6항목), 인상률이 분기 레코드에 붙어 있었다.
 * 항목이 사라졌으므로 개별 점수는 복원하지 않고 평균만 살려 `legacy` 로 표시한다.
 * 옛 점수를 새 문항에 억지로 매핑하면 근거 없는 숫자가 그대로 보상에 흘러든다.
 */
export function migrateV2() {
  try {
    if (localStorage.getItem(STORAGE_KEYS.employees)) return null // 이미 v3
    const rawEmp = localStorage.getItem(V2_KEYS.employees)
    if (!rawEmp) return null

    const employees = (JSON.parse(rawEmp) ?? []).map((e) => ({
      ...e,
      levelId: e.levelId ?? 'L2', // v2 에는 레벨 개념이 없었다 → 주니어로 두고 사용자가 조정
    }))

    const evaluations = (JSON.parse(localStorage.getItem(V2_KEYS.evaluations) ?? '[]') ?? []).map(
      (r) => ({
        id: r.id,
        employeeId: r.employeeId,
        quarter: r.quarter,
        roleId: r.roleId,
        levelId: 'L2',
        name: r.name,
        currentSalary: r.currentSalary,
        evaluator: r.evaluator ?? '',
        scores: {},
        score: Number(r.average) || 0,
        byDomain: {},
        grade: gradeOf(Number(r.average) || 0).key,
        memo: r.memo ?? '',
        legacy: true, // v2 에서 넘어온 기록 — 항목별 점수 없음
        legacyRate: r.finalRate ?? null,
        evaluatedAt: r.evaluatedAt,
        updatedAt: r.updatedAt,
      }),
    )

    const oldSettings = JSON.parse(localStorage.getItem(V2_KEYS.settings) ?? '{}') ?? {}

    localStorage.setItem(STORAGE_KEYS.employees, JSON.stringify(employees))
    localStorage.setItem(STORAGE_KEYS.evaluations, JSON.stringify(evaluations))
    localStorage.setItem(STORAGE_KEYS.decisions, JSON.stringify([]))
    localStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({ evaluator: oldSettings.evaluator ?? '', webhook: oldSettings.webhook ?? '' }),
    )

    return { employees: employees.length, evaluations: evaluations.length }
  } catch {
    return null
  }
}
