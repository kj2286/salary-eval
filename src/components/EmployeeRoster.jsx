import { useMemo, useState } from 'react'
import { CircleDashed, Pencil, Search, UserPlus, Users } from 'lucide-react'
import { Card, CardHeader, inputClass } from './ui.jsx'
import { ROLES, ROLE_MAP } from '../data/roles.js'
import { formatKoreanWon } from '../lib/format.js'
import { gradeOf } from '../lib/grading.js'

/**
 * 등록된 직원 목록에서 평가 대상을 고른다.
 * 각 행은 "선택된 분기"의 평가 상태(등급 / 작성 중 / 미평가)를 함께 보여준다.
 */
export default function EmployeeRoster({
  employees,
  selectedId,
  statusOf,
  onSelect,
  onAdd,
  onEdit,
}) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return employees
      .filter((e) => (roleFilter === 'all' ? true : e.roleId === roleFilter))
      .filter((e) => (q ? e.name.toLowerCase().includes(q) : true))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'ko'))
  }, [employees, query, roleFilter])

  return (
    <Card className="lg:sticky lg:top-5">
      <CardHeader
        icon={Users}
        title="직원 명부"
        description={`${employees.filter((e) => e.active).length}명 재직 중`}
        right={
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
          >
            <UserPlus size={14} strokeWidth={1.75} />
            직원 추가
          </button>
        }
      />

      <div className="space-y-2 px-4 py-3">
        <div className="relative">
          <Search
            size={15}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 검색"
            aria-label="직원 이름 검색"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {[{ id: 'all', label: '전체' }, ...ROLES.map((r) => ({ id: r.id, label: r.short }))].map(
            (f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRoleFilter(f.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  roleFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ),
          )}
        </div>
      </div>

      <ul className="max-h-[420px] space-y-1 overflow-y-auto px-2 pb-3">
        {visible.map((employee) => {
          const role = ROLE_MAP[employee.roleId]
          const status = statusOf(employee.id)
          const selected = employee.id === selectedId
          return (
            <li key={employee.id}>
              <div
                className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${
                  selected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(employee.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  aria-current={selected}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl text-xs font-semibold ${
                      selected ? 'bg-white/15 text-white' : `${role?.theme.soft} ${role?.theme.text}`
                    }`}
                  >
                    {role?.short ?? '—'}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{employee.name}</span>
                      {!employee.active ? (
                        <span className="shrink-0 rounded bg-slate-200 px-1 text-[10px] text-slate-500">
                          퇴사
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`block truncate text-[11px] ${selected ? 'text-slate-300' : 'text-slate-400'}`}
                    >
                      {formatKoreanWon(employee.currentSalary)}
                    </span>
                  </span>
                </button>

                <StatusBadge status={status} selected={selected} />

                <button
                  type="button"
                  onClick={() => onEdit(employee)}
                  aria-label={`${employee.name} 정보 수정`}
                  className={`rounded-lg p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 ${
                    selected ? 'text-slate-300 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Pencil size={14} strokeWidth={1.75} />
                </button>
              </div>
            </li>
          )
        })}

        {!visible.length ? (
          <li className="px-3 py-8 text-center text-xs text-slate-400">
            {employees.length ? '검색 결과가 없습니다.' : '먼저 직원을 등록해 주세요.'}
          </li>
        ) : null}
      </ul>
    </Card>
  )
}

function StatusBadge({ status, selected }) {
  if (status.state === 'saved') {
    const grade = gradeOf(status.average)
    return (
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${grade.badge}`}
        title={`평균 ${status.average.toFixed(2)} · ${grade.key}등급`}
      >
        {grade.key}
      </span>
    )
  }
  if (status.state === 'draft') {
    return (
      <span
        className="shrink-0 rounded-lg bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
        title="저장하지 않은 작성 중 평가"
      >
        작성 중
      </span>
    )
  }
  return (
    <CircleDashed
      size={15}
      strokeWidth={1.75}
      className={`shrink-0 ${selected ? 'text-slate-500' : 'text-slate-300'}`}
      aria-label="미평가"
    />
  )
}
