import { useEffect, useState } from 'react'

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
  employees: 'salary-eval:employees:v2',
  evaluations: 'salary-eval:evaluations:v2',
  drafts: 'salary-eval:drafts:v2', // 저장 전 편집 중인 평가 (직원×분기)
  settings: 'salary-eval:settings:v2', // 평가자 이름, 시트 웹훅 등
}

export const newId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
