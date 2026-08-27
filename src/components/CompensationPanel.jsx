import { AlertTriangle, ArrowUpRight, Coins, Info, TrendingUp, Wallet } from 'lucide-react'
import { Button, Card, CardHeader, Field, StatTile, inputClass } from './ui.jsx'
import { formatKoreanWon, formatNumber, formatWon, parseNumber } from '../lib/format.js'
import { calcSalary, compaBandOf, compaRatio, meritRate } from '../lib/grading.js'
import { LEVELS, promotionIncreaseFor } from '../data/levels.js'

const RATE_MAX = 20

/**
 * 연간 보상 확정 화면.
 *
 * 예전 버전은 분기마다 이 화면이 떠서 분기마다 연봉을 올릴 수 있었다.
 * 분기 4회 × 5% 를 명부에 반영하면 연 21.6%(복리)가 된다. 그래서 보상 확정은
 * 연 1회로 못박고, 분기 평가는 여기 들어오는 입력값으로만 쓴다.
 */
export default function CompensationPanel({
  year,
  employee,
  baseSalary,
  decided,
  level,
  proposedLevelId,
  band,
  targetBand,
  annual,
  budget,
  finalRate,
  rateIsAuto,
  issues,
  onSalaryChange,
  onProposedLevel,
  onRateChange,
  onApplyRecommended,
  onApply,
  onCancelDecision,
}) {
  const gradeKey = annual.grade?.key ?? 'B'
  const compa = compaRatio(baseSalary, band)
  const compaBand = compaBandOf(compa)
  const merit = meritRate(gradeKey, compa, budget)
  const promotion = promotionIncreaseFor(level.id, proposedLevelId)
  const recommended = Math.round((merit + promotion) * 10) / 10

  const { raiseAmount, newSalary, monthlyGross, monthlyBefore } = calcSalary(
    baseSalary,
    finalRate,
  )
  const monthlyDiff = monthlyGross - monthlyBefore
  const nextCompa = compaRatio(newSalary, band)
  const promoted = promotion > 0
  const landingBand = targetBand ?? band
  const landingCompa = compaRatio(newSalary, landingBand)
  const blocking = issues.filter((i) => i.level === 'block')

  return (
    <Card>
      <CardHeader
        icon={Coins}
        title={`${year}년 보상 확정`}
        description={`${employee.name} · 연간 등급 ${gradeKey} (${annual.count}개 분기 평균 ${annual.score?.toFixed(2) ?? '—'}) × 시장 대비 위치로 산정합니다.`}
        right={
          <div className="flex gap-2 no-print">
            {decided ? (
              <Button variant="danger" onClick={onCancelDecision}>
                확정 취소
              </Button>
            ) : null}
            <Button
              variant="primary"
              icon={Wallet}
              onClick={onApply}
              disabled={blocking.length > 0}
            >
              {decided ? '다시 확정' : '확정하고 명부에 반영'}
            </Button>
          </div>
        }
      />

      {/* ── 밴드 내 위치 ── */}
      {decided ? (
        <div className="border-b border-slate-100 bg-emerald-50/60 px-5 py-3 text-xs text-emerald-900">
          <b>{year}년 보상은 이미 확정되었습니다.</b> 아래 계산은 확정 시점의 기준 연봉(
          {formatKoreanWon(baseSalary)})을 그대로 씁니다 — 같은 해에 인상이 복리로 얹히지 않습니다.
          금액을 바꾸려면 값을 조정한 뒤 [다시 확정]을 누르세요.
        </div>
      ) : null}

      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <TrendingUp size={14} strokeWidth={1.75} />
            {level.short} {level.label} 보상 밴드 내 위치
            <span className="font-normal text-slate-400">— 성과 인상 산정 기준</span>
          </span>
          <span className="text-xs text-slate-500">
            compa-ratio{' '}
            <b className="tabular-nums text-slate-900">
              {compa != null ? `${(compa * 100).toFixed(0)}%` : '—'}
            </b>{' '}
            · {compaBand.label} 구간
          </span>
        </div>

        <BandGauge band={band} current={employee.currentSalary} next={newSalary} />

        <p className="mt-2 text-[11px] text-slate-400">{compaBand.desc}</p>

        {promoted ? (
          <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-[11px] text-slate-600 ring-1 ring-slate-200">
            <b className="text-slate-900">승급 후 {proposedLevelId} 밴드 착지점</b>
            <span className="ml-1 tabular-nums">
              하한 {formatKoreanWon(landingBand.min)} · 중위 {formatKoreanWon(landingBand.mid)} —
              조정 후 {formatKoreanWon(newSalary)} (compa{' '}
              {landingCompa != null ? `${(landingCompa * 100).toFixed(0)}%` : '—'})
            </span>
            <span className="mt-1 block text-slate-400">
              성과 인상은 현재 레벨({level.short}) 밴드로 계산합니다. 승급 후 밴드로 계산하면 레벨
              상승이 성과 인상과 승급 인상에 이중으로 반영됩니다.
            </span>
          </div>
        ) : null}
      </div>

      {/* ── 인상률 산정 근거 ── */}
      <div className="grid gap-4 border-b border-slate-100 px-5 py-5 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl bg-slate-50 px-4 py-3.5">
          <div className="text-[11px] font-medium text-slate-500">추천 인상률 산정</div>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-baseline justify-between">
              <span className="text-slate-600">
                성과 인상 (merit) — {gradeKey}등급 × {compaBand.label}
              </span>
              <b className="tabular-nums text-slate-900">{merit.toFixed(1)}%</b>
            </li>
            <li className="flex items-baseline justify-between">
              <span className="text-slate-600">
                승급 인상 (promotion)
                {promotion ? ` — ${level.short}→${proposedLevelId}` : ''}
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
          <p className="text-[11px] text-slate-400">
            성과 인상과 승급 인상을 분리해 두면 본인에게 "무엇 때문에 올랐는지" 를 설명할 수
            있습니다.
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
              Math.abs(finalRate - recommended) < 0.05
                ? '추천값과 동일합니다.'
                : `추천값 ${recommended.toFixed(1)}% 와 다릅니다. 사유를 메모에 남기세요.`
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
            </div>
          </Field>

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
        </div>
      </div>

      {/* ── 결과 ── */}
      <div className="grid gap-2.5 px-5 py-5 sm:grid-cols-4">
        <StatTile
          label="인상 금액"
          icon={ArrowUpRight}
          value={formatWon(raiseAmount)}
          sub={`현재 연봉 × ${finalRate.toFixed(1)}%`}
          tone="positive"
        />
        <StatTile
          label="조정 후 연봉"
          icon={Wallet}
          value={formatWon(newSalary)}
          sub={formatKoreanWon(newSalary)}
          tone="accent"
        />
        <StatTile
          label="월 지급액 (세전)"
          value={formatWon(monthlyGross)}
          sub={`월 ${monthlyDiff >= 0 ? '+' : ''}${formatNumber(monthlyDiff)}원`}
        />
        <StatTile
          label="조정 후 compa"
          value={nextCompa != null ? `${(nextCompa * 100).toFixed(0)}%` : '—'}
          sub={`${compa != null ? (compa * 100).toFixed(0) : '—'}% → ${nextCompa != null ? (nextCompa * 100).toFixed(0) : '—'}%`}
        />
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <Field
          label={decided ? '확정 기준 연봉 (원)' : '현재 연봉 (원)'}
          htmlFor="current-salary"
          hint={
            decided
              ? `${formatKoreanWon(baseSalary)} · 확정 시점 금액으로 고정됩니다. 바꾸려면 확정을 취소하세요.`
              : `${formatKoreanWon(baseSalary)} · 수정하면 명부의 현재 연봉도 함께 바뀝니다`
          }
        >
          <div className="relative max-w-xs">
            <input
              id="current-salary"
              inputMode="numeric"
              readOnly={decided}
              value={baseSalary ? formatNumber(baseSalary) : ''}
              onChange={(e) => onSalaryChange(parseNumber(e.target.value))}
              className={`${inputClass} pr-8 text-right font-semibold tabular-nums ${
                decided ? 'bg-slate-50 text-slate-500' : ''
              }`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              원
            </span>
          </div>
        </Field>
      </div>

      {issues.length ? (
        <ul className="space-y-2 border-t border-slate-100 px-5 py-4">
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
      ) : null}
    </Card>
  )
}

/** 밴드 min~max 위에 현재 연봉과 조정 후 연봉을 찍는다 */
function BandGauge({ band, current, next }) {
  const span = Math.max(1, band.max - band.min)
  const pos = (v) => Math.min(104, Math.max(-4, ((v - band.min) / span) * 100))
  const midPos = pos(band.mid)

  return (
    <div className="mt-4">
      <div className="relative h-9">
        <div className="absolute inset-x-0 top-3.5 h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-amber-100 via-emerald-100 to-sky-100">
          <div
            className="h-full bg-slate-900/80"
            style={{ width: `${Math.max(0, Math.min(100, pos(current)))}%` }}
          />
        </div>
        {/* 중위값 눈금 */}
        <div
          className="absolute top-2 h-6 w-px bg-slate-400"
          style={{ left: `${midPos}%` }}
          title="밴드 중위값"
        />
        {/* 조정 후 위치 */}
        {next !== current ? (
          <div
            className="absolute top-2.5 size-4 -translate-x-1/2 rounded-full border-2 border-emerald-500 bg-white"
            style={{ left: `${pos(next)}%` }}
            title={`조정 후 ${formatKoreanWon(next)}`}
          />
        ) : null}
        <div
          className="absolute top-2.5 size-4 -translate-x-1/2 rounded-full border-2 border-slate-900 bg-slate-900"
          style={{ left: `${pos(current)}%` }}
          title={`현재 ${formatKoreanWon(current)}`}
        />
      </div>
      <div className="flex justify-between text-[11px] tabular-nums text-slate-400">
        <span>하한 {formatKoreanWon(band.min)}</span>
        <span className="text-slate-500">중위 {formatKoreanWon(band.mid)}</span>
        <span>상한 {formatKoreanWon(band.max)}</span>
      </div>
    </div>
  )
}
