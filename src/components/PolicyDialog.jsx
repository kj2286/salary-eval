import { useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { Button, Field, inputClass } from './ui.jsx'
import {
  BASE_BUDGET,
  DEFAULT_DISTRIBUTION,
  DEFAULT_GUARDS,
  GRADES,
  expectedBudget,
  rateTable,
} from '../lib/grading.js'
import { LEVELS } from '../data/levels.js'
import { MARKET_MERIT, HR_CHECKLIST } from '../data/market.js'

const SCOPES = [
  { id: 'all', label: '전체', desc: '조직 전원을 한 집단으로 본다. 10~20명 규모의 기본값.' },
  { id: 'role', label: '직무별', desc: 'PD/FE/BE/AI 를 따로 줄 세운다. 직무당 인원이 적으면 무의미.' },
  { id: 'level', label: '레벨별', desc: '같은 레벨끼리만 비교. 레벨당 인원이 충분할 때만.' },
]

/** 평가·보상 정책 — 상대평가 분포, 절대 가드, 인상 재원. 연봉 금액은 다루지 않는다. */
export default function PolicyDialog({ open, settings, onClose, onSave }) {
  const [budget, setBudget] = useState(settings.budget ?? BASE_BUDGET)
  const [distribution, setDistribution] = useState(settings.distribution ?? DEFAULT_DISTRIBUTION)
  const [guards, setGuards] = useState(settings.guards ?? DEFAULT_GUARDS)
  const [relative, setRelative] = useState(settings.relative !== false)
  const [scope, setScope] = useState(settings.relativeScope ?? 'all')
  const [tab, setTab] = useState('grading')

  if (!open) return null

  const sum = GRADES.reduce((acc, g) => acc + Number(distribution[g.key] ?? 0), 0)
  const expected = expectedBudget(budget, distribution)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <button type="button" aria-label="닫기" className="absolute inset-0" onClick={onClose} />
      <div
        className="relative flex max-h-[86vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="평가 정책 설정"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">평가 정책</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              등급 배분 방식과 인상 재원을 회사 실정에 맞춥니다. 연봉 금액은 다루지 않습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <nav className="flex gap-1 border-b border-slate-100 px-5 py-2">
          {[
            { id: 'grading', label: '등급 배분' },
            { id: 'rate', label: '인상률 · 재원' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tab === 'grading' ? (
            <div className="space-y-5">
              <Field
                label="배분 방식"
                hint="상대평가는 집단 내 순위로 등급을 배분합니다. 절대평가는 점수 컷오프만 씁니다."
              >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: true, label: '상대평가', desc: '순위 기반 분포 배분' },
                    { v: false, label: '절대평가', desc: '점수 컷오프 고정' },
                  ].map((o) => (
                    <button
                      key={String(o.v)}
                      type="button"
                      onClick={() => setRelative(o.v)}
                      className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                        relative === o.v
                          ? 'border-transparent bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-sm font-medium">{o.label}</span>
                      <span
                        className={`block text-[11px] ${relative === o.v ? 'text-slate-300' : 'text-slate-400'}`}
                      >
                        {o.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>

              {relative ? (
                <>
                  <Field label="비교 집단" hint={SCOPES.find((s) => s.id === scope)?.desc}>
                    <div className="grid grid-cols-3 gap-2">
                      {SCOPES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setScope(s.id)}
                          className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                            scope === s.id
                              ? 'border-transparent bg-slate-900 text-white'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field
                    label={`목표 분포 (%) — 합계 ${sum}%`}
                    hint={
                      sum === 100
                        ? '인원수로 환산할 때는 최대잉여법으로 배분하며, 동점자는 반드시 같은 등급을 받습니다.'
                        : '⚠ 합계가 100% 가 아닙니다. 비율대로 환산되므로 의도한 분포와 달라질 수 있습니다.'
                    }
                  >
                    <div className="grid grid-cols-5 gap-2">
                      {GRADES.map((g) => (
                        <label key={g.key} className="block">
                          <span
                            className={`mb-1 grid h-6 place-items-center rounded-lg text-[11px] font-bold ${g.badge}`}
                          >
                            {g.key}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            aria-label={`${g.key}등급 목표 분포`}
                            value={distribution[g.key] ?? 0}
                            onChange={(e) =>
                              setDistribution((prev) => ({
                                ...prev,
                                [g.key]: Number(e.target.value) || 0,
                              }))
                            }
                            className={`${inputClass} text-center font-semibold tabular-nums`}
                          />
                        </label>
                      ))}
                    </div>
                  </Field>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={guards.enabled}
                        onChange={(e) => setGuards((p) => ({ ...p, enabled: e.target.checked }))}
                        className="size-4 rounded border-slate-300"
                      />
                      절대 가드 사용
                    </label>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      순수 상대평가는 전원이 잘한 팀에서도 누군가를 D 로 만듭니다. 절대 점수가
                      기준을 넘으면 분포보다 상식을 앞세웁니다. 가드가 개입한 케이스는
                      캘리브레이션 화면에 표시됩니다.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="하한 — 이 점수 이상은 최소 B" htmlFor="floor">
                        <div className="w-24">
                          <input
                            id="floor"
                            type="number"
                            min={1}
                            max={5}
                            step={0.1}
                            disabled={!guards.enabled}
                            value={guards.floorScore}
                            onChange={(e) =>
                              setGuards((p) => ({ ...p, floorScore: Number(e.target.value) || 0 }))
                            }
                            className={`${inputClass} text-right font-semibold tabular-nums disabled:bg-slate-50`}
                          />
                        </div>
                      </Field>
                      <Field label="상한 — 이 점수 미만은 최대 C" htmlFor="ceil">
                        <div className="w-24">
                          <input
                            id="ceil"
                            type="number"
                            min={1}
                            max={5}
                            step={0.1}
                            disabled={!guards.enabled}
                            value={guards.ceilScore}
                            onChange={(e) =>
                              setGuards((p) => ({ ...p, ceilScore: Number(e.target.value) || 0 }))
                            }
                            className={`${inputClass} text-right font-semibold tabular-nums disabled:bg-slate-50`}
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
                  <b className="block text-slate-900">절대평가 컷오프</b>
                  <span className="mt-1 block tabular-nums">
                    {GRADES.map((g) => `${g.key} ${g.min > 0 ? `${g.min.toFixed(1)}↑` : '미만'}`).join(
                      ' · ',
                    )}
                  </span>
                  <span className="mt-1 block text-slate-400">
                    평가자 관대화를 통제할 장치가 없으므로 소규모 조직에서만 권장합니다.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="총 인상 재원 (%)"
                  htmlFor="budget"
                  hint={`목표 분포로 가중한 기대 인상률 ${expected}% — 재원과 비슷해야 정상입니다.`}
                >
                  <div className="w-32">
                    <input
                      id="budget"
                      type="number"
                      min={0}
                      max={30}
                      step={0.1}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value) || 0)}
                      className={`${inputClass} text-right font-semibold tabular-nums`}
                    />
                  </div>
                </Field>
                <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
                  <b className="block text-slate-900">{MARKET_MERIT.year}년 시장 참고</b>
                  <span className="mt-1 block leading-relaxed">
                    전체 평균 {MARKET_MERIT.overall}% · 대기업 {MARKET_MERIT.large}% · 중견{' '}
                    {MARKET_MERIT.mid}% · 중소 {MARKET_MERIT.small}%
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-400">{MARKET_MERIT.note}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-700">등급별 인상률 밴드</h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  재원을 바꾸면 표 전체가 비례해 조정됩니다. 리더는 이 밴드 안에서 확정하고,
                  시장 대비 위치에 따른 미세조정은 HR 단계에서 이뤄집니다.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="px-2 py-2 text-left font-medium">등급</th>
                        <th className="px-2 py-2 text-right font-medium">하한</th>
                        <th className="px-2 py-2 text-right font-medium">기본</th>
                        <th className="px-2 py-2 text-right font-medium">상한</th>
                        <th className="px-2 py-2 text-right font-medium">목표 분포</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rateTable(budget).map(({ grade, band }) => (
                        <tr key={grade.key}>
                          <td className="px-2 py-2">
                            <span
                              className={`inline-grid size-6 place-items-center rounded-lg text-[11px] font-bold ${grade.badge}`}
                            >
                              {grade.key}
                            </span>
                            <span className="ml-2 text-slate-500">{grade.name}</span>
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums text-slate-500">
                            {band.min.toFixed(1)}%
                          </td>
                          <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-900">
                            {band.mid.toFixed(1)}%
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums text-slate-500">
                            {band.max.toFixed(1)}%
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums text-slate-500">
                            {distribution[grade.key] ?? grade.guide}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-700">승급 인상률</h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  성과 인상과 별도로 가산됩니다. 레벨이 오르면 담당 범위 자체가 달라지기 때문입니다.
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {LEVELS.filter((l) => l.promotionFrom).map((l) => (
                    <li
                      key={l.id}
                      className="rounded-xl bg-slate-50 px-3 py-2 text-xs tabular-nums text-slate-600"
                    >
                      {l.promotionFrom} → {l.id}{' '}
                      <b className="text-slate-900">+{l.promotionIncrease}%</b>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 p-4">
                <h3 className="text-xs font-semibold text-slate-700">
                  HR 이 실제 금액을 확정할 때 확인할 것
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  이 앱은 아래를 계산하지 않습니다. 연봉 금액을 저장하지 않기 때문입니다.
                </p>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                  {HR_CHECKLIST.map((c) => (
                    <li key={c} className="flex gap-1.5">
                      <span className="text-slate-300">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
          <Button
            icon={RotateCcw}
            onClick={() => {
              setBudget(BASE_BUDGET)
              setDistribution(DEFAULT_DISTRIBUTION)
              setGuards(DEFAULT_GUARDS)
              setRelative(true)
              setScope('all')
            }}
          >
            기본값으로
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose}>취소</Button>
            <Button
              variant="primary"
              onClick={() =>
                onSave({ budget, distribution, guards, relative, relativeScope: scope })
              }
            >
              저장
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
