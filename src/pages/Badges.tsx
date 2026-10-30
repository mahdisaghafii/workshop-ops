import { useEffect, useMemo, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import {
  IdCard, Printer, Search, Download, CheckCircle2, Clock, UserRound, MapPin,
  GraduationCap, ScanLine, Sparkles, AlertCircle,
} from 'lucide-react'
import { useStore } from '../store'
import { PageHeader, SectionCard, StatusPill, Avatar, EmptyState, FitBox } from '../components/ui'
import { useToast } from '../components/Toast'
import { usePrint, PrintPage } from '../print'
import { downloadCsv, faDate, faTime, fullName, fullNameEn, money, toFa, toLatin } from '../lib/format'
import { attendeePaid } from '../lib/stats'
import type { Attendee, Role, WorkshopInfo } from '../lib/types'

function Barcode({ value, height = 42, width = 1.5 }: { value: string; height?: number; width?: number }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (ref.current && value) {
      JsBarcode(ref.current, value, {
        format: 'CODE128', displayValue: false, height, width, margin: 0,
        background: '#ffffff', lineColor: '#111827',
      })
    }
  }, [value, height, width])
  return <svg ref={ref} className="mx-auto max-w-full" />
}

/** The 85×55mm badge itself. Rendered identically in the preview and on paper. */
function BadgeCard({
  attendee,
  role,
  info,
}: {
  attendee: Attendee
  role?: Role | null
  info: WorkshopInfo
}) {
  return (
    <div className="overflow-hidden bg-white" style={{ width: '85mm', height: '55mm' }} dir="rtl">
      <div className="flex h-full">
        <div className="w-2 shrink-0 bg-gradient-to-b from-brand-500 to-brand-700" />
        <div className="flex flex-1 flex-col justify-between p-[5mm]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[8px] font-bold tracking-wide text-brand-600">
                {info.title}
              </div>
              <div className="mt-0.5 text-[7px] text-ink-400">{info.website}</div>
            </div>
            <div className="grid size-6 place-items-center rounded-md bg-brand-600 text-white">
              <Sparkles size={12} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-[15px] font-extrabold uppercase leading-5 tracking-wide text-ink-900" dir="ltr">
              {attendee.firstNameEn || attendee.firstNameFa} {attendee.lastNameEn || attendee.lastNameFa}
            </div>
            <div className="mt-0.5 text-[7.5px] text-ink-500">
              {role?.title} · {attendee.specialty}
            </div>
          </div>
          <div>
            <Barcode value={attendee.nationalId} />
            <div className="mt-1 text-center text-[7px] tracking-[0.2em] text-ink-500 num" dir="ltr">
              {attendee.nationalId}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Badges({ focus, onConsumed }: { focus?: string | null; onConsumed?: () => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const { print } = usePrint()
  const [query, setQuery] = useState(focus ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const found = useMemo(() => {
    const q = toLatin(query).trim().toLowerCase()
    if (!q) return []
    return state.attendees.filter(
      (a) =>
        a.nationalId.includes(q) ||
        `${a.firstNameFa} ${a.lastNameFa}`.includes(query.trim()) ||
        `${a.firstNameEn} ${a.lastNameEn}`.toLowerCase().includes(q),
    ).slice(0, 25)
  }, [query, state.attendees])

  useEffect(() => {
    if (focus) {
      setQuery(focus)
      setSelectedId(state.attendees.find((a) => a.nationalId === focus)?.id ?? null)
      onConsumed?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus])

  const selected = state.attendees.find((a) => a.id === selectedId) ?? (found.length === 1 ? found[0] : null)
  const printed = state.attendees
    .filter((a) => a.badgePrintedAt)
    .sort((a, b) => (a.badgePrintedAt! < b.badgePrintedAt! ? 1 : -1))

  const role = selected ? state.roles.find((r) => r.id === selected.roleId) : null

  const printCard = () => {
    if (!selected) return
    dispatch({ type: 'print-badge', id: selected.id, at: new Date().toISOString() })
    print(
      <PrintPage size="85mm 55mm">
        <BadgeCard attendee={selected} role={role} info={state.info} />
      </PrintPage>,
    )
    toast.push('success', 'کارت برای چاپ ارسال شد', `${fullName(selected)} — وضعیت چاپ ثبت شد.`)
  }

  const exportLog = () => {
    downloadCsv('badge-log.csv', [
      ['نام و نام خانوادگی', 'رده', 'کد ملی', 'تاریخ چاپ', 'ساعت چاپ'],
      ...printed.map((a) => [
        fullName(a), state.roles.find((r) => r.id === a.roleId)?.title ?? '',
        a.nationalId, faDate(a.badgePrintedAt!), faTime(a.badgePrintedAt!),
      ]),
    ])
  }

  return (
    <>
      <PageHeader
        title="کارت سینه"
        description="جست‌وجوی سریع با کد ملی، پیش‌نمایش و چاپ کارت ۸۵×۵۵ میلی‌متر با بارکد"
        actions={
          <button className="btn-ghost" onClick={exportLog} disabled={!printed.length}>
            <Download size={15} /> خروجی لیست چاپ
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <SectionCard title="جست‌وجوی شرکت‌کننده" subtitle="کد ملی را وارد کنید یا نام را جست‌وجو کنید">
            <div className="relative">
              <Search size={19} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedId(null) }}
                placeholder="مثلاً ۰۰۱۲۳۴۵۶۷۹ یا «سارا»"
                className="field h-12 pr-12 text-[14px]"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <ScanLine size={18} className="text-ink-300" />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] text-ink-400">نمونه سریع:</span>
              {state.attendees.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setQuery(a.nationalId); setSelectedId(a.id) }}
                  className="chip bg-ink-50 text-ink-600 hover:bg-ink-100"
                >
                  {a.firstNameFa} {a.lastNameFa}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="نتیجه جست‌وجو" bodyClassName="p-0">
            {!query.trim() ? (
              <EmptyState
                icon={<IdCard size={22} />}
                title="کد ملی یا نام شرکت‌کننده را وارد کنید"
                description="پس از انتخاب، پیش‌نمایش کارت به‌همراه وضعیت چاپ نمایش داده می‌شود."
              />
            ) : found.length === 0 ? (
              <EmptyState
                icon={<AlertCircle size={22} />}
                title="شرکت‌کننده‌ای پیدا نشد"
                description="کد ملی ۱۰ رقمی را بررسی کنید یا از فرم ثبت‌نام، فرد جدید را اضافه کنید."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {found.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => setSelectedId(a.id)}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-right transition ${
                        selected?.id === a.id ? 'bg-brand-50/70' : 'hover:bg-ink-50'
                      }`}
                    >
                      <Avatar name={a} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-ink-800">{fullName(a)}</div>
                        <div className="text-[11px] text-ink-400 num">
                          {toFa(a.nationalId)} · {state.roles.find((r) => r.id === a.roleId)?.title}
                        </div>
                      </div>
                      {a.badgePrintedAt ? (
                        <StatusPill tone="success">چاپ شده</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">چاپ نشده</StatusPill>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="xl:col-span-2">
          <SectionCard title="پیش‌نمایش کارت" subtitle="۸۵ × ۵۵ میلی‌متر" bodyClassName="p-5">
            {!selected ? (
              <EmptyState
                icon={<IdCard size={22} />}
                title="کارتی انتخاب نشده است"
                description="از لیست سمت راست یک شرکت‌کننده انتخاب کنید."
              />
            ) : (
              <>
                <div className="mx-auto w-fit">
                  <FitBox width={Math.round(85 * 96 / 25.4)} height={Math.round(55 * 96 / 25.4)}>
                    <div className="rounded-xl border border-ink-200 shadow-sm">
                      <BadgeCard attendee={selected} role={role} info={state.info} />
                    </div>
                  </FitBox>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px]">
                  <Mini label="رده" value={role?.title ?? '—'} icon={<UserRound size={13} />} />
                  <Mini label="استان" value={selected.province} icon={<MapPin size={13} />} />
                  <Mini label="مبلغ پرداختی" value={selected.payments.length ? money(attendeePaid(selected)) : 'بدون پرداخت'} />
                  <Mini label="وضعیت چاپ" value={selected.badgePrintedAt ? `${faDate(selected.badgePrintedAt)} - ${faTime(selected.badgePrintedAt)}` : 'چاپ نشده'} icon={<Clock size={13} />} />
                </div>

                <button className="btn-primary mt-4 w-full !h-11" onClick={printCard}>
                  <Printer size={17} /> {selected.badgePrintedAt ? 'چاپ مجدد کارت' : 'چاپ کارت سینه'}
                </button>
                <p className="mt-2 text-center text-[10px] leading-5 text-ink-400">
                  اندازه کاغذ خودکار روی لیبل ۸۵×۵۵ میلی‌متر تنظیم می‌شود.
                </p>
              </>
            )}
          </SectionCard>
        </div>
      </div>

      <div className="mt-4">
        <SectionCard
          title="لیست افراد چاپ‌شده"
          subtitle={`${toFa(printed.length)} کارت چاپ شده`}
          bodyClassName="p-0"
          action={
            <span className="chip bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={13} /> {toFa(printed.filter((a) => a.badgePrintedAt && a.badgePrintedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length)} امروز
            </span>
          }
        >
          {printed.length === 0 ? (
            <EmptyState title="هنوز کارتی چاپ نشده است" icon={<Printer size={22} />} />
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-ink-50/90 backdrop-blur">
                  <tr>
                    <th className="th">نام و نام خانوادگی</th>
                    <th className="th hidden sm:table-cell">رده</th>
                    <th className="th hidden sm:table-cell">کد ملی</th>
                    <th className="th hidden sm:table-cell">تاریخ چاپ</th>
                    <th className="th hidden sm:table-cell">ساعت چاپ</th>
                    <th className="th hidden sm:table-cell">وضعیت</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {printed.map((a) => (
                    <tr key={a.id} className="hover:bg-ink-50/50">
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={a} size="sm" />
                          <span className="font-medium text-ink-800">{fullName(a)}</span>
                        </div>
                      </td>
                      <td className="td hidden sm:table-cell">{state.roles.find((r) => r.id === a.roleId)?.title}</td>
                      <td className="td hidden num sm:table-cell">{toFa(a.nationalId)}</td>
                      <td className="td hidden text-ink-500 num sm:table-cell">{faDate(a.badgePrintedAt!)}</td>
                      <td className="td hidden text-ink-500 num sm:table-cell">{faTime(a.badgePrintedAt!)}</td>
                      <td className="td hidden sm:table-cell"><StatusPill tone="success">چاپ شده</StatusPill></td>
                      <td className="td">
                        <button
                          onClick={() => { setQuery(a.nationalId); setSelectedId(a.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                          className="text-[11.5px] font-medium text-brand-600 hover:underline"
                        >
                          مشاهده کارت
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

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-ink-300 bg-white/60 p-3.5 text-[11.5px] leading-6 text-ink-500">
        <GraduationCap size={16} className="mt-0.5 shrink-0 text-ink-400" />
        در نسخه نهایی، همین صفحه با اسکنر بارکد یا خوانش NFC کارت‌های هوشمند کار می‌کند؛ در این نسخه نمایشی، جست‌وجو
        با کد ملی نقش اسکنر را دارد. هر چاپ با تاریخ و ساعت در سابقه شرکت‌کننده ثبت می‌شود.
      </div>
    </>
  )
}

function Mini({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-100 px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] text-ink-400">{icon}{label}</div>
      <div className="mt-0.5 truncate text-[11.5px] font-medium text-ink-700">{value}</div>
    </div>
  )
}
