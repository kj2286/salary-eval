import ScoreSlider from './ScoreSlider.jsx'
import { anchorFor } from '../data/roles.js'

/**
 * 도메인(성과/전문성/협업/리더십)별로 묶어 문항을 렌더한다.
 * 헤더에 가중치를 박아두는 이유: 평가자가 "이 도메인이 최종 점수의 몇 %인지" 를
 * 모르고 점수를 주면 가중 채점의 의미가 없다.
 */
export default function CriteriaGroups({ groups, scores, level, accent, onChange }) {
  let index = 0

  return (
    <div className="divide-y divide-slate-100">
      {groups.map((group) => {
        const meta = group.domain
        return (
          <section key={meta.id}>
            <header className="flex flex-wrap items-baseline gap-2 bg-slate-50/70 px-5 py-2.5">
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${meta.theme.soft}`}>
                {meta.label}
              </span>
              <span className="text-[11px] font-semibold tabular-nums text-slate-700">
                최종 점수의 {group.weight}%
              </span>
              <span className="text-[11px] text-slate-400">{meta.desc}</span>
            </header>
            <div className="divide-y divide-slate-100">
              {group.criteria.map((criterion) => {
                const i = index
                index += 1
                return (
                  <ScoreSlider
                    key={criterion.id}
                    criterion={criterion}
                    index={i}
                    value={scores[criterion.id] ?? 3}
                    accent={accent}
                    anchor={anchorFor(criterion, level.id)}
                    onChange={(v) => onChange(criterion.id, v)}
                  />
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
