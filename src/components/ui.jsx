/** 공용 프리미티브 — 카드 / 섹션 헤더 / 버튼 / 지표 타일 */

export function Card({ className = '', children }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)] ${className}`}
    >
      {children}
    </section>
  )
}

export function CardHeader({ icon: Icon, title, description, right }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-white">
            <Icon size={18} strokeWidth={1.75} />
          </span>
        ) : null}
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      {right}
    </header>
  )
}

const BUTTON_VARIANTS = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
  danger: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
}

export function Button({
  variant = 'outline',
  icon: Icon,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={16} strokeWidth={1.75} /> : null}
      {children}
    </button>
  )
}

export function Field({ label, hint, children, htmlFor }) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-300'

export function StatTile({ label, value, sub, tone = 'default', icon: Icon }) {
  const tones = {
    default: 'bg-slate-50 text-slate-900',
    accent: 'bg-slate-900 text-white',
    positive: 'bg-emerald-50 text-emerald-900',
  }
  const subTones = {
    default: 'text-slate-500',
    accent: 'text-slate-300',
    positive: 'text-emerald-600',
  }
  return (
    <div className={`rounded-2xl px-4 py-3.5 ${tones[tone]}`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${subTones[tone]}`}>
        {Icon ? <Icon size={13} strokeWidth={1.75} /> : null}
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub ? <div className={`mt-0.5 text-[11px] ${subTones[tone]}`}>{sub}</div> : null}
    </div>
  )
}
