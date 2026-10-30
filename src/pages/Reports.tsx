import { useMemo } from 'react'
import {
  BarChart3, Download, Printer, Users, CircleDollarSign, UtensilsCrossed, IdCard,
  Award, PieChart, TrendingUp,
} from 'lucide-react'
import { useStore } from '../store'
import { PageHeader, SectionCard, StatCard, StatusPill } from '../components/ui'
import { AreaChart, BarChart, Donut } from '../components/charts'
import { useToast } from '../components/Toast'
import { usePrint, PrintPage } from '../print'
import {
  attendeePaid, dailySeries, foodToday, genderBreakdown, giftStats, provinceBreakdown,
  roleBreakdown, specialtyBreakdown, totalRevenue, workshopStats,
} from '../lib/stats'
import { downloadCsv, faDate, faTime, fullName, money, num, toFa } from '../lib/format'
import type { AppState, Attendee } from '../lib/types'

type GroupRow = { label: string; count: number; revenue: number; share: number }

function group(state: AppState, key: (a: Attendee) => string): GroupRow[] {
  const map = new Map<string, { count: number; revenue: number }>()
  for (const a of state.attendees) {
    const k = key(a)
    const cur = map.get(k) ?? { count: 0, revenue: 0 }
    cur.count++
    cur.revenue += attendeePaid(a)
    map.set(k, cur)
  }
  const total = state.attendees.length || 1
  return [...map.entries()]
    .map(([label, v]) => ({ label, ...v, share: Math.round((v.count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

/** One-page A4 management summary, printed on its own. */
function SummaryReport({
  info,
  attendeeCount,
  revenue,
  mealsDelivered,
  badges,
  roleRows,
  workshops,
}: {
  info: AppState['info']
  attendeeCount: number
  revenue: number
  mealsDelivered: number
  badges: number
  roleRows: GroupRow[]
  workshops: ReturnType<typeof workshopStats>
}) {
  return (
    <div className="p-8" style={{ background: '#fff', width: 794 }} dir="rtl">
      <div className="mb-5 border-b-2 border-ink-900 pb-3">
        <h1 className="text-[18px] font-extrabold">خلاصه مدیریتی {info.title}</h1>
        <p className="mt-1 text-[11px] text-ink-500">{info.venue} · {faDate(info.startDate)} تا {faDate(info.endDate)}</p>
        <p className="text-[10px] text-ink-400">تاریخ چاپ: {faDate(new Date())} — {faTime(new Date())}</p>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3 text-[10.5px]">
        {[
          ['ثبت‌نام', `${num(attendeeCount)} نفر`],
          ['درآمد کل', money(revenue)],
          ['تحویل غذا', `${num(mealsDelivered)} وعده`],
          ['کارت چاپ‌شده', `${num(badges)}`],
        ].map(([l, v]) => (
          <div key={l} className="rounded border border-ink-300 p-2">
            <div className="text-ink-500">{l}</div>
            <div className="mt-1 font-bold num">{v}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-[12px] font-bold">عملکرد رده‌ها</h2>
      <table className="mb-4 w-full border-collapse text-[10.5px]">
        <thead><tr className="bg-ink-100">
          <th className="border border-ink-300 p-1.5 text-right">رده</th>
          <th className="border border-ink-300 p-1.5 text-right">تعداد</th>
          <th className="border border-ink-300 p-1.5 text-right">سهم</th>
          <th className="border border-ink-300 p-1.5 text-right">درآمد</th>
        </tr></thead>
        <tbody>
          {roleRows.map((r) => (
            <tr key={r.label}>
              <td className="border border-ink-300 p-1.5">{r.label}</td>
              <td className="border border-ink-300 p-1.5 num">{num(r.count)}</td>
              <td className="border border-ink-300 p-1.5 num">{toFa(r.share)}٪</td>
              <td className="border border-ink-300 p-1.5 num">{money(r.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mb-2 text-[12px] font-bold">کارگاه‌ها</h2>
      <table className="w-full border-collapse text-[10.5px]">
        <thead><tr className="bg-ink-100">
          <th className="border border-ink-300 p-1.5 text-right">کارگاه</th>
          <th className="border border-ink-300 p-1.5 text-right">ثبت‌نام</th>
          <th className="border border-ink-300 p-1.5 text-right">ظرفیت</th>
          <th className="border border-ink-300 p-1.5 text-right">درآمد</th>
        </tr></thead>
        <tbody>
          {workshops.map((w) => (
            <tr key={w.id}>
              <td className="border border-ink-300 p-1.5">{w.title}</td>
              <td className="border border-ink-300 p-1.5 num">{num(w.enrolled)}</td>
              <td className="border border-ink-300 p-1.5 num">{num(w.capacity)}</td>
              <td className="border border-ink-300 p-1.5 num">{money(w.enrolled * w.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-center text-[9px] text-ink-400">گزارش سیستمی — سامانه مدیریت ورکشاپ</p>
    </div>
  )
}

export function Reports() {
  const { state } = useStore()
  const toast = useToast()
  const { print } = usePrint()
  const revenue = totalRevenue(state)
  const series = dailySeries(state, 14)
  const food = foodToday(state)
  const gift = giftStats(state)
  const wss = workshopStats(state)

  const roleRows = useMemo(() => group(state, (a) => state.roles.find((r) => r.id === a.roleId)?.title ?? '—'), [state])
  const provRows = useMemo(() => group(state, (a) => a.province), [state])
  const specRows = useMemo(() => group(state, (a) => a.specialty), [state])
  const genderRows = useMemo(() => group(state, (a) => (a.gender === 'male' ? 'آقا' : 'خانم')), [state])

  const paid = state.attendees.filter((a) => a.payments.length).length
  const withBadge = state.attendees.filter((a) => a.badgePrintedAt).length
  const withCert = state.attendees.filter((a) => a.certificateIssuedAt).length

  const exportAll = () => {
    downloadCsv('attendees-full.csv', [
      ['نام', 'نام خانوادگی', 'نام انگلیسی', 'کد ملی', 'موبایل', 'رده', 'استان', 'تخصص', 'جنسیت', 'کارگاه‌ها', 'غذا', 'مبلغ کل', 'پرداخت‌شده', 'روش پرداخت', 'تاریخ ثبت‌نام', 'چاپ کارت', 'گواهی'],
      ...state.attendees.map((a) => [
        a.firstNameFa, a.lastNameFa, `${a.firstNameEn} ${a.lastNameEn}`.trim(), a.nationalId, a.phone,
        state.roles.find((r) => r.id === a.roleId)?.title ?? '', a.province, a.specialty,
        a.gender === 'male' ? 'آقا' : 'خانم',
        a.workshopIds.map((id) => state.workshops.find((w) => w.id === id)?.title ?? '').join(' | '),
        state.meals.find((m) => m.id === a.mealId)?.title ?? '',
        attendeePaid(a), attendeePaid(a),
        a.payments.map((p) => (p.method === 'pos' ? 'POS' : p.method === 'cash' ? 'نقد' : 'کارت‌به‌کارت')).join(' | '),
        faDate(a.registeredAt), a.badgePrintedAt ? 'بله' : 'خیر', a.certificateIssuedAt ? 'بله' : 'خیر',
      ]),
    ])
    toast.push('success', 'خروجی جامع آماده شد', `${toFa(state.attendees.length)} رکورد در فایل CSV ذخیره شد.`)
  }

  return (
    <>
      <PageHeader
        title="گزارشات"
        description="تحلیل ثبت‌نام، درآمد، پذیرایی و عملکرد عملیاتی ورکشاپ"
        actions={
          <>
            <button
              className="btn-ghost"
              onClick={() =>
                print(
                  <PrintPage size="A4">
                    <SummaryReport
                      info={state.info}
                      attendeeCount={state.attendees.length}
                      revenue={revenue}
                      mealsDelivered={food.delivered}
                      badges={withBadge}
                      roleRows={roleRows}
                      workshops={wss}
                    />
                  </PrintPage>,
                )
              }
            >
              <Printer size={15} /> چاپ خلاصه مدیریتی
            </button>
            <button className="btn-primary" onClick={exportAll}>
              <Download size={16} /> خروجی جامع اکسل
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="کل ثبت‌نام" value={`${num(state.attendees.length)} نفر`} hint={`${num(paid)} نفر پرداخت کرده‌اند`} icon={<Users size={20} />} tone="brand" />
        <StatCard label="درآمد کل" value={money(revenue)} hint={`میانگین ${money(Math.round(revenue / Math.max(1, paid)))} به ازای هر پرداخت`} icon={<CircleDollarSign size={20} />} tone="success" />
        <StatCard label="نرخ تحویل غذا" value={`${toFa(food.guests ? Math.round((food.delivered / food.guests) * 100) : 0)}٪`} hint={`${num(food.delivered)} از ${num(food.guests)} وعده`} icon={<UtensilsCrossed size={20} />} tone="warning" />
        <StatCard label="کارت و گواهی" value={`${num(withBadge)} کارت`} hint={`${num(withCert)} گواهی صادر شده`} icon={<IdCard size={20} />} tone="info" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2" title="روند درآمد" subtitle="۱۴ روز گذشته" action={<StatusPill tone="success"><TrendingUp size={12} /> {money(revenue)}</StatusPill>}>
          <AreaChart points={series.map((p) => ({ label: p.label, value: p.revenue }))} />
        </SectionCard>
        <SectionCard title="روند ثبت‌نام" subtitle="تعداد نفرات در هر روز">
          <BarChart points={series.map((p) => ({ label: p.label, value: p.count }))} />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard title="ترکیب رده‌ها" bodyClassName="p-4">
          <Donut data={roleBreakdown(state)} />
        </SectionCard>
        <SectionCard title="تفکیک جنسیت" bodyClassName="p-4">
          <Donut data={genderBreakdown(state)} />
        </SectionCard>
        <SectionCard title="تفکیک تخصص" bodyClassName="p-4">
          <Donut data={specialtyBreakdown(state)} />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="عملکرد رده‌ها" subtitle="تعداد و درآمد به تفکیک رده" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-ink-50/70">
              <tr>
                <th className="th">رده</th>
                <th className="th">تعداد</th>
                <th className="th">سهم</th>
                <th className="th">درآمد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {roleRows.map((r) => (
                <tr key={r.label}>
                  <td className="td font-medium text-ink-800">{r.label}</td>
                  <td className="td num">{num(r.count)}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                        <div className="h-full bg-brand-500" style={{ width: `${r.share}%` }} />
                      </div>
                      <span className="text-[11px] text-ink-500 num">{toFa(r.share)}٪</span>
                    </div>
                  </td>
                  <td className="td num">{money(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </SectionCard>

        <SectionCard title="تفکیک استانی" subtitle="۱۰ استان نخست" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-ink-50/70">
              <tr>
                <th className="th">استان</th>
                <th className="th">تعداد</th>
                <th className="th">سهم</th>
                <th className="th">درآمد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {provRows.slice(0, 10).map((r) => (
                <tr key={r.label}>
                  <td className="td font-medium text-ink-800">{r.label}</td>
                  <td className="td num">{num(r.count)}</td>
                  <td className="td text-ink-500 num">{toFa(r.share)}٪</td>
                  <td className="td num">{money(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard title="کارگاه‌ها" subtitle="ظرفیت، ثبت‌نام و درآمد" className="xl:col-span-2" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-ink-50/70">
              <tr>
                <th className="th">کارگاه</th>
                <th className="th">هزینه</th>
                <th className="th">ثبت‌نام</th>
                <th className="th">ظرفیت</th>
                <th className="th">تکمیل</th>
                <th className="th">درآمد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {wss.map((w) => (
                <tr key={w.id}>
                  <td className="td font-medium text-ink-800">{w.title}</td>
                  <td className="td num">{money(w.price)}</td>
                  <td className="td num">{num(w.enrolled)}</td>
                  <td className="td num">{num(w.capacity)}</td>
                  <td className="td">
                    <StatusPill tone={w.fill >= 90 ? 'warning' : w.fill >= 60 ? 'brand' : 'success'}>{toFa(w.fill)}٪</StatusPill>
                  </td>
                  <td className="td num">{money(w.enrolled * w.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </SectionCard>

        <SectionCard title="پذیرایی و هدایا">
          <ul className="space-y-3 text-[12px]">
            <li className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-amber-800"><UtensilsCrossed size={14} /> تحویل غذا</span>
              <span className="font-bold text-amber-900 num">{num(food.delivered)} / {num(food.guests)}</span>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-brand-700"><Award size={14} /> پکیج هدیه</span>
              <span className="font-bold text-brand-800 num">{num(gift.delivered)} / {num(gift.requested)}</span>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-emerald-800"><IdCard size={14} /> چاپ کارت سینه</span>
              <span className="font-bold text-emerald-900 num">{num(withBadge)} / {num(state.attendees.length)}</span>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sky-800"><PieChart size={14} /> گواهی صادرشده</span>
              <span className="font-bold text-sky-900 num">{num(withCert)}</span>
            </li>
          </ul>
          <div className="mt-3 rounded-xl border border-dashed border-ink-200 p-3 text-[10.5px] leading-6 text-ink-400">
            گواهی‌ها معمولاً پس از پایان رویداد و پس از تأیید حضور صادر می‌شوند.
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-ink-300 bg-white/60 p-3.5 text-[11.5px] leading-6 text-ink-500">
        <BarChart3 size={16} className="shrink-0 text-ink-400" />
        همه اعداد این صفحه از همان داده‌های ثبت‌نام و صندوق محاسبه می‌شوند؛ هیچ عددی جداگانه وارد نشده است.
        {specRows.length > 0 && ` بیشترین تخصص: ${specRows[0].label} با ${num(specRows[0].count)} نفر.`}
      </div>
    </>
  )
}
