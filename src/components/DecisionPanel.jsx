import { AlertTriangle, Award, Info, Percent, TrendingUp, Trophy } from 'lucide-react'
import { Button, Card, CardHeader, Field, StatTile, inputClass } from './ui.jsx'
import { GRADE_MAP, rateBandFor } from '../lib/grading.js'
import { LEVELS, promotionIncreaseFor } from '../data/levels.js'
import DeltaBadge from './DeltaBadge.jsx'

const RATE_MAX = 20

/**
 * 연간 등급·인상률 확정 화면.
 *
 * **연봉 금액은 이 앱에 없다.** 리더는 등급과 인상률(%)까지만 정하고,
 * 실제 금액은 HR 이 시장 대비 위치와 재원을 반영해 확정한다.
 */
export default function DecisionPanel({
  year,
  employee,
  level,
  proposedLevelId,
  annual,
  gradeKey,
  rank,
  cohortSize,
  budget,
  finalRate,
  rateIsAuto,
  issues,
  delta,
  decided,
  onProposedLevel,
  onRateChange,
  onApplyRecommended,
  onApply,
  onCancelDecision,
}) {
  const grade = GRADE_MAP[gradeKey] ?? GRADE_MAP.B
  const band = rateBandFor(gradeKey, budget)
  const promotion = promotionIncreaseFor(level.id, proposedLevelId)
  const recommended = Math.round((band.mid + promotion) * 10) / 10
  const blocking = issues.filter((i) => i.level === 'block')
  const outOfBand = finalRate - promotion < band.min || finalRate - promotion > band.max

  return (
    <Card>
      <CardHeader
        icon={Award}
        title={`${year}년 등급 확정`}
        description={`${employee.name} · 분기 평가 ${annual.count}건 평균 ${annual.score?.toFixed(2) ?? '—'} → 상대평가로 등급을 배분합니다.`}
        right={
          <div className="flex gap-2 no-print">
            {decided ? (
              <Button variant="danger" onClick={onCancelDecision}>
                확정 취소
              </Button>
            ) : null}
            <Button variant="primary" icon={Award} onClick={onApply} disabled={blocking.length > 0}>
              {decided ? '다시 확정' : '이 등급으로 확정'}
            </Button>
          </div>
        }
      />

      {decided ? (
        <div className="border-b border-slate-100 bg-emerald-50/60 px-5 py-3 text-xs text-emerald-900">
          <b>{year}년 등급이 확정되었습니다.</b> 값을 바꾸려면 조정 후 [다시 확정]을 누르세요.
        </div>
      ) : null}

      {/* ── 등급 · 순위 · 직전 대비 ── */}
      <div className="grid gap-2.5 border-b border-slate-100 px-5 py-5 sm:grid-cols-4">
        <div className={`rounded-2xl px-4 py-3.5 ring-1 ${grade.soft}`}>
          <div className="text-[11px] font-medium opacity-70">연간 등급</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{grade.key}</span>
            <span className="text-xs font-medium">{grade.name}</span>
          </div>
          <div className="mt-0.5 text-[11px] opacity-70">
            {cohortSize}명 중 {rank ?? '—'}위
          </div>
        </div>
        <StatTile
          label="연간 점수"
          icon={Trophy}
          value={annual.score != null ? annual.score.toFixed(2) : '—'}
          sub={`${annual.count}개 분기 평균`}
        />
        <StatTile
          label="직전 연도 대비"
          value={
            delta ? `${delta.scoreDelta > 0 ? '+' : ''}${delta.scoreDelta.toFixed(2)}` : '—'
          }
          sub={
            delta
              ? `${delta.scorePct != null ? `${delta.scorePct > 0 ? '+' : ''}${delta.scorePct.toFixed(1)}%` : ''} · ${delta.fromGrade} → ${delta.toGrade}`
              : '직전 확정 기록 없음'
          }
          tone={delta && delta.scoreDelta > 0 ? 'positive' : 'default'}
        />
        <StatTile
          label="확정 인상률"
          icon={Percent}
          value={`${finalRate.toFixed(1)}%`}
          sub={
            delta?.rateDelta != null
              ? `직전 ${delta.fromRate?.toFixed(1)}% 대비 ${delta.rateDelta > 0 ? '+' : ''}${delta.rateDelta.toFixed(1)}%p`
              : '직전 확정 인상률 없음'
          }
          tone="accent"
        />
      </div>

      {/* ── 인상률 산정 ── */}
      <div className="grid gap-4 border-b border-slate-100 px-5 py-5 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl bg-slate-50 px-4 py-3.5">
          <div className="text-[11px] font-medium text-slate-500">추천 인상률 산정</div>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-baseline justify-between">
              <span className="text-slate-600">
                성과 인상 — {grade.key}등급 ({band.min.toFixed(1)}~{band.max.toFixed(1)}%)
              </span>
              <b className="tabular-nums text-slate-900">{band.mid.toFixed(1)}%</b>
            </li>
            <li className="flex items-baseline justify-between">
              <span className="text-slate-600">
                승급 인상{promotion ? ` — ${level.short}→${proposedLevelId}` : ''}
              </span>
              <b className="tabular-nums text-slate-900">
                {promotion ? `+${promotion.toFixed(1)}%` : '0.0%'}
              </b>
            </li>
            <li className="flex items-baseline justify-between border-t border-slate-200 pt-1.5">
              <span className="font-medium text-slate-700">추천 합계</span>
              <b className="tabular-nums text-slate-900">{recommended.toFixed(1)}%</b>
            </li>
          </ul>
          <p className="flex gap-1.5 text-[11px] leading-relaxed text-slate-400">
            <Info size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
            여기까지가 리더의 몫입니다. HR 이 시장 대비 위치(compa-ratio)와 재원을 반영해 실제
            금액을 확정합니다.
          </p>
        </div>

        <div className="space-y-4">
          <Field
            label="승급 검토 (레벨 조정)"
            hint={
              promotion
                ? `승급 시 ${promotion}%p 가 추천 인상률에 더해집니다.`
                : '레벨 변경이 없으면 승급 인상은 0% 입니다.'
            }
          >
            <div className="grid grid-cols-5 gap-1">
              {LEVELS.map((l) => {
                const active = l.id === proposedLevelId
                const current = l.id === level.id
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onProposedLevel(l.id)}
                    title={current ? '현재 레벨' : l.label}
                    className={`rounded-lg px-1 py-1.5 text-center text-[11px] font-semibold transition-colors ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {l.short}
                    {current ? <span className="block text-[9px] font-normal">현재</span> : null}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field
            label="최종 확정 인상률 (%)"
            htmlFor="final-rate"
            hint={
              outOfBand
                ? `⚠ ${grade.key}등급 밴드(${band.min.toFixed(1)}~${band.max.toFixed(1)}%)를 벗어났습니다. 사유 메모가 필요합니다.`
                : `${grade.key}등급 밴드 ${band.min.toFixed(1)}~${band.max.toFixed(1)}% 안입니다.`
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-24 shrink-0">
                <input
                  id="final-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={finalRate}
                  onChange={(e) => onRateChange(Number(e.target.value))}
                  className={`${inputClass} text-right font-semibold tabular-nums`}
                />
              </div>
              <button
                type="button"
                onClick={onApplyRecommended}
                className="whitespace-nowrap rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                추천값 적용
              </button>
              {rateIsAuto ? (
                <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                  자동
                </span>
              ) : null}
              <DeltaBadge delta={delta} show="rate" size="sm" />
            </div>
          </Field>

          <div>
            <input
              type="range"
              className="score-range"
              min={0}
              max={RATE_MAX}
              step={0.1}
              value={Math.min(finalRate, RATE_MAX)}
              onChange={(e) => onRateChange(Number(e.target.value))}
              aria-label="최종 확정 인상률 슬라이더"
              style={{
                '--range-thumb': '#0f172a',
                '--range-track': `linear-gradient(to right, #0f172a ${
                  (Math.min(finalRate, RATE_MAX) / RATE_MAX) * 100
                }%, #e2e8f0 ${(Math.min(finalRate, RATE_MAX) / RATE_MAX) * 100}%)`,
              }}
            />
            {/* 등급 밴드 구간을 눈금으로 */}
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
              {[0, 5, 10, 15, 20].map((n) => (
                <span key={n} className="tabular-nums">
                  {n}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {issues.length ? (
        <ul className="space-y-2 px-5 py-4">
          {issues.map((issue) => (
            <li
              key={issue.code}
              className={`flex gap-2.5 rounded-xl px-3.5 py-3 text-xs ring-1 ${
                issue.level === 'block'
                  ? 'bg-rose-50 text-rose-900 ring-rose-200'
                  : 'bg-amber-50 text-amber-900 ring-amber-200'
              }`}
            >
              {issue.level === 'block' ? (
                <AlertTriangle size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
              ) : (
                <Info size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
              )}
              <span>
                <b className="block">{issue.message}</b>
                <span className="mt-0.5 block leading-relaxed opacity-80">{issue.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 px-5 py-4 text-xs text-slate-400">
          <TrendingUp size={14} strokeWidth={1.75} />
          점검 항목 없음 — 확정할 수 있습니다.
        </div>
      )}
    </Card>
  )
}
