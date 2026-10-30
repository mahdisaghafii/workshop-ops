import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Inbox } from 'lucide-react'
import { initials } from '../lib/format'

export function PageHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: string
  description?: string
  actions?: ReactNode
  badge?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">{title}</h1>
            {badge}
          </div>
          {description && <p className="mt-1 text-[13px] leading-6 text-ink-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = 'p-5',
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            {title && <h2 className="text-[14.5px] font-bold text-ink-800">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12px] text-ink-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

const statTones = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-emerald-50 text-success',
  warning: 'bg-amber-50 text-warning',
  info: 'bg-sky-50 text-info',
  rose: 'bg-rose-50 text-danger',
} as const

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
}: {
  label: string
  value: string
  hint?: string
  icon: ReactNode
  tone?: keyof typeof statTones
}) {
  return (
    <div className="card card-pad flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-ink-500">{label}</div>
        <div className="mt-1.5 text-[19px] font-extrabold leading-snug tracking-tight text-ink-900 num">
          {value}
        </div>
        {hint && <div className="mt-1 text-[11.5px] text-ink-400">{hint}</div>}
      </div>
      <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${statTones[tone]}`}>
        {icon}
      </div>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-xl',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative w-full ${width} overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-bold text-ink-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[12px] text-ink-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            aria-label="بستن"
          >
            <X size={17} />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-ink-50 text-ink-400">
        {icon ?? <Inbox size={22} />}
      </div>
      <div className="text-[13.5px] font-semibold text-ink-700">{title}</div>
      {description && <div className="max-w-sm text-[12.5px] leading-6 text-ink-400">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Avatar({
  name,
  size = 'md',
}: {
  name: { firstNameFa: string; lastNameFa: string }
  size?: 'sm' | 'md' | 'lg'
}) {
  const cls = size === 'sm' ? 'size-8 text-[11px]' : size === 'lg' ? 'size-12 text-[14px]' : 'size-9 text-[12px]'
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-brand-50 font-bold text-brand-600 ${cls}`}
    >
      {initials(name)}
    </span>
  )
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'success' | 'warning' }) {
  const color = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-brand-500'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={17} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="field pr-10"
      />
    </div>
  )
}

/**
 * Scales fixed-size artwork (a badge, a certificate) down to whatever room the
 * preview column has, without touching the artwork itself — the printed copy is
 * rendered separately at full size.
 */
export function FitBox({
  width,
  height,
  children,
  className = '',
}: {
  width: number
  height: number
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / width))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  return (
    <div ref={ref} className={`overflow-hidden ${className}`} style={{ height: height * scale }}>
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top right',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function StatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'brand'
  children: ReactNode
}) {
  const map = {
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    neutral: 'bg-ink-100 text-ink-500',
    brand: 'bg-brand-50 text-brand-700',
  }
  return (
    <span className={`chip ${map[tone]}`}>
      <span
        className={`size-1.5 rounded-full ${
          tone === 'success'
            ? 'bg-emerald-500'
            : tone === 'warning'
              ? 'bg-amber-500'
              : tone === 'danger'
                ? 'bg-rose-500'
                : tone === 'brand'
                  ? 'bg-brand-500'
                  : 'bg-ink-400'
        }`}
      />
      {children}
    </span>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-[13px] text-ink-700"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-ink-300'}`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
            checked ? 'right-0.5' : 'right-[18px]'
          }`}
        />
      </span>
      {label}
    </button>
  )
}
