import type { AppState, Attendee, PaymentMethod } from './types'
import { addDays, dayKey, faDate, todayKey } from './format'

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  pos: 'کارت‌خوان (POS)',
  cash: 'نقد',
  card: 'کارت‌به‌کارت',
}

export const METHOD_SHORT: Record<PaymentMethod, string> = {
  pos: 'POS',
  cash: 'نقد',
  card: 'کارت‌به‌کارت',
}

export function totalRevenue(state: AppState): number {
  return state.attendees.reduce(
    (sum, a) => sum + a.payments.reduce((s, p) => s + p.amount, 0),
    0,
  )
}

export function revenueByMethod(state: AppState): Record<PaymentMethod, number> {
  const out: Record<PaymentMethod, number> = { pos: 0, cash: 0, card: 0 }
  for (const a of state.attendees) for (const p of a.payments) out[p.method] += p.amount
  return out
}

export function attendeeTotal(state: AppState, a: Attendee): number {
  const role = state.roles.find((r) => r.id === a.roleId)
  const meal = state.meals.find((m) => m.id === a.mealId)
  const workshops = a.workshopIds.reduce(
    (s, id) => s + (state.workshops.find((w) => w.id === id)?.price ?? 0),
    0,
  )
  return Math.max(0, (role?.price ?? 0) + (meal?.price ?? 0) + workshops - a.discount)
}

export function attendeePaid(a: Attendee): number {
  return a.payments.reduce((s, p) => s + p.amount, 0)
}

export function groupCount<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, number>()
  for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1)
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export function roleBreakdown(state: AppState) {
  return groupCount(state.attendees, (a) => state.roles.find((r) => r.id === a.roleId)?.title ?? '—')
}

export function provinceBreakdown(state: AppState) {
  return groupCount(state.attendees, (a) => a.province)
}

export function specialtyBreakdown(state: AppState) {
  return groupCount(state.attendees, (a) => a.specialty)
}

export function genderBreakdown(state: AppState) {
  return groupCount(state.attendees, (a) => (a.gender === 'male' ? 'آقا' : 'خانم'))
}

export type DayPoint = { key: string; label: string; count: number; revenue: number }

export function dailySeries(state: AppState, days = 14): DayPoint[] {
  const points: DayPoint[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i)
    const key = todayKey(d)
    points.push({ key, label: faDate(d), count: 0, revenue: 0 })
  }
  const index = new Map(points.map((p) => [p.key, p]))
  for (const a of state.attendees) {
    const p = index.get(dayKey(a.registeredAt))
    if (p) p.count++
    for (const pay of a.payments) {
      const rp = index.get(dayKey(pay.date))
      if (rp) rp.revenue += pay.amount
    }
  }
  return points
}

export type CashRow = {
  key: string
  label: string
  count: number
  pos: number
  cash: number
  card: number
  total: number
}

export function cashByDay(state: AppState): CashRow[] {
  const map = new Map<string, CashRow>()
  for (const a of state.attendees) {
    for (const p of a.payments) {
      const key = dayKey(p.date)
      let row = map.get(key)
      if (!row) {
        row = { key, label: faDate(p.date), count: 0, pos: 0, cash: 0, card: 0, total: 0 }
        map.set(key, row)
      }
      row.count++
      row[p.method] += p.amount
      row.total += p.amount
    }
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1))
}

export function foodToday(state: AppState) {
  const key = todayKey()
  const delivered = state.attendees.filter(
    (a) => a.foodDeliveredAt && dayKey(a.foodDeliveredAt) === key,
  )
  return {
    delivered: delivered.length,
    pending: state.attendees.filter((a) => !!a.mealId && !a.foodDeliveredAt).length,
    guests: state.attendees.filter((a) => !!a.mealId).length,
  }
}

export function giftStats(state: AppState) {
  const requested = state.attendees.filter((a) => a.giftRequested)
  const delivered = requested.filter((a) => a.giftDeliveredAt)
  return { requested: requested.length, delivered: delivered.length }
}

export function workshopStats(state: AppState) {
  return state.workshops.map((w) => {
    const enrolled = state.attendees.filter((a) => a.workshopIds.includes(w.id))
    return {
      ...w,
      enrolled: enrolled.length,
      remaining: Math.max(0, w.capacity - enrolled.length),
      fill: w.capacity ? Math.min(100, Math.round((enrolled.length / w.capacity) * 100)) : 0,
      attendees: enrolled,
    }
  })
}

export function isValidIranianNationalId(input: string): boolean {
  if (!/^\d{10}$/.test(input)) return false
  if (/^(\d)\1{9}$/.test(input)) return false
  const check = Number(input[9])
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(input[i]) * (10 - i)
  const rem = sum % 11
  return rem < 2 ? check === rem : check === 11 - rem
}

/** Builds a checksum-valid 10-digit national ID from a 9-digit base (demo data only). */
export function withNationalIdChecksum(base9: string): string {
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(base9[i]) * (10 - i)
  const rem = sum % 11
  const check = rem < 2 ? rem : 11 - rem
  return `${base9}${check}`
}

export function nextAttendeeId(state: AppState): string {
  const max = state.attendees.reduce((m, a) => Math.max(m, Number(a.id.slice(1)) || 0), 0)
  return `a${max + 1}`
}
