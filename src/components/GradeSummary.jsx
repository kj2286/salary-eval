import { Gauge, Sparkles } from 'lucide-react'
import { GRADES, rateRangeText } from '../lib/grading.js'

/** 평균 점수 → 등급 → 추천 인상률 범위를 실시간으로 보여주는 카드 */
export default function GradeSummary({ average, grade, role }) {
  const percent = ((average - 1) / 4) * 100

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Gauge size={14} strokeWidth={1.75} />
          실시간 산출
        </span>
        <span className="text-[11px] text-slate-400">{role.label}</span>
      </div>

      <div className="mt-4 flex items-end gap-4">
        <div>
          <div className="text-[11px] font-medium text-slate-500">평균 점수</div>
          <div className="text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
            {average.toFixed(2)}
            <span className="ml-1 text-base font-normal text-slate-400">/ 5.00</span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[11px] font-medium text-slate-500">등급</div>
          <div className="mt-1 flex items-center justify-end gap-2">
            <span
              className={`grid size-11 place-items-center rounded-2xl text-xl font-bold ${grade.badge}`}
            >
              {grade.key}
            </span>
          </div>
        </div>
      </div>

      {/* 등급 구간 게이지 */}
      <div className="mt-4">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${grade.bar}`}
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
        <div className="relative mt-1 h-4 text-[10px] text-slate-400">
          {/* 1~5 점 축 위 등급 경계 (2.8 / 3.8 / 4.5) */}
          {[2.8, 3.8, 4.5].map((cut) => (
            <span
              key={cut}
              className="absolute -translate-x-1/2 tabular-nums"
              style={{ left: `${((cut - 1) / 4) * 100}%` }}
            >
              {cut}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-3 rounded-xl px-3.5 py-3 ring-1 ${grade.soft}`}>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Sparkles size={13} strokeWidth={2} />
          {grade.key}등급 · {grade.name}
        </div>
        <p className="mt-1 text-xs opacity-80">{grade.desc}</p>
        <p className="mt-2 text-sm font-semibold tabular-nums">
          추천 인상률 {rateRangeText(grade)}
        </p>
      </div>

      <ul className="mt-3 grid grid-cols-4 gap-1.5">
        {GRADES.map((g) => (
          <li
            key={g.key}
            className={`rounded-lg px-2 py-1.5 text-center text-[10px] leading-tight ${
              g.key === grade.key ? `${g.badge} font-semibold` : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div className="text-xs font-bold">{g.key}</div>
            <div>{g.min > 0 ? `${g.min.toFixed(1)}↑` : '미만'}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
