import { useEffect, useMemo, useState } from 'react'
import {
  CalendarRange,
  CheckCircle2,
  CircleUser,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  RotateCcw,
  Save,
  Scale,
  SlidersHorizontal,
  TriangleAlert,
  UserPlus,
} from 'lucide-react'
import QuarterSwitcher from './components/QuarterSwitcher.jsx'
import EmployeeRoster from './components/EmployeeRoster.jsx'
import EmployeeDialog from './components/EmployeeDialog.jsx'
import CriteriaGroups from './components/CriteriaGroups.jsx'
import GradeSummary from './components/GradeSummary.jsx'
import LevelPanel from './components/LevelPanel.jsx'
import EvaluationHistory from './components/EvaluationHistory.jsx'
import CompensationPanel from './components/CompensationPanel.jsx'
import CalibrationPanel from './components/CalibrationPanel.jsx'
import PolicyDialog from './components/PolicyDialog.jsx'
import QuarterTable from './components/QuarterTable.jsx'
import AnnualTable from './components/AnnualTable.jsx'
import ExportBar from './components/ExportBar.jsx'
import { Button, Card, CardHeader, Field, inputClass } from './components/ui.jsx'
import { ROLE_MAP, ROLES, criteriaFor, groupedCriteriaFor } from './data/roles.js'
import { LEVEL_MAP, promotionIncreaseFor } from './data/levels.js'
import { bandFor } from './data/market.js'
import {
  BASE_BUDGET,
  annualRollup,
  calcSalary,
  compaRatio,
  gradeOf,
  meritRate,
  promotionSignal,
  round1,
  scoreEvaluation,
} from './lib/grading.js'
import { STANDING_NOTES, checkCompensation, hasBlocking } from './lib/compliance.js'
import { formatWon, todayISO } from './lib/format.js'
import { currentQuarter, parseQuarter, quarterKey, quarterLabel } from './lib/quarters.js'
import { STORAGE_KEYS, migrateV2, newId, usePersistentState } from './lib/storage.js'

const SAMPLE_EMPLOYEES = [
  { name: '김디자', roleId: 'designer', levelId: 'L3', currentSalary: 46_000_000 },
  { name: '이프론', roleId: 'fe', levelId: 'L2', currentSalary: 42_000_000 },
  { name: '박백엔', roleId: 'be', levelId: 'L4', currentSalary: 66_000_000 },
  { name: '최에이', roleId: 'ai', levelId: 'L1', currentSalary: 40_000_000 },
]

const MODES = [
  { id: 'quarter', label: '분기 평가', icon: ListChecks },
  { id: 'annual', label: '연간 보상 확정', icon: Scale },
]

// v2 데이터가 있으면 v3 로 옮기고 온다 (최초 1회, 렌더 전에 끝나야 한다)
const MIGRATION = migrateV2()

export default function App() {
  const [employees, setEmployees] = usePersistentState(STORAGE_KEYS.employees, [])
  const [evaluations, setEvaluations] = usePersistentState(STORAGE_KEYS.evaluations, [])
  const [decisions, setDecisions] = usePersistentState(STORAGE_KEYS.decisions, [])
  const [drafts, setDrafts] = usePersistentState(STORAGE_KEYS.drafts, {})
  const [settings, setSettings] = usePersistentState(STORAGE_KEYS.settings, {
    evaluator: '',
    webhook: '',
    budget: BASE_BUDGET,
    bandOverrides: {},
  })

  const [mode, setMode] = useState('quarter')
  const [quarter, setQuarter] = useState(currentQuarter)
  const [year, setYear] = useState(() => parseQuarter(currentQuarter()).year)
  const [selectedId, setSelectedId] = useState(null)
  const [dialog, setDialog] = useState({ open: false, employee: null })
  const [policyOpen, setPolicyOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const budget = Number(settings.budget) || BASE_BUDGET
  const bandOverrides = settings.bandOverrides ?? {}

  const showToast = (message, tone = 'success') => setToast({ message, tone })

  useEffect(() => {
    if (MIGRATION) showToast(`이전 버전 데이터를 옮겼습니다 — 직원 ${MIGRATION.employees}명, 평가 ${MIGRATION.evaluations}건. 각 직원의 레벨을 확인해 주세요.`)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 4200)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (employees.some((e) => e.id === selectedId)) return
    setSelectedId(employees.find((e) => e.active)?.id ?? employees[0]?.id ?? null)
  }, [employees, selectedId])

  const employee = employees.find((e) => e.id === selectedId) ?? null
  const role = employee ? (ROLE_MAP[employee.roleId] ?? ROLES[0]) : null
  const level = employee ? (LEVEL_MAP[employee.levelId] ?? LEVEL_MAP.L2) : LEVEL_MAP.L2

  /* ---------- 분기 평가 ---------- */

  const evaluationOf = (employeeId, q = quarter) =>
    evaluations.find((r) => r.employeeId === employeeId && r.quarter === q) ?? null

  const draftKey = employee ? `${employee.id}::${quarter}` : ''
  const savedEvaluation = employee ? evaluationOf(employee.id) : null
  const draft = drafts[draftKey] ?? null

  const working = useMemo(() => {
    if (draft) return draft
    if (savedEvaluation) return { scores: savedEvaluation.scores, memo: savedEvaluation.memo ?? '' }
    return { scores: {}, memo: '' }
  }, [draft, savedEvaluation])

  const groups = useMemo(
    () => (role ? groupedCriteriaFor(role, level) : []),
    [role, level],
  )
  const scored = useMemo(() => scoreEvaluation(groups, working.scores), [groups, working.scores])
  const grade = useMemo(() => gradeOf(scored.score), [scored.score])

  const patchWorking = (values) =>
    setDrafts((prev) => ({ ...prev, [draftKey]: { ...working, ...values } }))

  const setScore = (criterionId, value) =>
    patchWorking({ scores: { ...working.scores, [criterionId]: value } })

  const statusOf = (employeeId) => {
    const saved = evaluationOf(employeeId)
    if (saved) return { state: 'saved', score: saved.score, grade: saved.grade }
    if (drafts[`${employeeId}::${quarter}`]) return { state: 'draft' }
    return { state: 'empty' }
  }

  const saveEvaluation = () => {
    if (!employee) return showToast('먼저 직원을 선택하세요.', 'error')
    if ((grade.key === 'C' || grade.key === 'D') && !String(working.memo ?? '').trim())
      return showToast(`${grade.key}등급은 평가 근거 메모가 필요합니다.`, 'error')

    const record = {
      id: savedEvaluation?.id ?? newId('ev'),
      employeeId: employee.id,
      quarter,
      roleId: employee.roleId,
      levelId: employee.levelId,
      name: employee.name,
      currentSalary: employee.currentSalary,
      evaluator: settings.evaluator.trim(),
      scores: Object.fromEntries(
        criteriaFor(role, level).map((c) => [c.id, Number(working.scores[c.id]) || 3]),
      ),
      score: scored.score,
      byDomain: scored.byDomain,
      grade: grade.key,
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
    setDrafts((prev) => ({ ...prev, [draftKey]: { scores: {}, memo: working.memo ?? '' } }))
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

  /* ---------- 연간 보상 확정 ---------- */

  const evaluationsOfYear = (employeeId, y = year) =>
    evaluations.filter((r) => r.employeeId === employeeId && r.quarter.startsWith(`${y}-Q`))

  const decisionOf = (employeeId, y = year) =>
    decisions.find((d) => d.employeeId === employeeId && d.year === y) ?? null

  const savedDecision = employee ? decisionOf(employee.id) : null
  const annual = useMemo(
    () => (employee ? annualRollup(evaluationsOfYear(employee.id)) : annualRollup([])),
    [employee, evaluations, year],
  )

  const decisionKey = employee ? `${employee.id}::annual::${year}` : ''
  const decisionDraft = drafts[decisionKey] ?? null

  const proposedLevelId =
    decisionDraft?.toLevel ?? savedDecision?.toLevel ?? employee?.levelId ?? 'L2'
  // (decisionFromLevel / decisionBase 는 meritBand 계산 직전에 정의된다)
  const decisionMemo = decisionDraft?.memo ?? savedDecision?.memo ?? ''

  /**
   * 밴드가 둘이다.
   * - meritBand: 성과 인상의 기준. **현재** 레벨의 밴드다.
   *   승급 후 밴드로 compa 를 계산하면 "아직 하지 않은 일" 기준으로 시장 대비 낮게 잡혀
   *   merit 이 부풀고, 거기에 승급 인상까지 더해져 레벨 점프가 이중 반영된다.
   * - targetBand: 승급 후 착지점. 밴드 상·하한 점검과 게이지 표시에만 쓴다.
   */
  /**
   * 확정 기준 연봉.
   * 이미 확정한 해를 다시 열면 명부 연봉은 **인상 후** 금액이다. 그걸 기준으로 다시 계산하면
   * 같은 해에 두 번 인상되는(복리) 사고가 난다. 확정 기록이 있으면 그때의 기준 연봉을 쓴다.
   */
  const decisionBase = savedDecision ? savedDecision.baseSalary : (employee?.currentSalary ?? 0)
  const decisionFromLevel = savedDecision ? savedDecision.fromLevel : (employee?.levelId ?? 'L2')

  const meritBand = employee ? bandFor(employee.roleId, decisionFromLevel, bandOverrides) : null
  const targetBand = employee ? bandFor(employee.roleId, proposedLevelId, bandOverrides) : null
  const band = meritBand
  const compa = employee ? compaRatio(decisionBase, meritBand) : null
  const recommendedRate = employee
    ? round1(
        meritRate(annual.grade?.key ?? 'B', compa, budget) +
          promotionIncreaseFor(employee.levelId, proposedLevelId),
      )
    : 0

  const rateIsAuto =
    decisionDraft?.finalRate === undefined || decisionDraft?.finalRate === null
      ? savedDecision?.finalRate == null
      : false
  const finalRate = rateIsAuto
    ? recommendedRate
    : (decisionDraft?.finalRate ?? savedDecision?.finalRate ?? recommendedRate)

  const issues = useMemo(() => {
    if (!employee) return []
    const { newSalary } = calcSalary(decisionBase, finalRate)
    return checkCompensation({
      base: decisionBase,
      finalRate,
      newSalary,
      band: targetBand,
      gradeKey: annual.grade?.key ?? 'B',
      memo: decisionMemo,
      quarterCount: annual.count,
      levelChanged: proposedLevelId !== decisionFromLevel,
    })
  }, [employee, decisionBase, finalRate, targetBand, annual, decisionMemo, proposedLevelId, decisionFromLevel])

  const patchDecision = (values) =>
    setDrafts((prev) => ({
      ...prev,
      [decisionKey]: {
        toLevel: proposedLevelId,
        finalRate: rateIsAuto ? null : finalRate,
        memo: decisionMemo,
        ...prev[decisionKey],
        ...values,
      },
    }))

  const confirmDecision = () => {
    if (!employee) return
    if (hasBlocking(issues)) return showToast('해결해야 할 항목이 남아 있습니다.', 'error')
    if (!annual.count)
      return showToast(`${year}년에 저장된 분기 평가가 없습니다.`, 'error')

    const merit = meritRate(annual.grade.key, compa, budget)
    const promotion = promotionIncreaseFor(decisionFromLevel, proposedLevelId)
    const { newSalary } = calcSalary(decisionBase, finalRate)

    const record = {
      id: savedDecision?.id ?? newId('dec'),
      employeeId: employee.id,
      year,
      name: employee.name,
      roleId: employee.roleId,
      fromLevel: decisionFromLevel,
      toLevel: proposedLevelId,
      annualScore: annual.score,
      quarterCount: annual.count,
      grade: annual.grade.key,
      band: meritBand,
      targetBand,
      merit,
      promotion,
      finalRate,
      baseSalary: decisionBase,
      newSalary,
      evaluator: settings.evaluator.trim(),
      memo: String(decisionMemo ?? '').trim(),
      decidedAt: todayISO(),
    }

    if (
      !window.confirm(
        `${employee.name}의 ${year}년 보상을 ${savedDecision ? '다시 확정' : '확정'}합니다.\n\n` +
          `등급 ${record.grade} · 성과 ${merit}% + 승급 ${promotion}% → 확정 ${finalRate}%\n` +
          `${formatWon(decisionBase)} → ${formatWon(newSalary)}\n` +
          (promotion ? `레벨 ${record.fromLevel} → ${record.toLevel} 승급\n` : '') +
          `\n명부의 연봉과 레벨이 갱신됩니다.`,
      )
    )
      return

    setDecisions((prev) =>
      savedDecision ? prev.map((d) => (d.id === record.id ? record : d)) : [record, ...prev],
    )
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employee.id ? { ...e, currentSalary: newSalary, levelId: proposedLevelId } : e,
      ),
    )
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[decisionKey]
      return next
    })
    showToast(`${employee.name} · ${year}년 보상을 확정했습니다 (${formatWon(newSalary)}).`)
  }

  const deleteDecision = (record) => {
    if (
      !window.confirm(
        `${record.name}의 ${record.year}년 확정을 취소할까요?\n명부 연봉을 확정 전 금액(${formatWon(record.baseSalary)})으로 되돌리고 레벨도 ${record.fromLevel} 로 복구합니다.`,
      )
    )
      return
    setDecisions((prev) => prev.filter((d) => d.id !== record.id))
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === record.employeeId
          ? { ...e, currentSalary: record.baseSalary, levelId: record.fromLevel }
          : e,
      ),
    )
    showToast('확정을 취소하고 명부를 되돌렸습니다.')
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
        `${target.name}을(를) 명부에서 삭제할까요?${count ? ` 저장된 평가 ${count}건과 보상 확정 기록도 함께 삭제됩니다.` : ''}`,
      )
    )
      return
    setEmployees((prev) => prev.filter((e) => e.id !== target.id))
    setEvaluations((prev) => prev.filter((r) => r.employeeId !== target.id))
    setDecisions((prev) => prev.filter((d) => d.employeeId !== target.id))
    setDrafts((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(`${target.id}::`))),
    )
    setDialog({ open: false, employee: null })
    showToast(`${target.name}을(를) 삭제했습니다.`)
  }

  const updateSalary = (currentSalary) =>
    setEmployees((prev) => prev.map((e) => (e.id === employee.id ? { ...e, currentSalary } : e)))

  const updateLevel = (levelId) =>
    setEmployees((prev) => prev.map((e) => (e.id === employee.id ? { ...e, levelId } : e)))

  const seedSamples = () => {
    setEmployees(
      SAMPLE_EMPLOYEES.map((e) => ({ ...e, id: newId('emp'), active: true, joinedAt: '' })),
    )
    showToast('샘플 직원 4명을 등록했습니다.')
  }

  const importBackup = ({ employees: emps, evaluations: evals, decisions: decs }) => {
    const dedupe = (list) => list.filter((x, i) => list.findIndex((y) => y.id === x.id) === i)
    setEmployees((prev) => dedupe([...(emps ?? []), ...prev]))
    setEvaluations((prev) => dedupe([...(evals ?? []), ...prev]))
    setDecisions((prev) => dedupe([...(decs ?? []), ...prev]))
  }

  /* ---------- 파생 데이터 ---------- */

  const roster = employees.filter((e) => e.active || evaluationOf(e.id) || decisionOf(e.id))
  const quarterEvaluations = evaluations.filter((r) => r.quarter === quarter)
  const yearDecisions = decisions.filter((d) => d.year === year)
  const history = employee ? evaluations.filter((r) => r.employeeId === employee.id) : []
  const dirty = Boolean(draft)

  const calibrationTotals = yearDecisions.reduce(
    (acc, d) => {
      acc.base += d.baseSalary
      acc.raise += d.newSalary - d.baseSalary
      return acc
    },
    { base: 0, raise: 0 },
  )

  const signal = employee
    ? promotionSignal(
        decisions
          .filter((d) => d.employeeId === employee.id)
          .sort((a, b) => a.year - b.year)
          .map((d) => ({ grade: d.grade })),
      )
    : null

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-4">
          <span className="grid size-10 place-items-center rounded-2xl bg-slate-900 text-white">
            <Scale size={20} strokeWidth={1.75} />
          </span>
          <div className="mr-auto">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              IT 직군 평가 · 보상 산정
            </h1>
            <p className="text-xs text-slate-500">
              레벨별 기대치로 분기마다 평가하고, 등급 × 시장 대비 위치로 연 1회 보상을 확정합니다
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

          <Button icon={SlidersHorizontal} onClick={() => setPolicyOpen(true)}>
            보상 정책 · 재원 {budget}%
          </Button>
        </div>

        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 pb-3">
          <nav className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === m.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <m.icon size={14} strokeWidth={1.75} />
                {m.label}
              </button>
            ))}
          </nav>

          {mode === 'quarter' ? (
            <QuarterSwitcher
              quarter={quarter}
              onChange={(q) => {
                setQuarter(q)
                setYear(parseQuarter(q).year)
              }}
              evaluatedCount={quarterEvaluations.length}
              totalCount={roster.length}
            />
          ) : (
            <YearSwitcher
              year={year}
              onChange={(y) => {
                setYear(y)
                setQuarter(quarterKey(y, parseQuarter(quarter).q))
              }}
              decidedCount={yearDecisions.length}
              totalCount={roster.length}
            />
          )}
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
            mode === 'quarter' ? (
              /* ─────────── 분기 평가 ─────────── */
              <div className="space-y-5">
                <Card>
                  <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span
                      className={`grid size-11 place-items-center rounded-2xl text-sm font-semibold ${role.theme.soft} ${role.theme.text}`}
                    >
                      {role.short}
                    </span>
                    <div className="mr-auto">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">{employee.name}</h2>
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${role.theme.soft} ${role.theme.text}`}
                        >
                          {role.label}
                        </span>
                        <span className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${level.theme.chip}`}>
                          {level.short} {level.label}
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
                        {quarterLabel(quarter)} 평가 · 이 화면에서는 연봉을 다루지 않습니다
                      </p>
                    </div>

                    <div className="flex gap-2 no-print">
                      {dirty ? <Button onClick={discardDraft}>되돌리기</Button> : null}
                      <Button
                        variant="primary"
                        icon={savedEvaluation ? CheckCircle2 : Save}
                        onClick={saveEvaluation}
                      >
                        {savedEvaluation ? '평가 수정 저장' : '이 분기 평가 저장'}
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
                  <Card>
                    <CardHeader
                      icon={ListChecks}
                      title={`${role.label} · ${level.label} 평가 항목`}
                      description={`${groups.reduce((a, g) => a + g.criteria.length, 0)}개 항목 · 도메인별 가중치로 합산됩니다. "3점"의 기준은 레벨마다 다릅니다.`}
                      right={
                        <Button icon={RotateCcw} variant="ghost" onClick={resetScores} className="no-print">
                          초기화
                        </Button>
                      }
                    />
                    <CriteriaGroups
                      groups={groups}
                      scores={working.scores}
                      level={level}
                      accent={role.theme.accent}
                      onChange={setScore}
                    />
                    <div className="border-t border-slate-100 px-5 py-4">
                      <Field
                        label="평가 근거 메모"
                        htmlFor="memo"
                        hint="C·D 등급은 필수입니다. 관찰한 사실, 이미 전달한 피드백, 합의한 개선 목표를 남기세요."
                      >
                        <textarea
                          id="memo"
                          rows={3}
                          value={working.memo ?? ''}
                          onChange={(e) => patchWorking({ memo: e.target.value })}
                          placeholder="예) Q3 결제 리팩터링 주도, 장애 2건 원인 분석·재발 방지까지 완료. 다만 스펙 변경 공유가 늦어 FE 재작업 1회 발생."
                          className={`${inputClass} resize-y`}
                        />
                      </Field>
                    </div>
                  </Card>

                  <div className="space-y-5">
                    <GradeSummary
                      score={scored.score}
                      grade={grade}
                      byDomain={scored.byDomain}
                      level={level}
                    />
                    <LevelPanel level={level} onChange={updateLevel} />
                    <EvaluationHistory
                      quarter={quarter}
                      history={history}
                      onSelectQuarter={setQuarter}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* ─────────── 연간 보상 확정 ─────────── */
              <div className="space-y-5">
                {annual.count ? (
                  <CompensationPanel
                    year={year}
                    employee={employee}
                    baseSalary={decisionBase}
                    decided={Boolean(savedDecision)}
                    level={LEVEL_MAP[decisionFromLevel] ?? level}
                    proposedLevelId={proposedLevelId}
                    band={meritBand}
                    targetBand={targetBand}
                    annual={annual}
                    budget={budget}
                    finalRate={finalRate}
                    rateIsAuto={rateIsAuto}
                    issues={issues}
                    onSalaryChange={updateSalary}
                    onProposedLevel={(id) => patchDecision({ toLevel: id, finalRate: null })}
                    onRateChange={(v) => patchDecision({ finalRate: Number.isFinite(v) ? v : 0 })}
                    onApplyRecommended={() => patchDecision({ finalRate: null })}
                    onApply={confirmDecision}
                    onCancelDecision={savedDecision ? () => deleteDecision(savedDecision) : null}
                  />
                ) : (
                  <Card className="px-5 py-14 text-center">
                    <CalendarRange size={26} strokeWidth={1.5} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {year}년에 저장된 분기 평가가 없습니다
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      보상은 그 해의 분기 평가 기록으로만 산정합니다. 먼저 [분기 평가]에서
                      기록을 남겨 주세요.
                    </p>
                    <Button onClick={() => setMode('quarter')} className="mx-auto mt-4">
                      분기 평가로 이동
                    </Button>
                  </Card>
                )}

                {annual.count ? (
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
                    <Card>
                      <CardHeader
                        title="연간 산정 근거"
                        description={`${year}년 분기 평가 ${annual.count}건의 평균으로 연간 등급을 냅니다. 미평가 분기는 채워 넣지 않습니다.`}
                      />
                      <ul className="divide-y divide-slate-100">
                        {annual.quarters.map((q) => (
                          <li key={q.quarter} className="flex items-center gap-3 px-5 py-3">
                            <span className="w-24 text-xs font-medium text-slate-600">
                              {quarterLabel(q.quarter)}
                            </span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-slate-700"
                                style={{ width: `${((q.score - 1) / 4) * 100}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-700">
                              {Number(q.score).toFixed(2)}
                            </span>
                            <span className="w-5 text-right text-xs font-bold text-slate-500">
                              {q.grade}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-slate-100 px-5 py-4">
                        <Field
                          label="확정 사유 메모"
                          htmlFor="decision-memo"
                          hint="추천값과 다르게 확정했거나 C·D 등급이면 필수입니다."
                        >
                          <textarea
                            id="decision-memo"
                            rows={2}
                            value={decisionMemo}
                            onChange={(e) => patchDecision({ memo: e.target.value })}
                            placeholder="예) 밴드 하단이라 추천보다 1%p 상향. 다음 사이클에 L4 승급 심사 예정."
                            className={`${inputClass} resize-y`}
                          />
                        </Field>
                        {signal ? (
                          <p className="mt-3 rounded-xl bg-indigo-50 px-3.5 py-3 text-xs text-indigo-800 ring-1 ring-indigo-200">
                            {signal}
                          </p>
                        ) : null}
                      </div>
                    </Card>
                    <div className="space-y-5">
                      <LevelPanel level={LEVEL_MAP[proposedLevelId] ?? level} readOnly />
                      <EvaluationHistory
                        quarter={quarter}
                        history={history}
                        onSelectQuarter={(q) => {
                          setQuarter(q)
                          setMode('quarter')
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                <CalibrationPanel
                  records={yearDecisions}
                  budget={budget}
                  totalBase={calibrationTotals.base}
                  totalRaise={calibrationTotals.raise}
                  scopeLabel={`${year}년 확정 기준`}
                />
              </div>
            )
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
          {mode === 'quarter' ? (
            <QuarterTable
              quarter={quarter}
              employees={roster}
              evaluationOf={(id) => evaluationOf(id)}
              onSelect={setSelectedId}
              onDeleteEvaluation={deleteEvaluation}
              actions={
                <ExportBar
                  quarter={quarter}
                  quarterEvaluations={quarterEvaluations}
                  allEvaluations={evaluations}
                  employees={employees}
                  decisions={decisions}
                  settings={settings}
                  webhook={settings.webhook}
                  onWebhookChange={(webhook) => setSettings((prev) => ({ ...prev, webhook }))}
                  onImport={importBackup}
                  onToast={showToast}
                />
              }
            />
          ) : (
            <AnnualTable
              year={year}
              employees={roster}
              evaluationsOfYear={(id) => evaluationsOfYear(id)}
              decisionOf={(id) => decisionOf(id)}
              bandOverrides={bandOverrides}
              onSelect={setSelectedId}
              onDeleteDecision={deleteDecision}
              actions={
                <ExportBar
                  quarter={`${year}년`}
                  quarterEvaluations={yearDecisions}
                  allEvaluations={decisions}
                  employees={employees}
                  decisions={decisions}
                  settings={settings}
                  webhook={settings.webhook}
                  onWebhookChange={(webhook) => setSettings((prev) => ({ ...prev, webhook }))}
                  onImport={importBackup}
                  onToast={showToast}
                />
              }
            />
          )}
        </div>

        <ul className="space-y-1 py-6 text-center text-[11px] text-slate-400">
          {STANDING_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </main>

      <EmployeeDialog
        open={dialog.open}
        employee={dialog.employee}
        onClose={() => setDialog({ open: false, employee: null })}
        onSubmit={submitEmployee}
        onDelete={deleteEmployee}
      />

      <PolicyDialog
        open={policyOpen}
        settings={settings}
        onClose={() => setPolicyOpen(false)}
        onSave={(next) => {
          setSettings((prev) => ({ ...prev, ...next }))
          setPolicyOpen(false)
          showToast('보상 정책을 저장했습니다.')
        }}
      />

      {toast ? (
        <div className="no-print fixed bottom-5 left-1/2 z-50 -translate-x-1/2 px-4">
          <div
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {toast.tone === 'error' ? (
              <TriangleAlert size={16} strokeWidth={2} className="shrink-0" />
            ) : (
              <CheckCircle2 size={16} strokeWidth={2} className="shrink-0" />
            )}
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** 연도 이동 — 보상 확정은 연 1회이므로 분기 대신 연도로 다닌다 */
function YearSwitcher({ year, onChange, decidedCount, totalCount }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 px-1 py-1">
      <button
        type="button"
        onClick={() => onChange(year - 1)}
        aria-label="이전 연도"
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <div className="px-2 text-center">
        <div className="text-sm font-semibold tabular-nums text-slate-900">{year}년 보상</div>
        <div className="text-[10px] text-slate-400">
          확정 {decidedCount}/{totalCount}명
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(year + 1)}
        aria-label="다음 연도"
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
