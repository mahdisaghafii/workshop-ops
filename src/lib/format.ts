const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

export function toLatin(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

export function money(n: number): string {
  return `${toFa(new Intl.NumberFormat('en-US').format(Math.round(n)))} تومان`
}

export function moneyShort(n: number): string {
  if (n >= 1_000_000_000) return `${toFa((n / 1_000_000_000).toFixed(1))} میلیارد`
  if (n >= 1_000_000) return `${toFa((n / 1_000_000).toFixed(1))} م`
  if (n >= 1_000) return `${toFa(Math.round(n / 1_000))} هزار`
  return toFa(n)
}

export function num(n: number): string {
  return toFa(new Intl.NumberFormat('en-US').format(n))
}

const dateFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const longDateFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const timeFmt = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function faDate(iso: string | Date): string {
  return dateFmt.format(typeof iso === 'string' ? new Date(iso) : iso)
}

export function faLongDate(iso: string | Date): string {
  return longDateFmt.format(typeof iso === 'string' ? new Date(iso) : iso)
}

export function faTime(iso: string | Date): string {
  return timeFmt.format(typeof iso === 'string' ? new Date(iso) : iso)
}

export function faDateTime(iso: string | Date): string {
  return `${faDate(iso)} - ${faTime(iso)}`
}

export function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function fullName(a: { firstNameFa: string; lastNameFa: string }): string {
  return `${a.firstNameFa} ${a.lastNameFa}`
}

export function fullNameEn(a: { firstNameEn: string; lastNameEn: string }): string {
  return `${a.firstNameEn} ${a.lastNameEn}`
}

export function initials(a: { firstNameFa: string; lastNameFa: string }): string {
  return `${a.firstNameFa.charAt(0)}${a.lastNameFa.charAt(0)}`
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = '\uFEFF' + rows.map((r) => r.map(escape).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
