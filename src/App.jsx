import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUser,
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
import DecisionPanel from './components/DecisionPanel.jsx'
import CalibrationPanel from './components/CalibrationPanel.jsx'
import PolicyDialog from './components/PolicyDialog.jsx'
import QuarterTable from './components/QuarterTable.jsx'
import AnnualTable from './components/AnnualTable.jsx'
import ExportBar from './components/ExportBar.jsx'
import DeltaBadge from './components/DeltaBadge.jsx'
import { Button, Card, CardHeader, Field, inputClass } from './components/ui.jsx'
import { ROLE_MAP, ROLES, criteriaFor, groupedCriteriaFor } from './data/roles.js'
import { LEVEL_MAP, promotionIncreaseFor } from './data/levels.js'
import {
  BASE_BUDGET,
  DEFAULT_DISTRIBUTION,
  DEFAULT_GUARDS,
  GRADE_MAP,
  absoluteGradeOf,
  annualRollup,
  assignRelativeGrades,
  averageRate,
  borderlinePairs,
  deltaOf,
  promotionSignal,
  rateBandFor,
  round1,
  scoreEvaluation,
} from './lib/grading.js'
import { STANDING_NOTES, checkDecision, hasBlocking } from './lib/compliance.js'
import { todayISO } from './lib/format.js'
import { currentQuarter, parseQuarter, quarterKey, quarterLabel, shiftQuarter } from './lib/quarters.js'
import { STORAGE_KEYS, migrateV2, newId, usePersistentState } from './lib/storage.js'

const SAMPLE_EMPLOYEES = [
  { name: '김디자', roleId: 'designer', levelId: 'L3' },
  { name: '이프론', roleId: 'fe', levelId: 'L2' },
  { name: '박백엔', roleId: 'be', levelId: 'L4' },
  { name: '최에이', roleId: 'ai', levelId: 'L1' },
]

const MODES = [
  { id: 'quarter', label: '분기 평가', icon: ListChecks },
  { id: 'annual', label: '연간 등급 확정', icon: Award },
]

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
    distribution: DEFAULT_DISTRIBUTION,
    guards: DEFAULT_GUARDS,
    relative: true,
    relativeScope: 'all',
  })

  const [mode, setMode] = useState('quarter')
  const [quarter, setQuarter] = useState(currentQuarter)
  const [year, setYear] = useState(() => parseQuarter(currentQuarter()).year)
  const [selectedId, setSelectedId] = useState(null)
  const [dialog, setDialog] = useState({ open: false, employee: null })
  const [policyOpen, setPolicyOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const budget = Number(settings.budget) || BASE_BUDGET
  const distribution = settings.distribution ?? DEFAULT_DISTRIBUTION
  const guards = settings.guards ?? DEFAULT_GUARDS
  const relative = settings.relative !== false
  const relativeScope = settings.relativeScope ?? 'all'

  const showToast = (message, tone = 'success') => setToast({ message, tone })

  useEffect(() => {
    if (MIGRATION)
      showToast(
        MIGRATION.from === 'v3'
          ? `이전 버전에서 데이터를 옮겼습니다 — 직원 ${MIGRATION.employees}명, 평가 ${MIGRATION.evaluations}건. 연봉 금액은 더 이상 저장하지 않습니다.`
          : `이전 버전 데이터를 옮겼습니다 — 직원 ${MIGRATION.employees}명, 평가 ${MIGRATION.evaluations}건. 각 직원의 레벨을 확인해 주세요.`,
      )
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 4600)
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

  const groups = useMemo(() => (role ? groupedCriteriaFor(role, level) : []), [role, level])
  const scored = useMemo(() => scoreEvaluation(groups, working.scores), [groups, working.scores])

  /**
   * 상대평가 집단(cohort) 만들기.
   * 비교 대상은 정책에 따라 전체 / 같은 직무 / 같은 레벨.
   * 선택된 직원이 아직 저장 전이면 작업 중 점수를 넣어 잠정 등급을 계산한다.
   */
  const cohortKeyOf = (emp) =>
    relativeScope === 'role' ? emp.roleId : relativeScope === 'level' ? emp.levelId : 'all'

  const buildCohort = (entries, target) => {
    if (!relative) return null
    const key = target ? cohortKeyOf(target) : 'all'
    const scoped = entries.filter((e) => e.cohort === key)
    return assignRelativeGrades(scoped, { distribution, guards })
  }

  // 분기 잠정 등급 — 저장된 평가 + 현재 편집 중인 점수
  const quarterCohort = useMemo(() => {
    const entries = employees
      .map((emp) => {
        const saved = evaluationOf(emp.id)
        const isCurrent = employee && emp.id === employee.id
        const score = isCurrent ? scored.score : saved ? Number(saved.score) : null
        if (score == null) return null
        return { id: emp.id, score, cohort: cohortKeyOf(emp) }
      })
      .filter(Boolean)
    return { entries, result: buildCohort(entries, employee) }
  }, [employees, evaluations, employee, scored.score, relative, relativeScope, distribution, guards])

  const quarterGradeOf = (employeeId) => {
    if (!relative) {
      const rec =
        employee && employeeId === employee.id ? { score: scored.score } : evaluationOf(employeeId)
      return rec ? absoluteGradeOf(Number(rec.score)).key : null
    }
    return quarterCohort.result?.byId[employeeId] ?? null
  }

  const grade = GRADE_MAP[quarterGradeOf(employee?.id) ?? 'B'] ?? GRADE_MAP.B
  const myRank = quarterCohort.result?.rankById[employee?.id] ?? null
  const cohortSize = quarterCohort.entries.filter(
    (e) => !employee || e.cohort === cohortKeyOf(employee),
  ).length

  /** 직전 분기 대비 */
  const quarterDeltaOf = (employeeId) => {
    const cur = employeeId === employee?.id ? { score: scored.score } : evaluationOf(employeeId)
    if (!cur) return null
    const prevQ = shiftQuarter(quarter, -1)
    const prev = evaluationOf(employeeId, prevQ)
    if (!prev) return null
    return {
      ...deltaOf(
        { score: cur.score, grade: quarterGradeOf(employeeId) },
        { score: prev.score, grade: prev.grade },
      ),
      label: quarterLabel(prevQ),
    }
  }

  const patchWorking = (values) =>
    setDrafts((prev) => ({ ...prev, [draftKey]: { ...working, ...values } }))

  const setScore = (criterionId, value) =>
    patchWorking({ scores: { ...working.scores, [criterionId]: value } })

  /**
   * 명부 배지는 지금 보고 있는 화면 기준이어야 한다.
   * 연간 모드에서 분기 등급을 띄우면 표의 등급과 어긋나 보인다.
   */
  const statusOf = (employeeId) => {
    if (mode === 'annual') {
      const decided = decisionOf(employeeId)
      if (decided) return { state: 'saved', score: decided.annualScore, grade: decided.grade }
      const roll = annualRollup(evaluationsOfYear(employeeId))
      if (roll.count)
        return { state: 'draft', score: roll.score, grade: annualGradeOf(employeeId), label: '미확정' }
      return { state: 'empty' }
    }
    const saved = evaluationOf(employeeId)
    if (saved) return { state: 'saved', score: saved.score, grade: quarterGradeOf(employeeId) }
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
      evaluator: settings.evaluator.trim(),
      scores: Object.fromEntries(
        criteriaFor(role, level).map((c) => [c.id, Number(working.scores[c.id]) || 3]),
      ),
      score: scored.score,
      byDomain: scored.byDomain,
      grade: grade.key, // 저장 시점의 잠정 등급 (집단이 바뀌면 화면에서 재계산된다)
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

  /* ---------- 연간 등급 확정 ---------- */

  const evaluationsOfYear = (employeeId, y = year) =>
    evaluations.filter((r) => r.employeeId === employeeId && r.quarter.startsWith(`${y}-Q`))

  const decisionOf = (employeeId, y = year) =>
    decisions.find((d) => d.employeeId === employeeId && d.year === y) ?? null

  const savedDecision = employee ? decisionOf(employee.id) : null
  const annual = useMemo(
    () => (employee ? annualRollup(evaluationsOfYear(employee.id)) : annualRollup([])),
    [employee, evaluations, year],
  )

  /** 연간 상대평가 집단 — 그 해 평가 기록이 있는 전원 */
  const annualCohort = useMemo(() => {
    const entries = employees
      .map((emp) => {
        const roll = annualRollup(evaluationsOfYear(emp.id))
        if (!roll.count) return null
        return { id: emp.id, score: roll.score, cohort: cohortKeyOf(emp) }
      })
      .filter(Boolean)
    const byCohort = {}
    for (const key of new Set(entries.map((e) => e.cohort))) {
      byCohort[key] = assignRelativeGrades(
        entries.filter((e) => e.cohort === key),
        { distribution, guards },
      )
    }
    return { entries, byCohort }
  }, [employees, evaluations, year, relative, relativeScope, distribution, guards])

  const annualResultFor = (employeeId) => {
    const emp = employees.find((e) => e.id === employeeId)
    if (!emp) return null
    return annualCohort.byCohort[cohortKeyOf(emp)] ?? null
  }

  const annualGradeOf = (employeeId) => {
    const decided = decisionOf(employeeId)
    if (decided) return decided.grade
    if (!relative) {
      const roll = annualRollup(evaluationsOfYear(employeeId))
      return roll.count ? absoluteGradeOf(roll.score).key : null
    }
    return annualResultFor(employeeId)?.byId[employeeId] ?? null
  }

  const annualRankOf = (employeeId) => annualResultFor(employeeId)?.rankById[employeeId] ?? null

  /** 직전 연도 확정 대비 */
  const annualDeltaOf = (employeeId) => {
    const prev = decisionOf(employeeId, year - 1)
    if (!prev) return null
    const roll = annualRollup(evaluationsOfYear(employeeId))
    if (!roll.count) return null
    const decided = decisionOf(employeeId)
    return {
      ...deltaOf(
        {
          score: roll.score,
          grade: annualGradeOf(employeeId),
          finalRate: decided?.finalRate ?? null,
        },
        { score: prev.annualScore, grade: prev.grade, finalRate: prev.finalRate },
      ),
      label: `${year - 1}년`,
    }
  }

  const decisionKey = employee ? `${employee.id}::annual::${year}` : ''
  const decisionDraft = drafts[decisionKey] ?? null

  const decisionFromLevel = savedDecision ? savedDecision.fromLevel : (employee?.levelId ?? 'L2')
  const proposedLevelId =
    decisionDraft?.toLevel ?? savedDecision?.toLevel ?? employee?.levelId ?? 'L2'
  const decisionMemo = decisionDraft?.memo ?? savedDecision?.memo ?? ''

  const annualGradeKey = employee ? (annualGradeOf(employee.id) ?? 'B') : 'B'
  const recommendedRate = round1(
    rateBandFor(annualGradeKey, budget).mid +
      promotionIncreaseFor(decisionFromLevel, proposedLevelId),
  )

  const rateIsAuto =
    decisionDraft?.finalRate === undefined || decisionDraft?.finalRate === null
      ? savedDecision?.finalRate == null
      : false
  const finalRate = rateIsAuto
    ? recommendedRate
    : (decisionDraft?.finalRate ?? savedDecision?.finalRate ?? recommendedRate)

  const issues = useMemo(() => {
    if (!employee) return []
    return checkDecision({
      finalRate,
      gradeKey: annualGradeKey,
      memo: decisionMemo,
      quarterCount: annual.count,
      levelChanged: proposedLevelId !== decisionFromLevel,
      recommendedRate,
    })
  }, [
    employee,
    finalRate,
    annualGradeKey,
    decisionMemo,
    annual.count,
    proposedLevelId,
    decisionFromLevel,
    recommendedRate,
  ])

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
    if (!annual.count) return showToast(`${year}년에 저장된 분기 평가가 없습니다.`, 'error')

    const merit = rateBandFor(annualGradeKey, budget).mid
    const promotion = promotionIncreaseFor(decisionFromLevel, proposedLevelId)
    const delta = annualDeltaOf(employee.id)

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
      grade: annualGradeKey,
      rank: annualRankOf(employee.id),
      cohortSize: annualCohort.byCohort[cohortKeyOf(employee)]?.sorted.length ?? 0,
      delta,
      merit,
      promotion,
      finalRate,
      evaluator: settings.evaluator.trim(),
      memo: String(decisionMemo ?? '').trim(),
      decidedAt: todayISO(),
    }

    if (
      !window.confirm(
        `${employee.name}의 ${year}년 등급을 ${savedDecision ? '다시 확정' : '확정'}합니다.\n\n` +
          `등급 ${record.grade} · 성과 ${merit}% + 승급 ${promotion}% → 확정 인상률 ${finalRate}%\n` +
          (promotion ? `레벨 ${record.fromLevel} → ${record.toLevel} 승급\n` : '') +
          `\n연봉 금액은 이 앱에서 다루지 않습니다. HR 에 인상률(%)로 전달됩니다.`,
      )
    )
      return

    setDecisions((prev) =>
      savedDecision ? prev.map((d) => (d.id === record.id ? record : d)) : [record, ...prev],
    )
    if (promotion)
      setEmployees((prev) =>
        prev.map((e) => (e.id === employee.id ? { ...e, levelId: proposedLevelId } : e)),
      )
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[decisionKey]
      return next
    })
    showToast(`${employee.name} · ${year}년 등급 ${record.grade} · 인상률 ${finalRate}% 확정.`)
  }

  const deleteDecision = (record) => {
    if (
      !window.confirm(
        `${record.name}의 ${record.year}년 확정을 취소할까요?${
          record.toLevel !== record.fromLevel ? `\n레벨도 ${record.fromLevel} 로 되돌립니다.` : ''
        }`,
      )
    )
      return
    setDecisions((prev) => prev.filter((d) => d.id !== record.id))
    if (record.toLevel !== record.fromLevel)
      setEmployees((prev) =>
        prev.map((e) => (e.id === record.employeeId ? { ...e, levelId: record.fromLevel } : e)),
      )
    showToast('확정을 취소했습니다.')
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
        `${target.name}을(를) 명부에서 삭제할까요?${count ? ` 저장된 평가 ${count}건과 확정 기록도 함께 삭제됩니다.` : ''}`,
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
  const nameOf = (id) => employees.find((e) => e.id === id)?.name ?? '(삭제됨)'

  const allAnnual = useMemo(() => {
    const merged = { adjustments: [], borderline: [] }
    for (const res of Object.values(annualCohort.byCohort)) {
      merged.adjustments.push(...res.adjustments)
      merged.borderline.push(...borderlinePairs(res.sorted, res.byId))
    }
    return merged
  }, [annualCohort])

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
              IT 직군 평가 · 등급 산정
            </h1>
            <p className="text-xs text-slate-500">
              레벨별 기대치로 분기마다 평가하고, 상대평가로 연간 등급과 권장 인상률을 냅니다 ·
              연봉 금액은 다루지 않습니다
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
            {relative ? '상대평가' : '절대평가'} · 재원 {budget}%
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
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${level.theme.chip}`}
                        >
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
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {quarterLabel(quarter)} 평가
                        <DeltaBadge delta={quarterDeltaOf(employee.id)} size="sm" />
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
                        <Button
                          icon={RotateCcw}
                          variant="ghost"
                          onClick={resetScores}
                          className="no-print"
                        >
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
                      rank={myRank}
                      cohortSize={cohortSize}
                      budget={budget}
                      delta={quarterDeltaOf(employee.id)}
                      relative={relative}
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
              /* ─────────── 연간 등급 확정 ─────────── */
              <div className="space-y-5">
                {annual.count ? (
                  <DecisionPanel
                    year={year}
                    employee={employee}
                    level={LEVEL_MAP[decisionFromLevel] ?? level}
                    proposedLevelId={proposedLevelId}
                    annual={annual}
                    gradeKey={annualGradeKey}
                    rank={annualRankOf(employee.id)}
                    cohortSize={
                      annualCohort.byCohort[cohortKeyOf(employee)]?.sorted.length ?? 0
                    }
                    budget={budget}
                    finalRate={finalRate}
                    rateIsAuto={rateIsAuto}
                    issues={issues}
                    delta={annualDeltaOf(employee.id)}
                    decided={Boolean(savedDecision)}
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
                      연간 등급은 그 해 분기 평가 기록으로만 산정합니다. 먼저 [분기 평가]에서
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
                        description={`${year}년 분기 평가 ${annual.count}건의 평균으로 연간 점수를 냅니다. 미평가 분기는 채워 넣지 않습니다.`}
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
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-slate-100 px-5 py-4">
                        <Field
                          label="확정 사유 메모"
                          htmlFor="decision-memo"
                          hint="추천 인상률과 다르게 확정했거나 C·D 등급이면 필수입니다."
                        >
                          <textarea
                            id="decision-memo"
                            rows={2}
                            value={decisionMemo}
                            onChange={(e) => patchDecision({ memo: e.target.value })}
                            placeholder="예) 하반기 신규 도메인 이관을 단독으로 완료. 다음 사이클에 L4 승급 심사 예정."
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
                  distribution={distribution}
                  budget={budget}
                  avgRate={averageRate(yearDecisions)}
                  adjustments={allAnnual.adjustments}
                  borderline={allAnnual.borderline}
                  nameOf={nameOf}
                  scopeLabel={`${year}년 · ${relative ? `상대평가(${relativeScope === 'all' ? '전체' : relativeScope === 'role' ? '직무별' : '레벨별'})` : '절대평가'}`}
                  onSelect={setSelectedId}
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
              deltaOfEmployee={quarterDeltaOf}
              gradeOfEmployee={quarterGradeOf}
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
              gradeOfEmployee={annualGradeOf}
              rankOfEmployee={annualRankOf}
              deltaOfEmployee={annualDeltaOf}
              cohortSize={annualCohort.entries.length}
              budget={budget}
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
          showToast('평가 정책을 저장했습니다.')
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

/** 연도 이동 — 등급 확정은 연 1회이므로 분기 대신 연도로 다닌다 */
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
        <div className="text-sm font-semibold tabular-nums text-slate-900">{year}년 등급</div>
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
