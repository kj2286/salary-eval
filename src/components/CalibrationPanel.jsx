import { Scale } from 'lucide-react'
import { Card, CardHeader } from './ui.jsx'
import { distributionOf } from '../lib/grading.js'

/**
 * 캘리브레이션(등급 조정 회의) 보조 패널.
 *
 * 절대평가만 돌리면 평가자 관대화로 A 이상이 절반을 넘는 일이 흔하다.
 * 강제배분은 하지 않되, 권장 분포와의 차이를 눈으로 보여주고 재원 초과를 경고한다.
 */
export default function CalibrationPanel({ records, budget, totalBase, totalRaise, scopeLabel }) {
  const dist = distributionOf(records)
  const actualBudget = totalBase ? (totalRaise / totalBase) * 100 : 0
  const over = actualBudget - budget
  const skew = dist.find((d) => d.grade.key === 'S' || d.grade.key === 'A')

  const highShare = dist
    .filter((d) => d.grade.key === 'S' || d.grade.key === 'A')
    .reduce((acc, d) => acc + d.pct, 0)
  const highGuide = dist
    .filter((d) => d.grade.key === 'S' || d.grade.key === 'A')
    .reduce((acc, d) => acc + d.guide, 0)

  return (
    <Card>
      <CardHeader
        icon={Scale}
        title="캘리브레이션 · 등급 분포"
        description={`${scopeLabel} · ${records.length}명 확정 · 권장 분포와의 차이를 확인하고 조정 회의에서 근거로 씁니다.`}
      />

      <div className="px-5 py-5">
        <ul className="space-y-2.5">
          {dist.map((d) => (
            <li key={d.grade.key} className="flex items-center gap-3">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${d.grade.badge}`}
              >
                {d.grade.key}
              </span>
              <div className="min-w-0 flex-1">
                <div className="relative h-5 rounded-lg bg-slate-100">
                  <div
                    className={`h-full rounded-lg ${d.grade.bar} transition-all`}
                    style={{ width: `${Math.min(100, d.pct)}%` }}
                  />
                  {/* 권장 분포 눈금 */}
                  <span
                    className="absolute top-0 h-full w-0.5 bg-slate-900/50"
                    style={{ left: `${d.guide}%` }}
                    title={`권장 ${d.guide}%`}
                  />
                </div>
              </div>
              <span className="w-28 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
                <b className="text-slate-900">{d.count}명 {d.pct}%</b>
                <span className="ml-1 text-slate-400">/ 권장 {d.guide}%</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <Note
            tone={highShare > highGuide + 15 ? 'warn' : 'ok'}
            title={`상위 등급(S+A) ${highShare.toFixed(0)}%`}
            body={
              highShare > highGuide + 15
                ? `권장 ${highGuide}% 대비 크게 쏠렸습니다. 평가자 관대화이거나 레벨이 낮게 매겨져 있을 가능성을 확인하세요.`
                : `권장 ${highGuide}% 대비 정상 범위입니다.`
            }
          />
          <Note
            tone={over > 0.5 ? 'warn' : 'ok'}
            title={`실제 인상 재원 ${actualBudget.toFixed(2)}%`}
            body={
              over > 0.5
                ? `설정한 재원 ${budget}% 를 ${over.toFixed(2)}%p 초과합니다. 등급을 조정하거나 재원을 늘려야 합니다.`
                : `설정한 재원 ${budget}% 이내입니다.`
            }
          />
        </div>

        {!records.length ? (
          <p className="mt-4 text-center text-xs text-slate-400">
            확정된 평가가 없어 분포를 계산할 수 없습니다.
          </p>
        ) : null}
        {records.length && records.length < 5 ? (
          <p className="mt-3 text-[11px] text-slate-400">
            {records.length}명 기준입니다. 인원이 적을수록 분포 비율은 참고치로만 쓰세요 — 5명
            조직에서 "S는 10%" 는 0명 또는 1명이라는 뜻일 뿐입니다.
          </p>
        ) : null}
      </div>
    </Card>
  )
}

function Note({ tone, title, body }) {
  return (
    <div
      className={`rounded-xl px-3.5 py-3 text-xs ring-1 ${
        tone === 'warn'
          ? 'bg-amber-50 text-amber-900 ring-amber-200'
          : 'bg-slate-50 text-slate-600 ring-slate-200'
      }`}
    >
      <b className="block">{title}</b>
      <span className="mt-0.5 block leading-relaxed opacity-80">{body}</span>
    </div>
  )
}
