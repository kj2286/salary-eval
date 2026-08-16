import { ClipboardList, Trash2 } from 'lucide-react'
import { Card, CardHeader } from './ui.jsx'
import { ROLE_MAP } from '../data/roles.js'
import { formatNumber } from '../lib/format.js'
import { calcSalary, gradeOf } from '../lib/grading.js'
import { quarterLabel } from '../lib/quarters.js'

/** 선택한 분기의 전 직원 현황 — 미평가자도 행으로 남겨 누락을 드러낸다 */
export default function QuarterTable({
  quarter,
  employees,
  evaluationOf,
  onSelect,
  onDeleteEvaluation,
  actions,
}) {
  const evaluated = employees.map((e) => evaluationOf(e.id)).filter(Boolean)
  const totals = evaluated.reduce(
    (acc, r) => {
      const s = calcSalary(r.currentSalary, r.finalRate)
      acc.base += s.base
      acc.raise += s.raiseAmount
      acc.next += s.newSalary
      return acc
    },
    { base: 0, raise: 0, next: 0 },
  )
  const totalRate = totals.base ? (totals.raise / totals.base) * 100 : 0

  return (
    <Card>
      <CardHeader
        icon={ClipboardList}
        title={`${quarterLabel(quarter)} 평가 현황`}
        description={
          employees.length
            ? `${evaluated.length}/${employees.length}명 완료 · 인상 재원 ${formatNumber(totals.raise)}원 (평균 ${totalRate.toFixed(1)}%)`
            : '등록된 직원이 없습니다.'
        }
        right={actions}
      />

      {employees.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-medium text-slate-500">
                <th className="px-5 py-2.5">이름</th>
                <th className="px-3 py-2.5">직무</th>
                <th className="px-3 py-2.5 text-right">평균</th>
                <th className="px-3 py-2.5 text-center">등급</th>
                <th className="px-3 py-2.5 text-right">현재 연봉</th>
                <th className="px-3 py-2.5 text-right">인상률</th>
                <th className="px-3 py-2.5 text-right">인상 금액</th>
                <th className="px-3 py-2.5 text-right">조정 후 연봉</th>
                <th className="px-3 py-2.5 text-right">월(세전)</th>
                <th className="px-5 py-2.5 text-right no-print">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees.map((employee) => {
                const role = ROLE_MAP[employee.roleId]
                const record = evaluationOf(employee.id)
                const s = record ? calcSalary(record.currentSalary, record.finalRate) : null
                const grade = record ? gradeOf(record.average) : null

                return (
                  <tr
                    key={employee.id}
                    className={`transition-colors hover:bg-slate-50/70 ${record ? 'text-slate-700' : 'text-slate-400'}`}
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
                        {record ? `${record.evaluator || '평가자 미기입'} · ${record.evaluatedAt}` : '미평가'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-[11px] font-medium ${role?.theme.soft ?? 'bg-slate-100'} ${role?.theme.text ?? 'text-slate-500'}`}
                      >
                        {role?.label ?? employee.roleId}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {record ? record.average.toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {grade ? (
                        <span
                          className={`inline-grid size-6 place-items-center rounded-lg text-xs font-bold ${grade.badge}`}
                        >
                          {grade.key}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelect(employee.id)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50 no-print"
                        >
                          평가하기
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatNumber(record ? s.base : employee.currentSalary)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {record ? `${s.rate.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-600">
                      {record ? `+${formatNumber(s.raiseAmount)}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {record ? formatNumber(s.newSalary) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {record ? formatNumber(s.monthlyGross) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right no-print">
                      {record ? (
                        <button
                          type="button"
                          onClick={() => onDeleteEvaluation(record)}
                          title="이 분기 평가 삭제"
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
                <td className="px-5 py-3 text-xs font-semibold" colSpan={4}>
                  합계 (평가 완료 {evaluated.length}명)
                </td>
                <td className="px-3 py-3 text-right text-xs font-semibold tabular-nums">
                  {formatNumber(totals.base)}
                </td>
                <td className="px-3 py-3 text-right text-xs font-semibold tabular-nums">
                  {totalRate.toFixed(1)}%
                </td>
                <td className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-emerald-600">
                  +{formatNumber(totals.raise)}
                </td>
                <td className="px-3 py-3 text-right text-xs font-semibold tabular-nums">
                  {formatNumber(totals.next)}
                </td>
                <td className="px-3 py-3" />
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
