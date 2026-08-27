import { Gauge, Sparkles } from 'lucide-react'
import { GRADES } from '../lib/grading.js'
import { DOMAIN_MAP } from '../data/roles.js'

/**
 * 가중 점수 → 등급 카드.
 * 예전 버전은 "전 항목 단순평균" 한 숫자만 보여줬는데, 그러면 왜 그 등급이 나왔는지
 * 설명이 안 된다. 도메인별 점수 × 레벨 가중치를 같이 보여줘야 면담에서 쓸 수 있다.
 */
export default function GradeSummary({ score, grade, byDomain, level }) {
  const percent = ((score - 1) / 4) * 100
  const domains = Object.entries(byDomain ?? {})

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

      <div className="mt-4">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${grade.bar}`}
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
        <div className="relative mt-1 h-4 text-[10px] text-slate-400">
          {[2.2, 2.9, 3.7, 4.3].map((cut) => (
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

      {/* 도메인 기여도 — 어디서 점수가 깎였는지가 한눈에 보여야 한다 */}
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
                <span className="font-semibold tabular-nums text-slate-700">
                  {d.avg.toFixed(2)}
                </span>
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
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Sparkles size={13} strokeWidth={2} />
          {grade.key}등급 · {grade.name}
        </div>
        <p className="mt-1 text-xs opacity-80">{grade.desc}</p>
      </div>

      <ul className="mt-3 grid grid-cols-5 gap-1">
        {GRADES.map((g) => (
          <li
            key={g.key}
            className={`rounded-lg px-1 py-1.5 text-center text-[10px] leading-tight ${
              g.key === grade.key ? `${g.badge} font-semibold` : 'bg-slate-50 text-slate-400'
            }`}
            title={`권장 분포 ${g.guide}%`}
          >
            <div className="text-xs font-bold">{g.key}</div>
            <div>{g.min > 0 ? `${g.min.toFixed(1)}↑` : '미만'}</div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-400">
        인상률은 여기서 정해지지 않습니다. 등급 × 시장 대비 위치(compa-ratio)로 연 1회 확정합니다.
      </p>
    </div>
  )
}
