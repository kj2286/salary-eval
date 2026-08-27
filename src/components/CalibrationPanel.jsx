import { GitCompareArrows, Scale, ShieldCheck } from 'lucide-react'
import { Card, CardHeader } from './ui.jsx'
import { GRADE_MAP, distributionOf } from '../lib/grading.js'

/**
 * 캘리브레이션(등급 조정 회의) 보조 패널.
 *
 * 상대평가라 분포는 목표에 거의 맞는다. 그래서 여기서 봐야 할 것은 분포 자체가 아니라
 * ① 절대 가드가 개입한 케이스 ② 등급 경계에 근소차로 갈린 인접 쌍이다.
 * 회의에서 실제로 다투는 지점이 그 둘이다.
 */
export default function CalibrationPanel({
  records,
  distribution,
  budget,
  avgRate,
  adjustments,
  borderline,
  nameOf,
  scopeLabel,
  onSelect,
}) {
  const dist = distributionOf(records, distribution)
  const over = avgRate - budget

  return (
    <Card>
      <CardHeader
        icon={Scale}
        title="캘리브레이션 · 등급 분포"
        description={`${scopeLabel} · ${records.length}명 확정 · 상대평가 배분 결과와 조정이 필요한 지점을 봅니다.`}
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
                  <span
                    className="absolute top-0 h-full w-0.5 bg-slate-900/50"
                    style={{ left: `${d.guide}%` }}
                    title={`목표 ${d.guide}%`}
                  />
                </div>
              </div>
              <span className="w-32 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
                <b className="text-slate-900">
                  {d.count}명 {d.pct}%
                </b>
                <span className="ml-1 text-slate-400">/ 목표 {d.guide}%</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <Note
            tone={over > 0.3 ? 'warn' : 'ok'}
            icon={Scale}
            title={`평균 인상률 ${avgRate.toFixed(2)}%`}
            body={
              over > 0.3
                ? `설정한 재원 ${budget}% 를 ${over.toFixed(2)}%p 초과합니다. 등급을 조정하거나 재원을 늘려야 합니다.`
                : `설정한 재원 ${budget}% 이내입니다.`
            }
          />
          <Note
            tone={adjustments?.length ? 'warn' : 'ok'}
            icon={ShieldCheck}
            title={`절대 가드 개입 ${adjustments?.length ?? 0}건`}
            body={
              adjustments?.length
                ? '상대 순위와 절대 점수가 충돌해 등급을 보정한 케이스입니다. 아래에서 확인하세요.'
                : '상대 순위와 절대 점수가 일치합니다.'
            }
          />
        </div>

        {adjustments?.length ? (
          <ul className="mt-3 space-y-1.5">
            {adjustments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-900 ring-1 ring-amber-200"
              >
                <b>{nameOf(a.id)}</b>
                <span className="inline-flex items-center gap-1">
                  <Chip k={a.from} dim />→<Chip k={a.to} />
                </span>
                <span className="opacity-80">{a.reason}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {borderline?.length ? (
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <GitCompareArrows size={13} strokeWidth={2} />
              등급 경계 · 근소차로 갈린 인접 쌍 {borderline.length}건
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              점수 차가 거의 없는데 등급이 갈렸습니다. 조정 회의에서 가장 먼저 다시 볼 지점입니다.
            </p>
            <ul className="mt-2 space-y-1.5">
              {borderline.map((b) => (
                <li
                  key={`${b.upper.id}-${b.lower.id}`}
                  className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 ring-1 ring-slate-200"
                >
                  <button
                    type="button"
                    onClick={() => onSelect?.(b.upper.id)}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {nameOf(b.upper.id)}
                  </button>
                  <Chip k={b.from} />
                  <span className="tabular-nums">{b.upper.score.toFixed(2)}</span>
                  <span className="text-slate-400">vs</span>
                  <button
                    type="button"
                    onClick={() => onSelect?.(b.lower.id)}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {nameOf(b.lower.id)}
                  </button>
                  <Chip k={b.to} />
                  <span className="tabular-nums">{b.lower.score.toFixed(2)}</span>
                  <span className="ml-auto font-medium tabular-nums text-slate-500">
                    차이 {b.gap.toFixed(2)}점
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!records.length ? (
          <p className="mt-4 text-center text-xs text-slate-400">
            확정된 평가가 없어 분포를 계산할 수 없습니다.
          </p>
        ) : null}
        {records.length && records.length < 5 ? (
          <p className="mt-3 text-[11px] text-slate-400">
            {records.length}명 기준입니다. 인원이 적을수록 상대평가의 의미가 약해집니다 — 5명
            조직에서 "S는 10%" 는 0명 또는 1명이라는 뜻일 뿐입니다.
          </p>
        ) : null}
      </div>
    </Card>
  )
}

function Chip({ k, dim }) {
  const g = GRADE_MAP[k]
  if (!g) return null
  return (
    <span
      className={`grid size-5 place-items-center rounded text-[10px] font-bold ${g.badge} ${dim ? 'opacity-50' : ''}`}
    >
      {g.key}
    </span>
  )
}

function Note({ tone, icon: Icon, title, body }) {
  return (
    <div
      className={`rounded-xl px-3.5 py-3 text-xs ring-1 ${
        tone === 'warn'
          ? 'bg-amber-50 text-amber-900 ring-amber-200'
          : 'bg-slate-50 text-slate-600 ring-slate-200'
      }`}
    >
      <b className="flex items-center gap-1.5">
        <Icon size={12} strokeWidth={2} />
        {title}
      </b>
      <span className="mt-0.5 block leading-relaxed opacity-80">{body}</span>
    </div>
  )
}
