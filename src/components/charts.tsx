import { useId } from 'react'
import { num, toFa } from '../lib/format'

export const PALETTE = ['#4f46e5', '#0f9d76', '#d97706', '#0284c7', '#e11d48', '#7c3aed', '#64748b', '#14b8a6']

export function Donut({
  data,
  centerValue,
  centerLabel,
  size = 148,
  colors = PALETTE,
}: {
  data: { label: string; value: number }[]
  centerValue?: string
  centerLabel?: string
  size?: number
  colors?: string[]
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = 38
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#eef1f7" strokeWidth="13" />
          {total > 0 &&
            data.map((d, i) => {
              const len = (d.value / total) * c
              const el = (
                <circle
                  key={d.label}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={colors[i % colors.length]}
                  strokeWidth="13"
                  strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              )
              offset += len
              return el
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-extrabold text-ink-900 num">{centerValue ?? num(total)}</span>
          <span className="text-[10.5px] text-ink-400">{centerLabel ?? 'نفر'}</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-[12px]">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: colors[i % colors.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-600">{d.label}</span>
            <span className="font-semibold text-ink-800 num">{num(d.value)}</span>
            <span className="w-9 text-left text-[11px] text-ink-400 num">
              {total ? toFa(Math.round((d.value / total) * 100)) : toFa(0)}٪
            </span>
          </li>
        ))}
        {data.length === 0 && <li className="text-[12px] text-ink-400">داده‌ای ثبت نشده است.</li>}
      </ul>
    </div>
  )
}

export function AreaChart({
  points,
  valueLabel,
  color = '#4f46e5',
  height = 150,
}: {
  points: { label: string; value: number }[]
  valueLabel?: string
  color?: string
  height?: number
}) {
  const id = useId().replace(/[:]/g, '')
  const w = 640
  const h = 180
  const padY = 18
  const max = Math.max(1, ...points.map((p) => p.value))
  const step = points.length > 1 ? w / (points.length - 1) : w
  const coords = points.map((p, i) => {
    const x = i * step
    const y = h - padY - (p.value / max) * (h - padY * 2)
    return { x, y, ...p }
  })
  const line = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ height }} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="0"
            x2={w}
            y1={padY + (h - padY * 2) * t}
            y2={padY + (h - padY * 2) * t}
            stroke="#eef1f7"
            strokeDasharray="4 5"
          />
        ))}
        <path d={area} fill={`url(#g${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="3.2" fill="#fff" stroke={color} strokeWidth="2" />
            <title>{`${p.label}: ${num(p.value)}`}</title>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between gap-1 overflow-hidden text-[10.5px] text-ink-400 num">
        {points
          .filter((_, i) => i % Math.ceil(points.length / 7) === 0 || i === points.length - 1)
          .map((p, i) => (
            <span key={p.label} className={i % 2 === 1 ? 'hidden sm:inline' : ''}>
              {p.label}
            </span>
          ))}
      </div>
      {valueLabel && <div className="mt-1 text-[11px] text-ink-400">{valueLabel}</div>}
    </div>
  )
}

export function BarChart({
  points,
  color = '#4f46e5',
  height = 140,
}: {
  points: { label: string; value: number }[]
  color?: string
  height?: number
}) {
  const max = Math.max(1, ...points.map((p) => p.value))
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {points.map((p) => (
          <div key={p.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-semibold text-ink-500 opacity-0 transition group-hover:opacity-100 num">
              {num(p.value)}
            </span>
            <div
              className="w-full rounded-md transition-all group-hover:opacity-80"
              style={{
                height: `${Math.max(2, (p.value / max) * 100)}%`,
                background: color,
                opacity: p.value ? 0.9 : 0.15,
              }}
              title={`${p.label}: ${num(p.value)}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ink-400 num">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  )
}

export function HorizontalBars({
  data,
  colors = PALETTE,
}: {
  data: { label: string; value: number }[]
  colors?: string[]
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="text-ink-600">{d.label}</span>
            <span className="font-semibold text-ink-800 num">{num(d.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: colors[i % colors.length] }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
