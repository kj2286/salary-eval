import { ArrowUpRight, CalendarDays, Coins, Wallet } from 'lucide-react'
import { Button, Card, CardHeader, Field, StatTile, inputClass } from './ui.jsx'
import { formatKoreanWon, formatNumber, formatWon, parseNumber } from '../lib/format.js'
import { calcSalary, rateRangeText } from '../lib/grading.js'

const RATE_MAX = 15

/** 현재 연봉 + 최종 확정 인상률 → 인상금액 / 조정 후 연봉 / 월 수령액(세전) */
export default function SalaryPanel({
  currentSalary,
  finalRate,
  grade,
  rateIsAuto,
  employeeName,
  onSalaryChange,
  onRateChange,
  onApplyRecommended,
  onApplyToRoster,
}) {
  const { raiseAmount, newSalary, monthlyGross, monthlyBefore } = calcSalary(
    currentSalary,
    finalRate,
  )
  const monthlyDiff = monthlyGross - monthlyBefore
  const inRange = finalRate >= grade.rateMin && (grade.openEnded || finalRate <= grade.rateMax)

  return (
    <Card>
      <CardHeader
        icon={Coins}
        title="연봉 산정"
        description={
          employeeName
            ? `${employeeName} · 추천 범위를 참고해 최종 인상률을 확정하세요.`
            : '추천 범위를 참고해 최종 인상률을 확정하세요.'
        }
        right={
          onApplyToRoster ? (
            <Button icon={Wallet} onClick={onApplyToRoster} className="no-print">
              조정 후 연봉을 명부에 반영
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
        <Field
          label="현재 연봉 (원)"
          htmlFor="current-salary"
          hint={`${formatKoreanWon(currentSalary)} · 수정하면 명부의 현재 연봉도 함께 바뀝니다`}
        >
          <div className="relative">
            <input
              id="current-salary"
              inputMode="numeric"
              value={currentSalary ? formatNumber(currentSalary) : ''}
              onChange={(e) => onSalaryChange(parseNumber(e.target.value))}
              placeholder="40,000,000"
              className={`${inputClass} pr-8 text-right font-semibold tabular-nums`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              원
            </span>
          </div>
        </Field>

        <Field
          label="최종 확정 인상률 (%)"
          htmlFor="final-rate"
          hint={
            inRange
              ? `${grade.key}등급 추천 범위(${rateRangeText(grade)}) 안입니다.`
              : `⚠ ${grade.key}등급 추천 범위(${rateRangeText(grade)})를 벗어났습니다.`
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            {/* inputClass 의 w-full 을 이기려면 래퍼로 폭을 잡아야 한다 */}
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

        <div className="sm:col-span-2">
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
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
            {[0, 3, 5, 8, 10, 15].map((n) => (
              <span key={n}>{n}%</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 border-t border-slate-100 px-5 py-5 sm:grid-cols-3">
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
          label="예상 월 수령액 (세전)"
          icon={CalendarDays}
          value={formatWon(monthlyGross)}
          sub={`월 ${monthlyDiff >= 0 ? '+' : ''}${formatNumber(monthlyDiff)}원`}
        />
      </div>
    </Card>
  )
}
