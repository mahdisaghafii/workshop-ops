import { useStore } from '../store'
import { PageHeader, SectionCard, StatCard, Avatar, ProgressBar, StatusPill, EmptyState } from '../components/ui'
import { Donut, AreaChart, BarChart } from '../components/charts'
import {
  totalRevenue, revenueByMethod, dailySeries, roleBreakdown, provinceBreakdown,
  specialtyBreakdown, genderBreakdown, workshopStats, foodToday, giftStats, METHOD_SHORT,
} from '../lib/stats'
import { downloadCsv, faDate, faTime, fullName, money, moneyShort, num, toFa } from '../lib/format'
import {
  Users, CircleDollarSign, Presentation, UtensilsCrossed, Download, Gift, ArrowLeft,
  UserPlus, CreditCard, Banknote, ArrowRightLeft, CalendarClock,
} from 'lucide-react'
import type { PageKey } from '../lib/types'

function top(data: { label: string; value: number }[], n = 5) {
  if (data.length <= n) return data
  const head = data.slice(0, n)
  const rest = data.slice(n).reduce((s, d) => s + d.value, 0)
  return [...head, { label: 'سایر استان‌ها', value: rest }]
}

export function Dashboard({ go }: { go: (p: PageKey) => void }) {
  const { state } = useStore()
  const revenue = totalRevenue(state)
  const byMethod = revenueByMethod(state)
  const series = dailySeries(state, 14)
  const todayPoint = series[series.length - 1]
  const ws = workshopStats(state)
  const capacity = ws.reduce((s, w) => s + w.capacity, 0)
  const enrolled = ws.reduce((s, w) => s + w.enrolled, 0)
  const food = foodToday(state)
  const gift = giftStats(state)
  const recent = [...state.attendees].sort((a, b) => (a.registeredAt < b.registeredAt ? 1 : -1)).slice(0, 6)

  const exportDaily = () => {
    downloadCsv('daily-report.csv', [
      ['تاریخ', 'تعداد ثبت‌نام', 'درآمد (تومان)'],
      ...series.map((p) => [p.label, p.count, p.revenue]),
    ])
  }

  return (
    <>
      <PageHeader
        title="داشبورد"
        description={`گزارش لحظه‌ای ثبت‌نام‌ها، درآمد و پذیرایی — ${state.info.title}`}
        actions={
          <>
            <button className="btn-ghost" onClick={exportDaily}>
              <Download size={15} /> خروجی گزارش روزانه
            </button>
            <button className="btn-primary" onClick={() => go('register')}>
              <UserPlus size={16} /> ثبت‌نام جدید
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="کل ثبت‌نام‌ها"
          value={`${num(state.attendees.length)} نفر`}
          hint={`${num(todayPoint.count)} نفر امروز`}
          icon={<Users size={20} />}
          tone="brand"
        />
        <StatCard
          label="مجموع درآمد"
          value={money(revenue)}
          hint={`امروز ${moneyShort(todayPoint.revenue)} تومان`}
          icon={<CircleDollarSign size={20} />}
          tone="success"
        />
        <StatCard
          label="ظرفیت کارگاه‌ها"
          value={`${num(enrolled)} از ${num(capacity)}`}
          hint={`${toFa(capacity ? Math.round((enrolled / capacity) * 100) : 0)}٪ تکمیل شده`}
          icon={<Presentation size={20} />}
          tone="info"
        />
        <StatCard
          label="تحویل غذای امروز"
          value={`${num(food.delivered)} وعده`}
          hint={`${num(food.pending)} وعده در انتظار تحویل`}
          icon={<UtensilsCrossed size={20} />}
          tone="warning"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="روند درآمد روزانه"
          subtitle="مجموع پرداخت‌های ثبت‌شده در ۱۴ روز گذشته"
          action={<StatusPill tone="success">{moneyShort(revenue)} تومان</StatusPill>}
        >
          <AreaChart points={series.map((p) => ({ label: p.label, value: p.revenue }))} />
        </SectionCard>

        <SectionCard title="ترکیب پرداخت‌ها" subtitle="سهم هر روش از کل صندوق">
          <div className="space-y-3">
            {(['pos', 'cash', 'card'] as const).map((m) => {
              const pct = revenue ? Math.round((byMethod[m] / revenue) * 100) : 0
              const Icon = m === 'pos' ? CreditCard : m === 'cash' ? Banknote : ArrowRightLeft
              return (
                <div key={m} className="rounded-xl border border-ink-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[12.5px] text-ink-600">
                      <span
                        className={`grid size-7 place-items-center rounded-lg ${
                          m === 'pos' ? 'bg-brand-50 text-brand-600' : m === 'cash' ? 'bg-emerald-50 text-success' : 'bg-sky-50 text-info'
                        }`}
                      >
                        <Icon size={14} />
                      </span>
                      {METHOD_SHORT[m]}
                    </div>
                    <span className="text-[12px] font-semibold text-ink-800 num">{money(byMethod[m])}</span>
                  </div>
                  <ProgressBar value={pct} tone={m === 'pos' ? 'brand' : m === 'cash' ? 'success' : 'warning'} />
                  <div className="mt-1.5 text-[10.5px] text-ink-400 num">{toFa(pct)}٪ از کل درآمد</div>
                </div>
              )
            })}
            <button
              onClick={() => go('cashbox')}
              className="flex w-full items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5 text-[12px] font-medium text-ink-600 hover:bg-ink-100"
            >
              مشاهده صندوق و گزارش مالی
              <ArrowLeft size={14} />
            </button>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="ترکیب رده‌های شرکت‌کنندگان" bodyClassName="p-4">
          <Donut data={roleBreakdown(state)} />
        </SectionCard>
        <SectionCard title="تفکیک جغرافیایی" subtitle="بر اساس استان" bodyClassName="p-4">
          <Donut data={top(provinceBreakdown(state))} />
        </SectionCard>
        <SectionCard title="تفکیک تخصص‌ها" bodyClassName="p-4">
          <Donut data={specialtyBreakdown(state)} />
        </SectionCard>
        <SectionCard title="تفکیک جنسیت" bodyClassName="p-4">
          <Donut data={genderBreakdown(state)} />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard title="روند ثبت‌نام روزانه" subtitle="۱۴ روز گذشته" className="xl:col-span-1">
          <BarChart points={series.map((p) => ({ label: p.label, value: p.count }))} />
          <div className="mt-3 flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-[11.5px] text-ink-500">
            <span>میانگین روزانه</span>
            <span className="font-semibold text-ink-800 num">
              {toFa((state.attendees.length / 14).toFixed(1))} نفر
            </span>
          </div>
        </SectionCard>

        <SectionCard title="وضعیت ظرفیت کارگاه‌ها">
          <div className="space-y-4">
            {ws.map((w) => (
              <div key={w.id}>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-ink-700">{w.title}</span>
                  <span className="text-ink-500 num">
                    {num(w.enrolled)} / {num(w.capacity)}
                  </span>
                </div>
                <ProgressBar
                  value={w.fill}
                  tone={w.fill >= 90 ? 'warning' : w.fill >= 60 ? 'brand' : 'success'}
                />
              </div>
            ))}
            <button
              onClick={() => go('workshops')}
              className="flex w-full items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5 text-[12px] font-medium text-ink-600 hover:bg-ink-100"
            >
              مدیریت کارگاه‌ها
              <ArrowLeft size={14} />
            </button>
          </div>
        </SectionCard>

        <SectionCard title="پذیرایی و هدایا" subtitle="وضعیت امروز">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-amber-50 text-warning"><UtensilsCrossed size={17} /></span>
                <div>
                  <div className="text-[12.5px] font-medium text-ink-700">غذای تحویل‌شده</div>
                  <div className="text-[10.5px] text-ink-400">از {num(food.guests)} وعده ثبت‌شده</div>
                </div>
              </div>
              <div className="text-[16px] font-extrabold text-ink-900 num">{num(food.delivered)}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><Gift size={17} /></span>
                <div>
                  <div className="text-[12.5px] font-medium text-ink-700">پکیج هدیه</div>
                  <div className="text-[10.5px] text-ink-400">از {num(gift.requested)} درخواست</div>
                </div>
              </div>
              <div className="text-[16px] font-extrabold text-ink-900 num">{num(gift.delivered)}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-sky-50 text-info"><CalendarClock size={17} /></span>
                <div>
                  <div className="text-[12.5px] font-medium text-ink-700">شروع رویداد</div>
                  <div className="text-[10.5px] text-ink-400">{state.info.venue}</div>
                </div>
              </div>
              <div className="text-[12px] font-bold text-ink-700 num">{faDate(state.info.startDate)}</div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="آخرین ثبت‌نام‌ها"
          subtitle="۶ نفر آخر"
          bodyClassName="p-0"
          action={
            <button className="btn-soft !h-9 !px-3 !text-[12px]" onClick={() => go('register')}>
              فرم ثبت‌نام
            </button>
          }
        >
          {recent.length === 0 ? (
            <EmptyState title="هنوز ثبت‌نامی انجام نشده است" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ink-50/70">
                  <tr>
                    <th className="th">نام و نام خانوادگی</th>
                    <th className="th">رده</th>
                    <th className="th">استان</th>
                    <th className="th">کارگاه‌ها</th>
                    <th className="th">مبلغ پرداختی</th>
                    <th className="th">تاریخ ثبت‌نام</th>
                    <th className="th">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {recent.map((a) => {
                    const role = state.roles.find((r) => r.id === a.roleId)
                    const paid = a.payments.reduce((s, p) => s + p.amount, 0)
                    return (
                      <tr key={a.id} className="hover:bg-ink-50/50">
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={a} size="sm" />
                            <div>
                              <div className="font-medium text-ink-800">{fullName(a)}</div>
                              <div className="text-[10.5px] text-ink-400 num">{toFa(a.nationalId)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="td">{role?.title}</td>
                        <td className="td">{a.province}</td>
                        <td className="td">
                          {a.workshopIds.length ? (
                            <span className="text-[12px]">{toFa(a.workshopIds.length)} کارگاه</span>
                          ) : (
                            <span className="text-ink-400">—</span>
                          )}
                        </td>
                        <td className="td font-semibold num">{money(paid)}</td>
                        <td className="td text-ink-500 num">{faDate(a.registeredAt)}</td>
                        <td className="td">
                          {a.payments.length ? (
                            <StatusPill tone="success">پرداخت شده</StatusPill>
                          ) : (
                            <StatusPill tone="warning">بدون پرداخت</StatusPill>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <p className="mt-4 text-center text-[10.5px] text-ink-400">
        آخرین به‌روزرسانی: {faDate(new Date())} — {faTime(new Date())}
      </p>
    </>
  )
}
