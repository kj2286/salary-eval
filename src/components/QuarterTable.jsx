import { ClipboardList, Trash2 } from 'lucide-react'
import { Card, CardHeader } from './ui.jsx'
import { ROLE_MAP, DOMAINS } from '../data/roles.js'
import { LEVEL_MAP } from '../data/levels.js'
import { GRADE_MAP } from '../lib/grading.js'
import DeltaBadge from './DeltaBadge.jsx'
import { quarterLabel } from '../lib/quarters.js'

/**
 * 선택한 분기의 전 직원 평가 현황.
 *
 * 예전 표에는 인상률·인상금액·조정후연봉이 들어 있었다. 뺐다 —
 * 분기 표에 연봉 열이 있으면 "분기마다 연봉을 올린다"는 오해가 그대로 운영에 들어온다.
 * 보상은 [연간 보상 확정] 탭에서만 다룬다.
 */
export default function QuarterTable({
  quarter,
  employees,
  evaluationOf,
  deltaOfEmployee,
  gradeOfEmployee,
  onSelect,
  onDeleteEvaluation,
  actions,
}) {
  const evaluated = employees.map((e) => evaluationOf(e.id)).filter(Boolean)

  return (
    <Card>
      <CardHeader
        icon={ClipboardList}
        title={`${quarterLabel(quarter)} 평가 현황`}
        description={
          employees.length
            ? `${evaluated.length}/${employees.length}명 완료 · 등급은 상대평가 잠정값이며 연간 확정에서 최종 결정됩니다.`
            : '등록된 직원이 없습니다.'
        }
        right={actions}
      />

      {employees.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-medium text-slate-500">
                <th className="px-5 py-2.5">이름</th>
                <th className="px-3 py-2.5">직무 · 레벨</th>
                <th className="px-3 py-2.5 text-right">가중 점수</th>
                <th className="px-3 py-2.5 text-left">직전 분기 대비</th>
                <th className="px-3 py-2.5 text-center">잠정 등급</th>
                {DOMAINS.map((d) => (
                  <th key={d.id} className="px-3 py-2.5 text-right">
                    {d.label}
                  </th>
                ))}
                <th className="px-5 py-2.5 text-right no-print">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees.map((employee) => {
                const role = ROLE_MAP[employee.roleId]
                const level = LEVEL_MAP[employee.levelId] ?? LEVEL_MAP.L2
                const record = evaluationOf(employee.id)
                const grade = record ? (GRADE_MAP[gradeOfEmployee(employee.id)] ?? GRADE_MAP[record.grade]) : null
                const delta = record ? deltaOfEmployee(employee.id) : null

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
                        {record
                          ? `${record.evaluator || '평가자 미기입'} · ${record.updatedAt}${record.legacy ? ' · 구버전 기록' : ''}`
                          : '미평가'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-[11px] font-medium ${role?.theme.soft ?? 'bg-slate-100'} ${role?.theme.text ?? 'text-slate-500'}`}
                      >
                        {role?.short ?? employee.roleId}
                      </span>
                      <span className={`ml-1 rounded-lg px-1.5 py-1 text-[11px] ${level.theme.chip}`}>
                        {level.short}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {record ? Number(record.score).toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      {record ? <DeltaBadge delta={delta} size="sm" /> : <span className="text-slate-300">—</span>}
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
                    {DOMAINS.map((d) => {
                      const cell = record?.byDomain?.[d.id]
                      return (
                        <td key={d.id} className="px-3 py-3 text-right tabular-nums">
                          {cell ? (
                            <span title={`가중 ${cell.weight}%`}>
                              {cell.avg.toFixed(1)}
                              <span className="ml-0.5 text-[10px] text-slate-400">
                                ·{cell.weight}%
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      )
                    })}
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
