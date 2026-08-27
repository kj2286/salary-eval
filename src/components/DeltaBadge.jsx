import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { GRADE_MAP } from '../lib/grading.js'

/**
 * 직전 대비 변화 표시.
 * 사람들이 실제로 궁금해하는 건 절대 점수가 아니라 "지난번보다 나아졌나" 다.
 */
export default function DeltaBadge({ delta, size = 'md', show = 'score' }) {
  if (!delta) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
        <Minus size={11} strokeWidth={2} />
        직전 기록 없음
      </span>
    )
  }

  const value =
    show === 'rate' ? delta.rateDelta : show === 'grade' ? delta.gradeMove : delta.scoreDelta
  const up = Number(value) > 0
  const flat = Number(value) === 0 || value == null
  const tone = flat
    ? 'bg-slate-100 text-slate-500'
    : up
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-rose-50 text-rose-700'
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'

  let text = ''
  if (show === 'score') {
    const pct = delta.scorePct
    text = `${up ? '+' : ''}${delta.scoreDelta.toFixed(2)}${pct != null ? ` (${up ? '+' : ''}${pct.toFixed(1)}%)` : ''}`
  } else if (show === 'rate') {
    text = delta.rateDelta == null ? '—' : `${up ? '+' : ''}${delta.rateDelta.toFixed(1)}%p`
  } else {
    text = flat ? '등급 유지' : `${delta.fromGrade} → ${delta.toGrade}`
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-medium tabular-nums ${tone} ${pad}`}
      title={
        delta.label
          ? `직전(${delta.label}) 대비`
          : `직전 대비 · 점수 ${delta.scoreDelta > 0 ? '+' : ''}${delta.scoreDelta.toFixed(2)}`
      }
    >
      <Icon size={size === 'sm' ? 10 : 12} strokeWidth={2.25} />
      {text}
    </span>
  )
}

/** 등급 변화를 배지 두 개로 — 표 안에서 쓴다 */
export function GradeMove({ delta }) {
  if (!delta || delta.gradeMove == null) return <span className="text-slate-300">—</span>
  if (delta.gradeMove === 0)
    return <span className="text-[11px] text-slate-400">유지</span>
  const from = GRADE_MAP[delta.fromGrade]
  const to = GRADE_MAP[delta.toGrade]
  const up = delta.gradeMove > 0
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`grid size-5 place-items-center rounded text-[10px] font-bold ${from.badge} opacity-50`}>
        {from.key}
      </span>
      {up ? (
        <ArrowUpRight size={11} strokeWidth={2.5} className="text-emerald-600" />
      ) : (
        <ArrowDownRight size={11} strokeWidth={2.5} className="text-rose-600" />
      )}
      <span className={`grid size-5 place-items-center rounded text-[10px] font-bold ${to.badge}`}>
        {to.key}
      </span>
    </span>
  )
}
