import { useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { Button, Field, inputClass } from './ui.jsx'
import { BASE_BUDGET, COMPA_BANDS, expectedBudget, meritMatrix } from '../lib/grading.js'
import { LEVELS } from '../data/levels.js'
import { ROLES } from '../data/roles.js'
import { DEFAULT_BANDS, MARKET_MERIT, bandFor } from '../data/market.js'
import { formatNumber, parseNumber } from '../lib/format.js'

/**
 * 보상 정책 설정 — 재원(budget), merit matrix 확인, 레벨별 보상 밴드 편집.
 * 밴드 기본값은 공개 시장 자료 기반 참고치이므로, 회사 실정에 맞게 덮어쓰는 화면이 필요하다.
 */
export default function PolicyDialog({ open, settings, onClose, onSave }) {
  const [budget, setBudget] = useState(settings.budget ?? BASE_BUDGET)
  const [overrides, setOverrides] = useState(settings.bandOverrides ?? {})
  const [tab, setTab] = useState('budget')

  if (!open) return null

  const patchBand = (roleId, levelId, key, value) =>
    setOverrides((prev) => {
      const base = bandFor(roleId, levelId, prev)
      const next = { ...prev }
      next[roleId] = { ...(next[roleId] ?? {}) }
      next[roleId][levelId] = { ...base, [key]: value }
      return next
    })

  const matrix = meritMatrix(budget)
  const expected = expectedBudget(budget)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <button type="button" aria-label="닫기" className="absolute inset-0" onClick={onClose} />
      <div
        className="relative flex max-h-[86vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="보상 정책 설정"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">보상 정책</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              인상 재원과 레벨별 보상 밴드를 회사 실정에 맞춥니다.
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
            { id: 'budget', label: '인상 재원 & 매트릭스' },
            { id: 'bands', label: '레벨별 보상 밴드' },
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
          {tab === 'budget' ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="총 인상 재원 (%)"
                  htmlFor="budget"
                  hint={`권장 분포로 가중한 기대 인상률 ${expected}% — 재원과 비슷해야 정상입니다.`}
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
                <h3 className="text-xs font-semibold text-slate-700">
                  Merit Matrix — 등급 × 시장 대비 위치(compa-ratio)
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  같은 등급이라도 밴드 하단에 있으면 더 크게 올려 시장을 따라잡고, 상단에 있으면
                  적게 올려 밴드를 지킵니다. 재원을 바꾸면 표 전체가 비례해서 조정됩니다.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="px-2 py-2 text-left font-medium">등급</th>
                        {COMPA_BANDS.map((b) => (
                          <th key={b.key} className="px-2 py-2 text-right font-medium">
                            {b.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matrix.map((row) => (
                        <tr key={row.grade.key}>
                          <td className="px-2 py-2">
                            <span
                              className={`inline-grid size-6 place-items-center rounded-lg text-[11px] font-bold ${row.grade.badge}`}
                            >
                              {row.grade.key}
                            </span>
                            <span className="ml-2 text-slate-500">권장 {row.grade.guide}%</span>
                          </td>
                          {row.cells.map((c) => (
                            <td
                              key={c.band.key}
                              className="px-2 py-2 text-right font-semibold tabular-nums text-slate-800"
                            >
                              {c.rate.toFixed(1)}%
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-700">승급 인상률</h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  성과 인상과 별도로 가산됩니다. 레벨이 오르면 담당 범위가 달라지므로 시장 밴드
                  자체가 바뀌기 때문입니다.
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
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] leading-relaxed text-slate-500">
                기본값은 2026년 공개 시장 자료(잡플래닛·원티드랩 연차별 평균, SW기술자 평균임금)로
                만든 참고치입니다. 회사 실정에 맞게 덮어쓰세요. 값을 비우면 기본값으로 돌아갑니다.
              </p>
              {ROLES.map((role) => (
                <div key={role.id} className="rounded-2xl border border-slate-200">
                  <div
                    className={`flex items-center gap-2 rounded-t-2xl px-4 py-2.5 ${role.theme.soft}`}
                  >
                    <span className={`text-xs font-semibold ${role.theme.text}`}>{role.label}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[460px] text-xs">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="px-3 py-2 text-left font-medium">레벨</th>
                          <th className="px-3 py-2 text-right font-medium">하한</th>
                          <th className="px-3 py-2 text-right font-medium">중위</th>
                          <th className="px-3 py-2 text-right font-medium">상한</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {LEVELS.map((l) => {
                          const b = bandFor(role.id, l.id, overrides)
                          return (
                            <tr key={l.id}>
                              <td className="px-3 py-1.5">
                                <span className={`rounded px-1.5 py-0.5 text-[11px] ${l.theme.chip}`}>
                                  {l.short} {l.label}
                                </span>
                              </td>
                              {['min', 'mid', 'max'].map((k) => (
                                <td key={k} className="px-1 py-1.5">
                                  <input
                                    inputMode="numeric"
                                    aria-label={`${role.label} ${l.label} ${k}`}
                                    value={formatNumber(b[k])}
                                    onChange={(e) =>
                                      patchBand(role.id, l.id, k, parseNumber(e.target.value))
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-right text-xs tabular-nums outline-none focus:border-slate-400"
                                  />
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
          <Button
            icon={RotateCcw}
            onClick={() => {
              setBudget(BASE_BUDGET)
              setOverrides({})
            }}
          >
            기본값으로
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose}>취소</Button>
            <Button
              variant="primary"
              onClick={() => onSave({ budget, bandOverrides: pruneOverrides(overrides) })}
            >
              저장
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

/** 기본값과 같은 항목은 저장하지 않는다 — 나중에 기본 밴드를 갱신하면 자동으로 따라오게 */
function pruneOverrides(overrides) {
  const out = {}
  for (const [roleId, byLevel] of Object.entries(overrides ?? {})) {
    for (const [levelId, band] of Object.entries(byLevel ?? {})) {
      const def = DEFAULT_BANDS[roleId]?.[levelId]
      if (!def) continue
      if (band.min === def.min && band.mid === def.mid && band.max === def.max) continue
      out[roleId] = { ...(out[roleId] ?? {}) }
      out[roleId][levelId] = { min: band.min, mid: band.mid, max: band.max }
    }
  }
  return out
}
