import { Layers, Target } from 'lucide-react'
import { LEVELS } from '../data/levels.js'

/**
 * 선택된 직원의 레벨과 그 레벨의 기대치를 항상 눈에 보이게 둔다.
 * 평가자가 "이 사람 기준이 뭐였지" 를 매번 기억해내지 않아도 되게 하는 것이 목적.
 */
export default function LevelPanel({ level, onChange, readOnly }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Layers size={14} strokeWidth={1.75} />
          커리어 레벨
        </span>
        <span className="text-[11px] text-slate-400">{level.radford}</span>
      </div>

      {/* 레벨 선택 — 승급/강등은 여기서 바로 바꾸지 않고 연간 확정 화면에서 처리한다 */}
      <div className="mt-3 grid grid-cols-5 gap-1">
        {LEVELS.map((l) => {
          const active = l.id === level.id
          return (
            <button
              key={l.id}
              type="button"
              disabled={readOnly}
              onClick={() => onChange?.(l.id)}
              title={`${l.label} · ${l.years}`}
              className={`rounded-lg px-1 py-1.5 text-center transition-colors disabled:cursor-default ${
                active ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[11px] font-bold">{l.short}</span>
              <span className={`block text-[9px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                {l.label}
              </span>
            </button>
          )
        })}
      </div>

      <dl className="mt-4 space-y-2.5 text-xs">
        <Row term="영향 범위" desc={level.scope} />
        <Row term="모호함" desc={level.ambiguity} />
        <Row term="책임" desc={level.accountability} />
      </dl>

      <div className="mt-3 rounded-xl bg-slate-900 px-3.5 py-3 text-white">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
          <Target size={12} strokeWidth={2} />이 레벨에서 "3점 = 기대 충족"의 의미
        </div>
        <p className="mt-1 text-xs leading-relaxed">{level.anchor}</p>
      </div>

      <p className="mt-2.5 text-[11px] text-slate-400">
        연차 참고 {level.years} — 연차는 승급 조건이 아니라 힌트입니다. 레벨은 하는 일의 범위로
        정합니다.
      </p>
    </div>
  )
}

function Row({ term, desc }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 font-medium text-slate-400">{term}</dt>
      <dd className="text-slate-600">{desc}</dd>
    </div>
  )
}
