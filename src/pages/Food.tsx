import { useMemo, useState } from 'react'
import {
  ScanLine, Search, UtensilsCrossed, CheckCircle2, AlertTriangle, Clock, Undo2,
  Download, UserX, Sparkles, CalendarDays,
} from 'lucide-react'
import { useStore } from '../store'
import { PageHeader, SectionCard, StatusPill, EmptyState, Avatar, Modal } from '../components/ui'
import { useToast } from '../components/Toast'
import { downloadCsv, faDate, faTime, fullName, num, toFa, toLatin } from '../lib/format'
import { foodToday } from '../lib/stats'
import type { Attendee } from '../lib/types'

type Lookup =
  | { kind: 'idle' }
  | { kind: 'notfound'; query: string }
  | { kind: 'nomeal'; attendee: Attendee }
  | { kind: 'duplicate'; attendee: Attendee }
  | { kind: 'ok'; attendee: Attendee }

export function Food() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [lookup, setLookup] = useState<Lookup>({ kind: 'idle' })
  const [mealFilter, setMealFilter] = useState('all')
  const [confirm, setConfirm] = useState<Attendee | null>(null)
  const [undoTarget, setUndoTarget] = useState<Attendee | null>(null)

  const stats = foodToday(state)

  const delivered = useMemo(
    () =>
      state.attendees
        .filter((a) => a.foodDeliveredAt)
        .sort((a, b) => (a.foodDeliveredAt! < b.foodDeliveredAt! ? 1 : -1))
        .filter((a) => mealFilter === 'all' || a.mealId === mealFilter),
    [state.attendees, mealFilter],
  )

  const pending = useMemo(
    () => state.attendees.filter((a) => a.mealId && !a.foodDeliveredAt),
    [state.attendees],
  )

  const search = (raw?: string) => {
    const q = toLatin(raw ?? query).trim()
    if (!q) return
    const found = state.attendees.find((a) => a.nationalId === q) ??
      state.attendees.find((a) => a.phone === q) ??
      state.attendees.find((a) => fullName(a).includes(query.trim()))
    if (!found) { setLookup({ kind: 'notfound', query: q }); return }
    if (!found.mealId) { setLookup({ kind: 'nomeal', attendee: found }); return }
    if (found.foodDeliveredAt) { setLookup({ kind: 'duplicate', attendee: found }); return }
    setLookup({ kind: 'ok', attendee: found })
  }

  const scanSample = () => {
    const target = pending[Math.floor(Math.random() * Math.max(1, pending.length))]
    if (!target) {
      toast.push('info', 'همه وعده‌ها تحویل داده شده‌اند', 'برای ادامه، یک ثبت‌نام جدید با غذا ایجاد کنید.')
      return
    }
    setQuery(target.nationalId)
    search(target.nationalId)
  }

  const confirmDelivery = () => {
    if (!confirm) return
    const at = new Date().toISOString()
    dispatch({ type: 'deliver-food', id: confirm.id, at })
    toast.push('success', 'تحویل غذا ثبت شد', `${fullName(confirm)} — ${faTime(at)}`)
    setConfirm(null)
    setLookup({ kind: 'idle' })
    setQuery('')
  }

  const exportList = () => {
    downloadCsv('food-delivery.csv', [
      ['نام و نام خانوادگی', 'کد ملی', 'رده', 'وعده', 'تاریخ تحویل', 'ساعت تحویل'],
      ...delivered.map((a) => [
        fullName(a), a.nationalId, state.roles.find((r) => r.id === a.roleId)?.title ?? '',
        state.meals.find((m) => m.id === a.mealId)?.title ?? '',
        faDate(a.foodDeliveredAt!), faTime(a.foodDeliveredAt!),
      ]),
    ])
  }

  return (
    <>
      <PageHeader
        title="مدیریت غذا"
        description="اسکن بارکد یا جست‌وجوی کد ملی برای تأیید تحویل، با جلوگیری از تحویل مجدد"
        actions={
          <>
            <button className="btn-ghost" onClick={exportList}>
              <Download size={15} /> خروجی اکسل
            </button>
            <button className="btn-soft" onClick={scanSample}>
              <Sparkles size={15} /> شبیه‌سازی اسکن
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card card-pad flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-success"><CheckCircle2 size={20} /></span>
          <div>
            <div className="text-[12px] text-ink-500">تحویل‌شده</div>
            <div className="text-[20px] font-extrabold text-ink-900 num">{num(stats.delivered)}</div>
          </div>
        </div>
        <div className="card card-pad flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-warning"><Clock size={20} /></span>
          <div>
            <div className="text-[12px] text-ink-500">در انتظار تحویل</div>
            <div className="text-[20px] font-extrabold text-ink-900 num">{num(stats.pending)}</div>
          </div>
        </div>
        <div className="card card-pad flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><UtensilsCrossed size={20} /></span>
          <div>
            <div className="text-[12px] text-ink-500">کل وعده‌های ثبت‌شده</div>
            <div className="text-[20px] font-extrabold text-ink-900 num">{num(stats.guests)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionCard
            title="اسکن یا جست‌وجو"
            subtitle="بارکد کارت سینه یا کد ملی شرکت‌کننده را وارد کنید"
            action={<StatusPill tone="neutral">ورودی سریع</StatusPill>}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setLookup({ kind: 'idle' }) }}
                  onKeyDown={(e) => e.key === 'Enter' && search()}
                  placeholder="مثلاً ۰۰۱۲۳۴۵۶۷۹"
                  className="field h-12 pr-11 text-[14px]"
                />
              </div>
              <button className="btn-primary h-12 shrink-0 px-6" onClick={() => search()}>
                <ScanLine size={18} /> جست‌وجو / اسکن
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10.5px] text-ink-400">
              <CalendarDays size={12} /> امروز — {faDate(new Date())}
              <span className="mx-1">·</span>
              شماره موبایل هم پذیرفته می‌شود
            </div>

            <div className="mt-4">
              {lookup.kind === 'notfound' && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-rose-800">
                    <UserX size={17} /> شرکت‌کننده‌ای با این مشخصات پیدا نشد
                  </div>
                  <p className="mt-1 text-[11.5px] text-rose-700/80">
                    کد ملی «{toFa(lookup.query)}» در سامانه ثبت نشده است. در صورت نیاز، از فرم ثبت‌نام اقدام کنید.
                  </p>
                </div>
              )}

              {lookup.kind === 'nomeal' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-800">
                    <AlertTriangle size={17} /> برای این شرکت‌کننده غذا ثبت نشده است
                  </div>
                  <p className="mt-1 text-[11.5px] text-amber-700/80">
                    {fullName(lookup.attendee)} — {state.roles.find((r) => r.id === lookup.attendee.roleId)?.title}
                  </p>
                </div>
              )}

              {lookup.kind === 'duplicate' && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-rose-800">
                    <AlertTriangle size={17} /> تحویل مجدد مسدود شد
                  </div>
                  <p className="mt-1 text-[11.5px] text-rose-700/80">
                    غذای {fullName(lookup.attendee)} قبلاً در {faDate(lookup.attendee.foodDeliveredAt!)} ساعت{' '}
                    {faTime(lookup.attendee.foodDeliveredAt!)} تحویل داده شده است.
                  </p>
                </div>
              )}

              {lookup.kind === 'ok' && (
                <div className="overflow-hidden rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 text-[12px] font-medium text-emerald-800">
                    <CheckCircle2 size={15} /> شرکت‌کننده معتبر است — آماده تحویل
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={lookup.attendee} size="lg" />
                      <div>
                        <div className="text-[14px] font-bold text-ink-900">{fullName(lookup.attendee)}</div>
                        <div className="mt-0.5 text-[11px] text-ink-400 num">
                          {toFa(lookup.attendee.nationalId)} · {state.roles.find((r) => r.id === lookup.attendee.roleId)?.title}
                        </div>
                        <div className="mt-1 text-[11px] text-ink-500">
                          وعده: {state.meals.find((m) => m.id === lookup.attendee.mealId)?.title}
                        </div>
                      </div>
                    </div>
                    <button className="btn-success h-11 px-5" onClick={() => setConfirm(lookup.attendee)}>
                      <CheckCircle2 size={17} /> تأیید تحویل
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="افراد تحویل‌گیرنده غذا"
            subtitle={`${num(delivered.length)} وعده تحویل‌شده`}
            bodyClassName="p-0"
            action={
              <select className="field field-sm !w-auto" value={mealFilter} onChange={(e) => setMealFilter(e.target.value)}>
                <option value="all">همه وعده‌ها</option>
                {state.meals.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            }
          >
            {delivered.length === 0 ? (
              <EmptyState icon={<UtensilsCrossed size={22} />} title="هنوز وعده‌ای تحویل داده نشده است" />
            ) : (
              <div className="max-h-[430px] overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-ink-50/90 backdrop-blur">
                    <tr>
                      <th className="th">نام و نام خانوادگی</th>
                      <th className="th">رده</th>
                      <th className="th">وعده</th>
                      <th className="th">تاریخ</th>
                      <th className="th">ساعت ورود</th>
                      <th className="th">وضعیت</th>
                      <th className="th"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {delivered.map((a) => (
                      <tr key={a.id} className="hover:bg-ink-50/50">
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={a} size="sm" />
                            <div>
                              <div className="font-medium text-ink-800">{fullName(a)}</div>
                              <div className="text-[10px] text-ink-400 num">{toFa(a.nationalId)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="td">{state.roles.find((r) => r.id === a.roleId)?.title}</td>
                        <td className="td">{state.meals.find((m) => m.id === a.mealId)?.title}</td>
                        <td className="td text-ink-500 num">{faDate(a.foodDeliveredAt!)}</td>
                        <td className="td text-ink-500 num">{faTime(a.foodDeliveredAt!)}</td>
                        <td className="td"><StatusPill tone="success">تحویل شد</StatusPill></td>
                        <td className="td">
                          <button
                            className="grid size-7 place-items-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-danger"
                            onClick={() => setUndoTarget(a)}
                            title="بازگردانی (فقط برای آزمون نمایشی)"
                            aria-label="بازگردانی"
                          >
                            <Undo2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="در انتظار تحویل" subtitle="نفراتی که غذا ثبت کرده‌اند" bodyClassName="p-0">
            <ul className="max-h-[330px] divide-y divide-ink-100 overflow-auto">
              {pending.slice(0, 40).map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={a} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-ink-800">{fullName(a)}</div>
                    <div className="text-[10px] text-ink-400 num">{toFa(a.nationalId)}</div>
                  </div>
                  <button
                    className="chip bg-ink-50 text-ink-500 hover:bg-brand-50 hover:text-brand-700"
                    onClick={() => { setQuery(a.nationalId); search(a.nationalId) }}
                  >
                    انتخاب
                  </button>
                </li>
              ))}
              {pending.length === 0 && (
                <li className="p-0"><EmptyState title="صف انتظار خالی است" icon={<CheckCircle2 size={22} />} /></li>
              )}
            </ul>
          </SectionCard>

          <div className="card card-pad bg-gradient-to-br from-ink-800 to-ink-900 text-white">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold">
              <ScanLine size={16} /> کنترل تردد سالن غذا
            </div>
            <p className="mt-2 text-[11.5px] leading-6 text-ink-300">
              هر بار اسکن، ساعت دقیق ورود و وضعیت تحویل را ثبت می‌کند. تحویل دوم برای همان کد ملی مسدود می‌شود و
              امکان ثبت دستی هم برای موارد خاص وجود دارد.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-white/5 px-2.5 py-2">
                <div className="text-ink-400">نرخ تحویل امروز</div>
                <div className="mt-0.5 text-[14px] font-bold num">
                  {toFa(stats.guests ? Math.round((stats.delivered / stats.guests) * 100) : 0)}٪
                </div>
              </div>
              <div className="rounded-lg bg-white/5 px-2.5 py-2">
                <div className="text-ink-400">میانگین ساعت</div>
                <div className="mt-0.5 text-[14px] font-bold num">
                  {delivered[0] ? faTime(delivered[Math.floor(delivered.length / 2)].foodDeliveredAt!) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="تأیید تحویل غذا"
        subtitle={confirm ? `${fullName(confirm)} — ${state.meals.find((m) => m.id === confirm.mealId)?.title}` : undefined}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirm(null)}>انصراف</button>
            <button className="btn-success" onClick={confirmDelivery}>
              <CheckCircle2 size={16} /> تأیید و ثبت ساعت
            </button>
          </>
        }
      >
        {confirm && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <Avatar name={confirm} size="lg" />
              <div>
                <div className="text-[13px] font-semibold text-ink-800">{fullName(confirm)}</div>
                <div className="text-[11px] text-ink-400 num">{toFa(confirm.nationalId)}</div>
              </div>
            </div>
            <p className="text-[12px] leading-6 text-ink-500">
              با تأیید، ساعت ورود به سالن غذا ({faTime(new Date())}) برای این شرکت‌کننده ثبت می‌شود و تحویل مجدد
              برای همین وعده ممکن نخواهد بود.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!undoTarget}
        onClose={() => setUndoTarget(null)}
        title="بازگردانی تحویل غذا"
        subtitle="این عملیات فقط برای اصلاح اشتباه در نسخه نمایشی است."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setUndoTarget(null)}>انصراف</button>
            <button
              className="btn-danger-soft"
              onClick={() => {
                if (undoTarget) dispatch({ type: 'undo-food', id: undoTarget.id })
                setUndoTarget(null)
                toast.push('info', 'تحویل غذا بازگردانی شد', 'وضعیت به «در انتظار تحویل» تغییر کرد.')
              }}
            >
              بازگردانی
            </button>
          </>
        }
      >
        <p className="text-[13px] leading-7 text-ink-600">
          با بازگردانی، رکورد تحویل {undoTarget ? fullName(undoTarget) : ''} حذف می‌شود و امکان تحویل دوباره فراهم
          می‌شود. در نسخه نهایی این عمل نیاز به دسترسی مدیر دارد و در تاریخچه ثبت می‌شود.
        </p>
      </Modal>
    </>
  )
}
