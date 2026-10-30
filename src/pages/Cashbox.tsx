import { useMemo, useState } from 'react'
import {
  Wallet, CreditCard, Banknote, ArrowRightLeft, Download, Printer, TrendingUp,
  CalendarDays, ReceiptText, CircleDollarSign,
} from 'lucide-react'
import { useStore } from '../store'
import { PageHeader, SectionCard, StatCard, StatusPill, EmptyState } from '../components/ui'
import { useToast } from '../components/Toast'
import { usePrint, PrintPage } from '../print'
import { addDays, downloadCsv, faDate, faTime, fullName, money, num, toFa } from '../lib/format'
import type { PaymentMethod, WorkshopInfo } from '../lib/types'

const periods = [
  { key: 'today', label: 'امروز', days: 1 },
  { key: '7', label: '۷ روز اخیر', days: 7 },
  { key: '14', label: '۱۴ روز اخیر', days: 14 },
  { key: 'all', label: 'همه', days: 9999 },
] as const

type PeriodKey = (typeof periods)[number]['key']

type CashRow = { key: string; count: number; pos: number; cash: number; card: number; total: number }

/** The signed A4 sheet, printed on its own instead of the live page. */
function CashboxReport({
  info,
  rows,
  totals,
  count,
  periodLabel,
}: {
  info: WorkshopInfo
  rows: CashRow[]
  totals: Record<PaymentMethod, number> & { all: number }
  count: number
  periodLabel: string
}) {
  return (
    <div className="p-10" style={{ background: '#fff', width: 794 }} dir="rtl">
      <div className="mb-6 flex items-start justify-between border-b-2 border-ink-900 pb-4">
        <div>
          <h1 className="text-[20px] font-extrabold text-ink-900">گزارش رسمی صندوق</h1>
          <p className="mt-1 text-[12px] text-ink-600">{info.title} — {info.venue}</p>
          <p className="text-[11px] text-ink-500">{faDate(info.startDate)} تا {faDate(info.endDate)}</p>
        </div>
        <div className="text-left text-[11px] text-ink-500">
          <div>تاریخ چاپ: {faDate(new Date())}</div>
          <div>ساعت: {faTime(new Date())}</div>
          <div>دوره گزارش: {periodLabel}</div>
        </div>
      </div>

      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-ink-100">
            <th className="border border-ink-300 p-2 text-right">تاریخ</th>
            <th className="border border-ink-300 p-2 text-right">تعداد</th>
            <th className="border border-ink-300 p-2 text-right">POS</th>
            <th className="border border-ink-300 p-2 text-right">نقد</th>
            <th className="border border-ink-300 p-2 text-right">کارت‌به‌کارت</th>
            <th className="border border-ink-300 p-2 text-right">جمع روز</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="border border-ink-300 p-2 num">{faDate(r.key)}</td>
              <td className="border border-ink-300 p-2 num">{num(r.count)}</td>
              <td className="border border-ink-300 p-2 num">{money(r.pos)}</td>
              <td className="border border-ink-300 p-2 num">{money(r.cash)}</td>
              <td className="border border-ink-300 p-2 num">{money(r.card)}</td>
              <td className="border border-ink-300 p-2 num">{money(r.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-ink-100 font-bold">
            <td className="border border-ink-300 p-2">جمع کل</td>
            <td className="border border-ink-300 p-2 num">{num(count)}</td>
            <td className="border border-ink-300 p-2 num">{money(totals.pos)}</td>
            <td className="border border-ink-300 p-2 num">{money(totals.cash)}</td>
            <td className="border border-ink-300 p-2 num">{money(totals.card)}</td>
            <td className="border border-ink-300 p-2 num">{money(totals.all)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-10 flex justify-between text-[11px] text-ink-600">
        <div>مهر و امضای مسئول مالی: ____________________</div>
        <div>تأیید مدیر ورکشاپ: ____________________</div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-ink-400">
        <CircleDollarSign size={12} /> سامانه مدیریت ورکشاپ — گزارش سیستمی، بدون تغییر دستی
      </div>
    </div>
  )
}

export function Cashbox() {
  const { state } = useStore()
  const toast = useToast()
  const { print } = usePrint()
  const [period, setPeriod] = useState<PeriodKey>('14')

  const cutoff = useMemo(() => {
    const p = periods.find((x) => x.key === period)!
    return p.days >= 9999 ? new Date(0) : addDays(new Date(), -(p.days - 1))
  }, [period])

  const payments = useMemo(
    () =>
      state.attendees
        .flatMap((a) => a.payments.map((p) => ({ ...p, attendee: a })))
        .filter((p) => new Date(p.date) >= cutoff)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.attendees, cutoff],
  )

  const totals = useMemo(() => {
    const t: Record<PaymentMethod, number> = { pos: 0, cash: 0, card: 0 }
    for (const p of payments) t[p.method] += p.amount
    return { ...t, all: t.pos + t.cash + t.card }
  }, [payments])

  const rows = useMemo(() => {
    const map = new Map<string, { key: string; count: number; pos: number; cash: number; card: number; total: number }>()
    for (const p of payments) {
      const key = p.date.slice(0, 10)
      const row = map.get(key) ?? { key, count: 0, pos: 0, cash: 0, card: 0, total: 0 }
      row.count++
      row[p.method] += p.amount
      row.total += p.amount
      map.set(key, row)
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1))
  }, [payments])

  const cardPayments = payments.filter((p) => p.method === 'card')

  const exportCsv = () => {
    downloadCsv('cashbox-report.csv', [
      ['تاریخ', 'تعداد تراکنش', 'POS (تومان)', 'نقد (تومان)', 'کارت‌به‌کارت (تومان)', 'جمع روز (تومان)'],
      ...rows.map((r) => [faDate(r.key), r.count, r.pos, r.cash, r.card, r.total]),
      ['جمع کل', payments.length, totals.pos, totals.cash, totals.card, totals.all],
    ])
    toast.push('success', 'فایل اکسل صندوق آماده شد', 'گزارش با فرمت CSV و سازگار با اکسل ذخیره شد.')
  }

  const printReport = () => {
    print(
      <PrintPage size="A4">
        <CashboxReport
          info={state.info}
          rows={rows}
          totals={totals}
          count={payments.length}
          periodLabel={period === 'all' ? 'کل' : periods.find((p) => p.key === period)?.label ?? ''}
        />
      </PrintPage>,
    )
  }

  return (
    <>
      <PageHeader
        title="صندوق و مدیریت مالی"
        description={`گزارش تفکیکی درآمد بر اساس روش پرداخت — ${state.info.title}`}
        actions={
          <>
            <button className="btn-ghost" onClick={exportCsv}>
              <Download size={15} /> خروجی اکسل
            </button>
            <button className="btn-primary" onClick={printReport}>
              <Printer size={16} /> چاپ گزارش رسمی
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-ink-200 bg-white p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`h-8 rounded-lg px-3 text-[12px] font-medium transition ${
                period === p.key ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-500 hover:bg-ink-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11.5px] text-ink-400">
          <CalendarDays size={14} />
          {period === 'all' ? 'تمام بازه' : `از ${faDate(cutoff)} تا امروز`} · {num(payments.length)} تراکنش
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-emerald-800">مجموع درآمد</span>
            <span className="grid size-10 place-items-center rounded-xl bg-white text-success shadow-sm"><Wallet size={19} /></span>
          </div>
          <div className="mt-2 text-[24px] font-extrabold text-emerald-900 num">{money(totals.all)}</div>
          <div className="mt-1 text-[11px] text-emerald-700/70">در بازه انتخاب‌شده</div>
        </div>
        <StatCard label="کارت‌خوان (POS)" value={money(totals.pos)} hint={`${num(payments.filter((p) => p.method === 'pos').length)} تراکنش`} icon={<CreditCard size={20} />} tone="brand" />
        <StatCard label="نقد" value={money(totals.cash)} hint={`${num(payments.filter((p) => p.method === 'cash').length)} تراکنش`} icon={<Banknote size={20} />} tone="success" />
        <StatCard label="کارت‌به‌کارت" value={money(totals.card)} hint={`${num(cardPayments.length)} تراکنش`} icon={<ArrowRightLeft size={20} />} tone="info" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="گزارش تفکیکی درآمد به تفکیک روز"
          subtitle="جمع تراکنش‌ها بر اساس روش پرداخت"
          bodyClassName="p-0"
        >
          {rows.length === 0 ? (
            <EmptyState title="در این بازه تراکنشی ثبت نشده است" icon={<ReceiptText size={22} />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-ink-50/70">
                  <tr>
                    <th className="th">تاریخ</th>
                    <th className="th">تعداد تراکنش</th>
                    <th className="th">POS (تومان)</th>
                    <th className="th">نقد (تومان)</th>
                    <th className="th">کارت‌به‌کارت (تومان)</th>
                    <th className="th">جمع روز (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {rows.map((r) => (
                    <tr key={r.key} className="hover:bg-ink-50/50">
                      <td className="td font-medium text-ink-800 num">{faDate(r.key)}</td>
                      <td className="td num">{num(r.count)} نفر</td>
                      <td className="td text-brand-700 num">{money(r.pos)}</td>
                      <td className="td text-emerald-700 num">{money(r.cash)}</td>
                      <td className="td text-sky-700 num">{money(r.card)}</td>
                      <td className="td font-bold text-ink-900 num">{money(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-ink-50">
                  <tr>
                    <td className="td font-bold text-ink-900">جمع کل</td>
                    <td className="td font-bold num">{num(payments.length)} نفر</td>
                    <td className="td font-bold text-brand-700 num">{money(totals.pos)}</td>
                    <td className="td font-bold text-emerald-700 num">{money(totals.cash)}</td>
                    <td className="td font-bold text-sky-700 num">{money(totals.card)}</td>
                    <td className="td font-extrabold text-ink-900 num">{money(totals.all)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="کارت‌به‌کارت‌ها" subtitle="با شماره پیگیری و ۴ رقم آخر کارت" bodyClassName="p-0">
          {cardPayments.length === 0 ? (
            <EmptyState title="کارت‌به‌کارتی ثبت نشده است" icon={<ArrowRightLeft size={22} />} />
          ) : (
            <ul className="max-h-[360px] divide-y divide-ink-100 overflow-auto">
              {cardPayments.slice(0, 30).map((p) => (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-medium text-ink-800">{fullName(p.attendee)}</span>
                    <span className="text-[12px] font-bold text-ink-800 num">{money(p.amount)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10.5px] text-ink-400 num">
                    <span>پیگیری {toFa(p.tracking ?? '—')}</span>
                    <span>·</span>
                    <span>کارت ****{toFa(p.last4 ?? '—')}</span>
                    <span>·</span>
                    <span>{faDate(p.date)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title="آخرین تراکنش‌ها" subtitle="۳۰ تراکنش آخر در بازه انتخابی" bodyClassName="p-0">
          <div className="max-h-[380px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-ink-50/90 backdrop-blur">
                <tr>
                  <th className="th">نام و نام خانوادگی</th>
                  <th className="th">روش پرداخت</th>
                  <th className="th">مبلغ</th>
                  <th className="th">تاریخ</th>
                  <th className="th">ساعت</th>
                  <th className="th">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {payments.slice(0, 30).map((p) => (
                  <tr key={p.id} className="hover:bg-ink-50/50">
                    <td className="td font-medium text-ink-800">{fullName(p.attendee)}</td>
                    <td className="td">
                      <StatusPill tone={p.method === 'pos' ? 'brand' : p.method === 'cash' ? 'success' : 'warning'}>
                        {p.method === 'pos' ? 'POS' : p.method === 'cash' ? 'نقد' : 'کارت‌به‌کارت'}
                      </StatusPill>
                    </td>
                    <td className="td font-semibold num">{money(p.amount)}</td>
                    <td className="td text-ink-500 num">{faDate(p.date)}</td>
                    <td className="td text-ink-500 num">{faTime(p.date)}</td>
                    <td className="td"><StatusPill tone="success">تأیید شده</StatusPill></td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={6}><EmptyState title="تراکنشی وجود ندارد" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-ink-300 bg-white/60 p-3.5 text-[11.5px] leading-6 text-ink-500">
        <TrendingUp size={16} className="shrink-0 text-ink-400" />
        جمع صندوق با مجموع پرداخت‌های ثبت‌شده در ثبت‌نام یکسان است؛ در نسخه نهایی، تطبیق روزانه با دستگاه POS و
        صورتحساب بانکی هم اضافه می‌شود.
      </div>

    </>
  )
}
