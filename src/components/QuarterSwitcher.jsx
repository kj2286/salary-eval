import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'
import { currentQuarter, quarterLabel, quarterMonths, shiftQuarter } from '../lib/quarters.js'

/** 분기 이동 — 평가는 이 분기 컨텍스트 안에서만 저장된다 */
export default function QuarterSwitcher({ quarter, onChange, evaluatedCount, totalCount }) {
  const isCurrent = quarter === currentQuarter()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => onChange(shiftQuarter(quarter, -1))}
          aria-label="이전 분기"
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <div className="px-2 text-center">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <CalendarRange size={15} strokeWidth={1.75} className="text-slate-400" />
            {quarterLabel(quarter)}
          </div>
          <div className="text-[11px] text-slate-400">
            {quarterMonths(quarter)} · 평가 {evaluatedCount}/{totalCount}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(shiftQuarter(quarter, 1))}
          aria-label="다음 분기"
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      {isCurrent ? (
        <span className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white">
          이번 분기
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onChange(currentQuarter())}
          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          이번 분기로
        </button>
      )}
    </div>
  )
}
