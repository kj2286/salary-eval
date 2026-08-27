import { Gauge, Info, TrendingUp, Trophy } from 'lucide-react'
import { GRADES, rateBandFor } from '../lib/grading.js'
import { DOMAIN_MAP } from '../data/roles.js'
import DeltaBadge from './DeltaBadge.jsx'

/**
 * 가중 점수 + 잠정 등급 카드.
 *
 * 등급은 상대평가라 **집단 전체가 채점되기 전에는 확정되지 않는다.**
 * 그래서 "잠정"임을 분명히 표시한다 — 다른 사람 점수가 들어오면 바뀔 수 있다.
 */
export default function GradeSummary({
  score,
  grade,
  byDomain,
  level,
  rank,
  cohortSize,
  budget,
  delta,
  relative,
}) {
  const percent = ((score - 1) / 4) * 100
  const domains = Object.entries(byDomain ?? {})
  const rateBand = rateBandFor(grade.key, budget)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Gauge size={14} strokeWidth={1.75} />
          가중 산출
        </span>
        <span className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${level.theme.chip}`}>
          {level.short} {level.label} 기준
        </span>
      </div>

      <div className="mt-4 flex items-end gap-4">
        <div>
          <div className="text-[11px] font-medium text-slate-500">가중 점수</div>
          <div className="text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
            {score.toFixed(2)}
            <span className="ml-1 text-base font-normal text-slate-400">/ 5.00</span>
          </div>
          <div className="mt-1.5">
            <DeltaBadge delta={delta} />
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[11px] font-medium text-slate-500">
            {relative ? '잠정 등급' : '등급'}
          </div>
          <div className="mt-1 flex items-center justify-end gap-2">
            <span
              className={`grid size-11 place-items-center rounded-2xl text-xl font-bold ${grade.badge}`}
            >
              {grade.key}
            </span>
          </div>
          {relative && rank ? (
            <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] text-slate-500">
              <Trophy size={11} strokeWidth={2} />
              {cohortSize}명 중 {rank}위
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${grade.bar}`}
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
        <div className="relative mt-1 h-4 text-[10px] text-slate-400">
          {[2, 3, 4].map((cut) => (
            <span
              key={cut}
              className="absolute -translate-x-1/2 tabular-nums"
              style={{ left: `${((cut - 1) / 4) * 100}%` }}
            >
              {cut}.0
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {domains.map(([id, d]) => {
          const meta = DOMAIN_MAP[id]
          return (
            <li key={id}>
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="font-medium text-slate-600">
                  {meta.label}
                  <span className="ml-1 text-slate-400">가중 {d.weight}%</span>
                </span>
                <span className="font-semibold tabular-nums text-slate-700">{d.avg.toFixed(2)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${meta.theme.bar}`}
                  style={{ width: `${Math.max(2, ((d.avg - 1) / 4) * 100)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <div className={`mt-4 rounded-xl px-3.5 py-3 ring-1 ${grade.soft}`}>
        <div className="flex items-center justify-between gap-2 text-xs font-semibold">
          <span>
            {grade.key}등급 · {grade.name}
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <TrendingUp size={12} strokeWidth={2.25} />
            {rateBand.min.toFixed(1)}~{rateBand.max.toFixed(1)}%
          </span>
        </div>
        <p className="mt-1 text-xs opacity-80">{grade.desc}</p>
      </div>

      <ul className="mt-3 grid grid-cols-5 gap-1">
        {GRADES.map((g) => {
          const band = rateBandFor(g.key, budget)
          return (
            <li
              key={g.key}
              className={`rounded-lg px-1 py-1.5 text-center text-[10px] leading-tight ${
                g.key === grade.key ? `${g.badge} font-semibold` : 'bg-slate-50 text-slate-400'
              }`}
              title={`권장 분포 ${g.guide}% · 인상률 ${band.min}~${band.max}%`}
            >
              <div className="text-xs font-bold">{g.key}</div>
              <div className="tabular-nums">{band.mid.toFixed(0)}%</div>
            </li>
          )
        })}
      </ul>

      {relative ? (
        <p className="mt-3 flex gap-1.5 text-[11px] leading-relaxed text-slate-400">
          <Info size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
          상대평가입니다. 이 등급은 현재까지 저장된 {cohortSize}명 기준의 잠정값이며, 나머지
          인원이 채점되면 바뀔 수 있습니다. 최종 등급은 연간 확정에서 정해집니다.
        </p>
      ) : null}
    </div>
  )
}
