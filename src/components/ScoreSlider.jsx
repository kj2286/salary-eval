import { SCORE_LABELS } from '../data/roles.js'

const MIN = 1
const MAX = 5

/** 항목 1개의 점수 입력 — 슬라이더 + 숫자 입력이 같은 값을 공유한다 */
export default function ScoreSlider({ criterion, index, value, accent, onChange }) {
  const score = Number(value) || MIN
  const percent = ((score - MIN) / (MAX - MIN)) * 100
  const inputId = `score-${criterion.id}`

  const setScore = (raw) => {
    const n = Number(raw)
    if (Number.isNaN(n)) return
    onChange(Math.min(MAX, Math.max(MIN, Math.round(n))))
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={inputId} className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-slate-900">{criterion.label}</span>
          </span>
          <span className="mt-1 block pl-7 text-xs text-slate-400">{criterion.hint}</span>
        </label>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className="rounded-lg px-2 py-1 text-xs font-medium"
            style={{ backgroundColor: `${accent}14`, color: accent }}
          >
            {SCORE_LABELS[score]}
          </span>
          <input
            type="number"
            min={MIN}
            max={MAX}
            step={1}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            aria-label={`${criterion.label} 점수 직접 입력`}
            className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm font-semibold tabular-nums outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <div className="mt-3 pl-7">
        <input
          id={inputId}
          type="range"
          className="score-range"
          min={MIN}
          max={MAX}
          step={1}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          style={{
            '--range-thumb': accent,
            '--range-track': `linear-gradient(to right, ${accent} ${percent}%, #e2e8f0 ${percent}%)`,
          }}
        />
        <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n === score ? 'font-semibold text-slate-600' : undefined}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
