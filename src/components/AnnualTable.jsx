import { Award, Trash2 } from 'lucide-react'
import { Card, CardHeader } from './ui.jsx'
import { ROLE_MAP } from '../data/roles.js'
import { LEVEL_MAP } from '../data/levels.js'
import { GRADE_MAP, annualRollup, averageRate } from '../lib/grading.js'
import DeltaBadge, { GradeMove } from './DeltaBadge.jsx'

/** 연간 등급 확정 현황 — 금액 없이 등급·순위·인상률(%)·직전 대비까지만 */
export default function AnnualTable({
  year,
  employees,
  evaluationsOfYear,
  decisionOf,
  gradeOfEmployee,
  rankOfEmployee,
  deltaOfEmployee,
  cohortSize,
  budget,
  onSelect,
  onDeleteDecision,
  actions,
}) {
  const decided = employees.map((e) => decisionOf(e.id)).filter(Boolean)
  const avg = averageRate(decided)
  const over = avg - budget

  return (
    <Card>
      <CardHeader
        icon={Award}
        title={`${year}년 등급 확정 현황`}
        description={
          employees.length
            ? `${decided.length}/${employees.length}명 확정 · 평균 인상률 ${avg.toFixed(2)}% (재원 ${budget}%${over > 0.3 ? ` · ${over.toFixed(2)}%p 초과` : ''})`
            : '등록된 직원이 없습니다.'
        }
        right={actions}
      />

      {employees.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-medium text-slate-500">
                <th className="px-5 py-2.5">이름</th>
                <th className="px-3 py-2.5">직무 · 레벨</th>
                <th className="px-3 py-2.5 text-center">평가 분기</th>
                <th className="px-3 py-2.5 text-right">연간 점수</th>
                <th className="px-3 py-2.5 text-left">직전 대비</th>
                <th className="px-3 py-2.5 text-center">순위</th>
                <th className="px-3 py-2.5 text-center">등급</th>
                <th className="px-3 py-2.5 text-center">등급 변화</th>
                <th className="px-3 py-2.5 text-right">성과</th>
                <th className="px-3 py-2.5 text-right">승급</th>
                <th className="px-3 py-2.5 text-right">확정 인상률</th>
                <th className="px-5 py-2.5 text-right no-print">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees.map((employee) => {
                const role = ROLE_MAP[employee.roleId]
                const level = LEVEL_MAP[employee.levelId] ?? LEVEL_MAP.L2
                const decision = decisionOf(employee.id)
                const annual = annualRollup(evaluationsOfYear(employee.id))
                const gradeKey = decision?.grade ?? gradeOfEmployee(employee.id)
                const grade = GRADE_MAP[gradeKey] ?? null
                const rank = rankOfEmployee(employee.id)
                const delta = deltaOfEmployee(employee.id)

                return (
                  <tr
                    key={employee.id}
                    className={`transition-colors hover:bg-slate-50/70 ${decision ? 'text-slate-700' : 'text-slate-400'}`}
                  >
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => onSelect(employee.id)}
                        className="text-left font-medium text-slate-900 hover:underline"
                      >
                        {employee.name}
                      </button>
                      <div className="text-[11px] text-slate-400">
                        {decision ? `확정 ${decision.decidedAt}` : '미확정'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-[11px] font-medium ${role?.theme.soft ?? 'bg-slate-100'} ${role?.theme.text ?? 'text-slate-500'}`}
                      >
                        {role?.short ?? employee.roleId}
                      </span>
                      <span className={`ml-1 rounded-lg px-1.5 py-1 text-[11px] ${level.theme.chip}`}>
                        {decision && decision.toLevel !== decision.fromLevel
                          ? `${decision.fromLevel}→${decision.toLevel}`
                          : level.short}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      <span className={annual.count >= 2 ? '' : 'text-amber-600'}>
                        {annual.count}/4
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {annual.score != null ? annual.score.toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      {annual.count ? (
                        <DeltaBadge delta={delta} size="sm" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      {rank ? (
                        <span className="text-slate-500">
                          {rank}
                          <span className="text-[10px] text-slate-400">/{cohortSize}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {grade ? (
                        <span
                          className={`inline-grid size-6 place-items-center rounded-lg text-xs font-bold ${grade.badge} ${decision ? '' : 'opacity-50'}`}
                          title={decision ? '확정' : '잠정'}
                        >
                          {grade.key}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <GradeMove delta={delta} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {decision ? `${decision.merit.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {decision
                        ? decision.promotion
                          ? `+${decision.promotion.toFixed(1)}%`
                          : '—'
                        : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {decision ? (
                        <span className="inline-flex items-center gap-1.5">
                          {decision.finalRate.toFixed(1)}%
                          {delta?.rateDelta != null ? (
                            <DeltaBadge delta={delta} show="rate" size="sm" />
                          ) : null}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelect(employee.id)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50 no-print"
                        >
                          확정하기
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right no-print">
                      {decision ? (
                        <button
                          type="button"
                          onClick={() => onDeleteDecision(decision)}
                          title="확정 취소"
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={15} strokeWidth={1.75} />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-100 bg-slate-50/60 text-slate-900">
                <td className="px-5 py-3 text-xs font-semibold" colSpan={10}>
                  확정 {decided.length}명 · 평균 인상률
                </td>
                <td
                  className={`px-3 py-3 text-right text-xs font-semibold tabular-nums ${over > 0.3 ? 'text-amber-600' : ''}`}
                >
                  {avg.toFixed(2)}%
                </td>
                <td className="px-5 py-3 no-print" />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="px-5 py-12 text-center text-sm text-slate-400">
          왼쪽 “직원 추가”로 명부를 먼저 만들어 주세요.
        </div>
      )}
    </Card>
  )
}
