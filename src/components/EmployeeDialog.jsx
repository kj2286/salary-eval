import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { Button, Field, inputClass } from './ui.jsx'
import { ROLES } from '../data/roles.js'
import { formatKoreanWon, formatNumber, parseNumber } from '../lib/format.js'

const EMPTY = { name: '', roleId: ROLES[0].id, currentSalary: 40_000_000, joinedAt: '', active: true }

/** 직원 등록/수정 모달 — 직무와 현재 연봉은 여기서 한 번만 정하고 평가 화면에서는 고른다 */
export default function EmployeeDialog({ open, employee, onClose, onSubmit, onDelete }) {
  const [form, setForm] = useState(EMPTY)
  const editing = Boolean(employee?.id)

  useEffect(() => {
    if (open) setForm(employee ? { ...EMPTY, ...employee } : EMPTY)
  }, [open, employee])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const patch = (values) => setForm((prev) => ({ ...prev, ...values }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit({ ...form, name: form.name.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <button type="button" aria-label="닫기" className="absolute inset-0" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? '직원 정보 수정' : '직원 등록'}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {editing ? '직원 정보 수정' : '직원 등록'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          <Field label="이름" htmlFor="dlg-name">
            <input
              id="dlg-name"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="김수학"
              autoFocus
              className={inputClass}
            />
          </Field>

          <Field label="직무" hint="선택한 직무의 6개 평가 항목이 평가 화면에 표시됩니다.">
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const active = form.roleId === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => patch({ roleId: role.id })}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'border-transparent bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-medium">{role.label}</span>
                    <span className={`block text-[11px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                      {role.short}
                    </span>
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="현재 연봉 (원)"
              htmlFor="dlg-salary"
              hint={formatKoreanWon(form.currentSalary)}
            >
              <input
                id="dlg-salary"
                inputMode="numeric"
                value={form.currentSalary ? formatNumber(form.currentSalary) : ''}
                onChange={(e) => patch({ currentSalary: parseNumber(e.target.value) })}
                className={`${inputClass} text-right font-semibold tabular-nums`}
              />
            </Field>
            <Field label="입사일 (선택)" htmlFor="dlg-joined">
              <input
                id="dlg-joined"
                type="date"
                value={form.joinedAt ?? ''}
                onChange={(e) => patch({ joinedAt: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => patch({ active: e.target.checked })}
              className="size-4 rounded border-slate-300"
            />
            재직 중 (해제하면 분기 현황 집계에서 빠집니다)
          </label>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
          {editing ? (
            <Button variant="danger" icon={Trash2} onClick={() => onDelete(employee)}>
              삭제
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={onClose}>취소</Button>
            <Button type="submit" variant="primary" disabled={!form.name.trim()}>
              {editing ? '저장' : '등록'}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  )
}
