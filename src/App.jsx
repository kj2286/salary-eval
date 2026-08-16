import { useEffect, useMemo, useState } from 'react'
import {
  Calculator,
  CheckCircle2,
  CircleUser,
  ListChecks,
  RotateCcw,
  Save,
  TriangleAlert,
  UserPlus,
} from 'lucide-react'
import QuarterSwitcher from './components/QuarterSwitcher.jsx'
import EmployeeRoster from './components/EmployeeRoster.jsx'
import EmployeeDialog from './components/EmployeeDialog.jsx'
import ScoreSlider from './components/ScoreSlider.jsx'
import GradeSummary from './components/GradeSummary.jsx'
import EvaluationHistory from './components/EvaluationHistory.jsx'
import SalaryPanel from './components/SalaryPanel.jsx'
import QuarterTable from './components/QuarterTable.jsx'
import ExportBar from './components/ExportBar.jsx'
import { Button, Card, CardHeader, Field, inputClass } from './components/ui.jsx'
import { ROLE_MAP, ROLES } from './data/roles.js'
import { averageOf, calcSalary, defaultRateFor, gradeOf, round2 } from './lib/grading.js'
import { formatWon, todayISO } from './lib/format.js'
import { currentQuarter, quarterLabel } from './lib/quarters.js'
import { STORAGE_KEYS, newId, usePersistentState } from './lib/storage.js'

const SAMPLE_EMPLOYEES = [
  { name: '김디자', roleId: 'designer', currentSalary: 42_000_000 },
  { name: '이프론', roleId: 'fe', currentSalary: 50_000_000 },
  { name: '박백엔', roleId: 'be', currentSalary: 58_000_000 },
  { name: '최에이', roleId: 'ai', currentSalary: 62_000_000 },
]

export default function App() {
  const [employees, setEmployees] = usePersistentState(STORAGE_KEYS.employees, [])
  const [evaluations, setEvaluations] = usePersistentState(STORAGE_KEYS.evaluations, [])
  const [drafts, setDrafts] = usePersistentState(STORAGE_KEYS.drafts, {})
  const [settings, setSettings] = usePersistentState(STORAGE_KEYS.settings, {
    evaluator: '',
    webhook: '',
  })

  const [quarter, setQuarter] = useState(currentQuarter)
  const [selectedId, setSelectedId] = useState(null)
  const [dialog, setDialog] = useState({ open: false, employee: null })
  const [toast, setToast] = useState(null)

  const showToast = (message, tone = 'success') => setToast({ message, tone })

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  // 선택된 직원이 사라졌거나 아직 없으면 첫 재직자로 되돌린다
  useEffect(() => {
    if (employees.some((e) => e.id === selectedId)) return
    setSelectedId(employees.find((e) => e.active)?.id ?? employees[0]?.id ?? null)
  }, [employees, selectedId])

  const employee = employees.find((e) => e.id === selectedId) ?? null
  const role = employee ? (ROLE_MAP[employee.roleId] ?? ROLES[0]) : null

  const evaluationOf = (employeeId, q = quarter) =>
    evaluations.find((r) => r.employeeId === employeeId && r.quarter === q) ?? null

  const draftKey = employee ? `${employee.id}::${quarter}` : ''
  const savedEvaluation = employee ? evaluationOf(employee.id) : null
  const draft = drafts[draftKey] ?? null

  // 편집 중 값 > 저장된 평가 > 기본값(전 항목 3점, 인상률 자동)
  const working = useMemo(() => {
    if (draft) return draft
    if (savedEvaluation) {
      return {
        scores: savedEvaluation.scores,
        finalRate: savedEvaluation.finalRate,
        memo: savedEvaluation.memo ?? '',
      }
    }
    return { scores: {}, finalRate: null, memo: '' }
  }, [draft, savedEvaluation])

  const average = useMemo(
    () => (role ? averageOf(role.criteria, working.scores) : 0),
    [role, working.scores],
  )
  const grade = useMemo(() => gradeOf(average), [average])
  const rateIsAuto = working.finalRate === null || working.finalRate === undefined
  const finalRate = rateIsAuto ? defaultRateFor(grade) : working.finalRate

  const patchWorking = (values) =>
    setDrafts((prev) => ({ ...prev, [draftKey]: { ...working, ...values } }))

  const setScore = (criterionId, value) =>
    patchWorking({ scores: { ...working.scores, [criterionId]: value } })

  const statusOf = (employeeId) => {
    const saved = evaluationOf(employeeId)
    if (saved) return { state: 'saved', average: saved.average }
    if (drafts[`${employeeId}::${quarter}`]) return { state: 'draft' }
    return { state: 'empty' }
  }

  /* ---------- 평가 저장 ---------- */

  const saveEvaluation = () => {
    if (!employee) return showToast('먼저 직원을 선택하세요.', 'error')

    const record = {
      id: savedEvaluation?.id ?? newId('ev'),
      employeeId: employee.id,
      quarter,
      roleId: employee.roleId,
      name: employee.name,
      currentSalary: employee.currentSalary,
      evaluator: settings.evaluator.trim(),
      scores: Object.fromEntries(
        role.criteria.map((c) => [c.id, Number(working.scores[c.id]) || 3]),
      ),
      average: round2(average),
      grade: grade.key,
      finalRate,
      memo: (working.memo ?? '').trim(),
      evaluatedAt: savedEvaluation?.evaluatedAt ?? todayISO(),
      updatedAt: todayISO(),
    }

    setEvaluations((prev) =>
      savedEvaluation ? prev.map((r) => (r.id === record.id ? record : r)) : [record, ...prev],
    )
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[draftKey]
      return next
    })
    showToast(
      `${employee.name} · ${quarterLabel(quarter)} 평가를 ${savedEvaluation ? '수정' : '저장'}했습니다.`,
    )
  }

  const resetScores = () => {
    setDrafts((prev) => ({ ...prev, [draftKey]: { scores: {}, finalRate: null, memo: '' } }))
    showToast('점수를 초기화했습니다(전 항목 3점).')
  }

  const discardDraft = () => {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[draftKey]
      return next
    })
    showToast('편집 중이던 내용을 되돌렸습니다.')
  }

  const deleteEvaluation = (record) => {
    if (!window.confirm(`${record.name}의 ${quarterLabel(record.quarter)} 평가를 삭제할까요?`)) return
    setEvaluations((prev) => prev.filter((r) => r.id !== record.id))
    showToast('평가를 삭제했습니다.')
  }

  /* ---------- 직원 명부 ---------- */

  const submitEmployee = (form) => {
    if (form.id) {
      setEmployees((prev) => prev.map((e) => (e.id === form.id ? { ...e, ...form } : e)))
      showToast(`${form.name} 정보를 수정했습니다.`)
    } else {
      const created = { ...form, id: newId('emp') }
      setEmployees((prev) => [...prev, created])
      setSelectedId(created.id)
      showToast(`${created.name}을(를) 명부에 등록했습니다.`)
    }
    setDialog({ open: false, employee: null })
  }

  const deleteEmployee = (target) => {
    const count = evaluations.filter((r) => r.employeeId === target.id).length
    if (
      !window.confirm(
        `${target.name}을(를) 명부에서 삭제할까요?${count ? ` 저장된 평가 ${count}건도 함께 삭제됩니다.` : ''}`,
      )
    )
      return
    setEmployees((prev) => prev.filter((e) => e.id !== target.id))
    setEvaluations((prev) => prev.filter((r) => r.employeeId !== target.id))
    setDrafts((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(`${target.id}::`))),
    )
    setDialog({ open: false, employee: null })
    showToast(`${target.name}을(를) 삭제했습니다.`)
  }

  const updateSalary = (currentSalary) =>
    setEmployees((prev) => prev.map((e) => (e.id === employee.id ? { ...e, currentSalary } : e)))

  const applySalaryToRoster = () => {
    const { newSalary } = calcSalary(employee.currentSalary, finalRate)
    if (
      !window.confirm(
        `${employee.name}의 명부 연봉을 ${formatWon(newSalary)}(으)로 갱신할까요?\n다음 분기부터 이 금액이 "현재 연봉"이 됩니다.`,
      )
    )
      return
    updateSalary(newSalary)
    showToast(`명부 연봉을 ${formatWon(newSalary)}으로 갱신했습니다.`)
  }

  const seedSamples = () => {
    setEmployees(SAMPLE_EMPLOYEES.map((e) => ({ ...e, id: newId('emp'), active: true, joinedAt: '' })))
    showToast('샘플 직원 4명을 등록했습니다.')
  }

  const importBackup = ({ employees: emps, evaluations: evals }) => {
    setEmployees((prev) => {
      const merged = [...emps, ...prev]
      return merged.filter((e, i) => merged.findIndex((x) => x.id === e.id) === i)
    })
    setEvaluations((prev) => {
      const merged = [...evals, ...prev]
      return merged.filter((r, i) => merged.findIndex((x) => x.id === r.id) === i)
    })
  }

  /* ---------- 파생 데이터 ---------- */

  const rosterForQuarter = employees.filter((e) => e.active || evaluationOf(e.id))
  const quarterEvaluations = evaluations.filter((r) => r.quarter === quarter)
  const history = employee ? evaluations.filter((r) => r.employeeId === employee.id) : []
  const dirty = Boolean(draft)

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-4">
          <span className="grid size-10 place-items-center rounded-2xl bg-slate-900 text-white">
            <Calculator size={20} strokeWidth={1.75} />
          </span>
          <div className="mr-auto">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              IT 직군 분기 평가 · 연봉 산정
            </h1>
            <p className="text-xs text-slate-500">
              수학비서 · 등록된 직원을 분기마다 평가하고 인상률을 확정합니다
            </p>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <CircleUser size={15} strokeWidth={1.75} className="text-slate-400" />
            <span className="sr-only">평가자</span>
            <input
              value={settings.evaluator}
              onChange={(e) => setSettings((prev) => ({ ...prev, evaluator: e.target.value }))}
              placeholder="평가자 이름"
              className="w-28 text-sm outline-none placeholder:text-slate-300"
            />
          </label>

          <QuarterSwitcher
            quarter={quarter}
            onChange={setQuarter}
            evaluatedCount={quarterEvaluations.length}
            totalCount={rosterForQuarter.length}
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-5">
            <EmployeeRoster
              employees={employees}
              selectedId={selectedId}
              statusOf={statusOf}
              onSelect={setSelectedId}
              onAdd={() => setDialog({ open: true, employee: null })}
              onEdit={(target) => setDialog({ open: true, employee: target })}
            />
            {!employees.length ? (
              <Button onClick={seedSamples} className="w-full">
                샘플 직원 4명 넣어보기
              </Button>
            ) : null}
          </div>

          {employee ? (
            <div className="space-y-5">
              {/* 선택된 직원 + 분기 컨텍스트 */}
              <Card>
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span
                    className={`grid size-11 place-items-center rounded-2xl text-sm font-semibold ${role.theme.soft} ${role.theme.text}`}
                  >
                    {role.short}
                  </span>
                  <div className="mr-auto">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">{employee.name}</h2>
                      <span className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${role.theme.soft} ${role.theme.text}`}>
                        {role.label}
                      </span>
                      {savedEvaluation ? (
                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          저장됨 · {savedEvaluation.updatedAt}
                        </span>
                      ) : null}
                      {dirty ? (
                        <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          저장 안 됨
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {quarterLabel(quarter)} 평가 · 현재 연봉 {formatWon(employee.currentSalary)}
                    </p>
                  </div>

                  <div className="flex gap-2 no-print">
                    {dirty ? <Button onClick={discardDraft}>되돌리기</Button> : null}
                    <Button variant="primary" icon={savedEvaluation ? CheckCircle2 : Save} onClick={saveEvaluation}>
                      {savedEvaluation ? '평가 수정 저장' : '이 분기 평가 저장'}
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <Card>
                  <CardHeader
                    icon={ListChecks}
                    title={`${role.label} 평가 항목`}
                    description="1점 미흡 ~ 5점 탁월. 조절 즉시 평균·등급·인상률이 갱신됩니다."
                    right={
                      <Button icon={RotateCcw} variant="ghost" onClick={resetScores} className="no-print">
                        초기화
                      </Button>
                    }
                  />
                  <div className="divide-y divide-slate-100">
                    {role.criteria.map((criterion, index) => (
                      <ScoreSlider
                        key={criterion.id}
                        criterion={criterion}
                        index={index}
                        value={working.scores[criterion.id] ?? 3}
                        accent={role.theme.accent}
                        onChange={(v) => setScore(criterion.id, v)}
                      />
                    ))}
                  </div>
                  <div className="border-t border-slate-100 px-5 py-4">
                    <Field label="평가 메모 (선택)" htmlFor="memo">
                      <textarea
                        id="memo"
                        rows={2}
                        value={working.memo ?? ''}
                        onChange={(e) => patchWorking({ memo: e.target.value })}
                        placeholder="근거·특이사항·다음 분기 기대치"
                        className={`${inputClass} resize-y`}
                      />
                    </Field>
                  </div>
                </Card>

                <div className="space-y-5">
                  <GradeSummary average={average} grade={grade} role={role} />
                  <EvaluationHistory
                    quarter={quarter}
                    history={history}
                    onSelectQuarter={setQuarter}
                  />
                </div>
              </div>

              <SalaryPanel
                currentSalary={employee.currentSalary}
                finalRate={finalRate}
                grade={grade}
                rateIsAuto={rateIsAuto}
                employeeName={employee.name}
                onSalaryChange={updateSalary}
                onRateChange={(v) => patchWorking({ finalRate: Number.isFinite(v) ? v : 0 })}
                onApplyRecommended={() => patchWorking({ finalRate: null })}
                onApplyToRoster={applySalaryToRoster}
              />
            </div>
          ) : (
            <Card className="grid place-items-center px-5 py-20 text-center">
              <div>
                <UserPlus size={28} strokeWidth={1.5} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">등록된 직원이 없습니다</p>
                <p className="mt-1 text-xs text-slate-500">
                  왼쪽 “직원 추가”로 명부를 만들면 분기마다 같은 직원을 평가할 수 있습니다.
                </p>
                <Button
                  variant="primary"
                  icon={UserPlus}
                  onClick={() => setDialog({ open: true, employee: null })}
                  className="mx-auto mt-4"
                >
                  직원 추가
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="mt-5">
          <QuarterTable
            quarter={quarter}
            employees={rosterForQuarter}
            evaluationOf={(id) => evaluationOf(id)}
            onSelect={setSelectedId}
            onDeleteEvaluation={deleteEvaluation}
            actions={
              <ExportBar
                quarter={quarter}
                quarterEvaluations={quarterEvaluations}
                allEvaluations={evaluations}
                employees={employees}
                webhook={settings.webhook}
                onWebhookChange={(webhook) => setSettings((prev) => ({ ...prev, webhook }))}
                onImport={importBackup}
                onToast={showToast}
              />
            }
          />
        </div>

        <p className="py-6 text-center text-[11px] text-slate-400">
          명부·평가 데이터는 이 브라우저(localStorage)에만 저장됩니다. 서버 전송은 Google Sheets
          웹훅을 설정한 경우에만 일어납니다.
        </p>
      </main>

      <EmployeeDialog
        open={dialog.open}
        employee={dialog.employee}
        onClose={() => setDialog({ open: false, employee: null })}
        onSubmit={submitEmployee}
        onDelete={deleteEmployee}
      />

      {toast ? (
        <div className="no-print fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
          <div
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {toast.tone === 'error' ? (
              <TriangleAlert size={16} strokeWidth={2} />
            ) : (
              <CheckCircle2 size={16} strokeWidth={2} />
            )}
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  )
}
