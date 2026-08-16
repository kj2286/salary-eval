import { History } from 'lucide-react'
import { gradeOf } from '../lib/grading.js'
import { quarterLabel, recentQuarters } from '../lib/quarters.js'

/** 선택한 직원의 최근 분기 추이 — 분기마다 평가하는 운영을 전제로 한 흐름 확인용 */
export default function EvaluationHistory({ quarter, history, onSelectQuarter }) {
  const quarters = recentQuarters(quarter, 6)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <History size={14} strokeWidth={1.75} />
        분기 추이
      </div>

      <ul className="mt-3 flex items-end gap-1.5">
        {quarters.map((q) => {
          const record = history.find((r) => r.quarter === q)
          const grade = record ? gradeOf(record.average) : null
          const height = record ? 12 + ((record.average - 1) / 4) * 52 : 6
          const isCurrent = q === quarter
          return (
            <li key={q} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium tabular-nums text-slate-500">
                {record ? record.average.toFixed(1) : '—'}
              </span>
              <button
                type="button"
                onClick={() => onSelectQuarter(q)}
                title={`${quarterLabel(q)}${record ? ` · ${grade.key}등급 · ${record.finalRate.toFixed(1)}%` : ' · 미평가'}`}
                className={`w-full rounded-md transition-opacity hover:opacity-80 ${
                  record ? grade.bar : 'bg-slate-100'
                } ${isCurrent ? 'ring-2 ring-slate-900 ring-offset-1' : ''}`}
                style={{ height: `${height}px` }}
              />
              <span
                className={`text-[10px] tabular-nums ${isCurrent ? 'font-semibold text-slate-700' : 'text-slate-400'}`}
              >
                {q.slice(2).replace('-', ' ')}
              </span>
            </li>
          )
        })}
      </ul>

      {history.length ? (
        <p className="mt-3 text-[11px] text-slate-400">
          누적 {history.length}개 분기 · 최근 확정 인상률{' '}
          {[...history].sort((a, b) => (a.quarter < b.quarter ? 1 : -1))[0].finalRate.toFixed(1)}%
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-slate-400">이 직원의 저장된 평가가 아직 없습니다.</p>
      )}
    </div>
  )
}
