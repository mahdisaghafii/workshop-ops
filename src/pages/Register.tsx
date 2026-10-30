import { useMemo, useState } from 'react'
import {
  UserPlus, Check, ChevronLeft, BadgeCheck, Wallet, CreditCard, Banknote, ArrowRightLeft,
  Info, CircleDollarSign, Percent, Gift, UtensilsCrossed,
} from 'lucide-react'
import { useStore } from '../store'
import { PageHeader, SectionCard, Modal, ProgressBar, StatusPill } from '../components/ui'
import { useToast } from '../components/Toast'
import { GENDERS, PROVINCES, SPECIALTIES } from '../lib/constants'
import { attendeeTotal, isValidIranianNationalId, nextAttendeeId, withNationalIdChecksum, workshopStats } from '../lib/stats'
import { faDate, faDateTime, money, num, toFa, toLatin } from '../lib/format'
import type { Attendee, PaymentMethod } from '../lib/types'

type FormState = {
  firstNameFa: string
  lastNameFa: string
  firstNameEn: string
  lastNameEn: string
  nationalId: string
  phone: string
  roleId: string
  province: string
  specialty: string
  gender: 'male' | 'female'
  workshopIds: string[]
  mealId: string
  giftRequested: boolean
  discount: string
  method: PaymentMethod
  tracking: string
  last4: string
}

const empty: FormState = {
  firstNameFa: '', lastNameFa: '', firstNameEn: '', lastNameEn: '', nationalId: '', phone: '',
  roleId: 'attendee', province: 'آذربایجان غربی', specialty: 'جراح', gender: 'female',
  workshopIds: [], mealId: 'lunch', giftRequested: true, discount: '',
  method: 'pos', tracking: '', last4: '',
}

const methods: { value: PaymentMethod; label: string; icon: React.ComponentType<{ size?: number }>; hint: string }[] = [
  { value: 'pos', label: 'کارت‌خوان (POS)', icon: CreditCard, hint: 'ثبت تراکنش دستگاه کارت‌خوان' },
  { value: 'cash', label: 'نقد', icon: Banknote, hint: 'دریافت وجه نقد در صندوق' },
  { value: 'card', label: 'کارت‌به‌کارت', icon: ArrowRightLeft, hint: 'ثبت شماره پیگیری و ۴ رقم آخر کارت' },
]

export function Register({ onRegistered }: { onRegistered: (a: Attendee) => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [form, setForm] = useState<FormState>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Attendee | null>(null)

  const ws = workshopStats(state)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const role = state.roles.find((r) => r.id === form.roleId)
  const meal = state.meals.find((m) => m.id === form.mealId)
  const selectedWorkshops = state.workshops.filter((w) => form.workshopIds.includes(w.id))
  const workshopsTotal = selectedWorkshops.reduce((s, w) => s + w.price, 0)
  const discount = Math.min(Number(toLatin(form.discount) || 0), (role?.price ?? 0) + (meal?.price ?? 0) + workshopsTotal)
  const total = Math.max(0, (role?.price ?? 0) + (meal?.price ?? 0) + workshopsTotal - discount)
  const giftLeft = state.info.giftStock

  const toggleWorkshop = (id: string) => {
    const w = ws.find((x) => x.id === id)!
    const isOn = form.workshopIds.includes(id)
    if (!isOn && w.remaining <= 0) {
      setErrors((e) => ({ ...e, workshops: 'ظرفیت این کارگاه تکمیل شده است.' }))
      return
    }
    setForm((f) => ({
      ...f,
      workshopIds: isOn ? f.workshopIds.filter((x) => x !== id) : [...f.workshopIds, id],
    }))
    setErrors((e) => ({ ...e, workshops: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstNameFa.trim()) e.firstNameFa = 'نام الزامی است.'
    if (!form.lastNameFa.trim()) e.lastNameFa = 'نام خانوادگی الزامی است.'
    const nid = toLatin(form.nationalId).trim()
    if (!isValidIranianNationalId(nid)) e.nationalId = 'کد ملی ۱۰ رقمی معتبر نیست.'
    else if (state.attendees.some((a) => a.nationalId === nid)) e.nationalId = 'این کد ملی قبلاً ثبت‌نام کرده است.'
    const phone = toLatin(form.phone).trim()
    if (!/^09\d{9}$/.test(phone)) e.phone = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.'
    if (!form.province) e.province = 'استان را انتخاب کنید.'
    if (!form.specialty) e.specialty = 'تخصص را انتخاب کنید.'
    if (form.method === 'card') {
      if (!/^\d{4,8}$/.test(toLatin(form.tracking))) e.tracking = 'شماره پیگیری ۴ تا ۸ رقمی وارد کنید.'
      if (!/^\d{4}$/.test(toLatin(form.last4))) e.last4 = '۴ رقم آخر کارت را وارد کنید.'
    }
    if (form.workshopIds.some((id) => (ws.find((w) => w.id === id)?.remaining ?? 0) <= 0)) {
      e.workshops = 'یکی از کارگاه‌های انتخاب‌شده تکمیل شده است. انتخاب را تغییر دهید.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = () => {
    if (!validate()) {
      toast.push('error', 'فرم کامل نیست', 'فیلدهای مشخص‌شده را اصلاح کنید.')
      return
    }
    const now = new Date().toISOString()
    const attendee: Attendee = {
      id: nextAttendeeId(state),
      firstNameFa: form.firstNameFa.trim(),
      lastNameFa: form.lastNameFa.trim(),
      firstNameEn: form.firstNameEn.trim(),
      lastNameEn: form.lastNameEn.trim(),
      nationalId: toLatin(form.nationalId).trim(),
      phone: toLatin(form.phone).trim(),
      roleId: form.roleId,
      province: form.province,
      specialty: form.specialty,
      gender: form.gender,
      workshopIds: form.workshopIds,
      mealId: form.mealId || null,
      giftRequested: form.giftRequested && state.info.giftEnabled,
      giftDeliveredAt: null,
      foodDeliveredAt: null,
      badgePrintedAt: null,
      certificateIssuedAt: null,
      registeredAt: now,
      payments:
        total > 0
          ? [
              {
                id: `p${Date.now()}`,
                method: form.method,
                amount: total,
                date: now,
                ...(form.method === 'card'
                  ? { tracking: toLatin(form.tracking), last4: toLatin(form.last4), depositDate: now }
                  : {}),
              },
            ]
          : [],
      discount,
    }
    dispatch({ type: 'add-attendee', attendee })
    setSaved(attendee)
    setForm(empty)
    toast.push('success', 'ثبت‌نام انجام شد', `${attendee.firstNameFa} ${attendee.lastNameFa} با موفقیت ثبت شد.`)
  }

  const fillSample = () => {
    const sampleNames = [
      ['سارا', 'رضایی', 'Sara', 'Rezaei'], ['علی', 'محمدی', 'Ali', 'Mohammadi'],
      ['نگین', 'کریمی', 'Negin', 'Karimi'], ['رضا', 'احمدی', 'Reza', 'Ahmadi'],
    ]
    const n = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    let nid = ''
    do {
      const base = '1' + String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')
      nid = withNationalIdChecksum(base)
    } while (state.attendees.some((a) => a.nationalId === nid))
    setForm({
      ...empty,
      firstNameFa: n[0], lastNameFa: n[1], firstNameEn: n[2], lastNameEn: n[3],
      nationalId: nid, phone: '0912' + String(Math.floor(Math.random() * 9_000_000) + 1_000_000),
      workshopIds: ['w1'], giftRequested: true,
    })
    setErrors({})
  }

  const summary = useMemo(
    () => [
      { label: `هزینه ثبت‌نام (${role?.title ?? '—'})`, value: role?.price ?? 0 },
      { label: `غذا (${meal?.title ?? 'بدون غذا'})`, value: meal?.price ?? 0 },
      {
        label: `کارگاه‌های تخصصی (${toFa(form.workshopIds.length)} مورد)`,
        value: workshopsTotal,
      },
      { label: 'تخفیف', value: -discount },
    ],
    [role, meal, workshopsTotal, discount, form.workshopIds.length],
  )

  return (
    <>
      <PageHeader
        title="ثبت‌نام جدید"
        description="ثبت اطلاعات شرکت‌کننده، انتخاب کارگاه‌ها، پذیرایی و ثبت پرداخت صندوق"
        actions={
          <button className="btn-ghost" onClick={fillSample}>
            <BadgeCheck size={15} /> تکمیل با داده نمونه
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionCard title="رده شرکت‌کننده" subtitle="هزینه ثبت‌نام بر اساس رده تعیین می‌شود">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {state.roles.map((r) => {
                const on = form.roleId === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => set('roleId', r.id)}
                    className={`rounded-xl border p-3 text-right transition ${
                      on ? 'border-brand-400 bg-brand-50/70 ring-2 ring-brand-500/10' : 'border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[12.5px] font-semibold text-ink-800">{r.title}</span>
                      {on && <Check size={14} className="text-brand-600" />}
                    </div>
                    <div className="mt-1 text-[11px] text-ink-500 num">
                      {r.price === 0 ? 'رایگان' : money(r.price)}
                    </div>
                  </button>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="اطلاعات فردی">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="نام (فارسی)" required error={errors.firstNameFa}>
                <input className="field" value={form.firstNameFa} onChange={(e) => set('firstNameFa', e.target.value)} placeholder="مثلاً سارا" />
              </Field>
              <Field label="نام خانوادگی (فارسی)" required error={errors.lastNameFa}>
                <input className="field" value={form.lastNameFa} onChange={(e) => set('lastNameFa', e.target.value)} placeholder="مثلاً رضایی" />
              </Field>
              <Field label="نام (انگلیسی)" hint="برای چاپ کارت سینه">
                <input dir="ltr" className="field text-left" value={form.firstNameEn} onChange={(e) => set('firstNameEn', e.target.value)} placeholder="Sara" />
              </Field>
              <Field label="نام خانوادگی (انگلیسی)" hint="برای چاپ کارت سینه">
                <input dir="ltr" className="field text-left" value={form.lastNameEn} onChange={(e) => set('lastNameEn', e.target.value)} placeholder="Rezaei" />
              </Field>
              <Field label="کد ملی" required error={errors.nationalId} hint="مبنای جست‌وجو در کارت سینه، غذا و گواهی">
                <input dir="ltr" inputMode="numeric" maxLength={10} className="field text-left num" value={form.nationalId} onChange={(e) => set('nationalId', e.target.value)} placeholder="0012345679" />
              </Field>
              <Field label="شماره موبایل" required error={errors.phone}>
                <input dir="ltr" inputMode="tel" maxLength={11} className="field text-left num" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09121234567" />
              </Field>
              <Field label="استان" required error={errors.province}>
                <select className="field" value={form.province} onChange={(e) => set('province', e.target.value)}>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="تخصص" required error={errors.specialty}>
                <select className="field" value={form.specialty} onChange={(e) => set('specialty', e.target.value)}>
                  {SPECIALTIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="جنسیت" required>
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => set('gender', g.value)}
                      className={`h-11 flex-1 rounded-xl border text-[13px] transition ${
                        form.gender === g.value
                          ? 'border-brand-400 bg-brand-50 font-semibold text-brand-700'
                          : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="کارگاه‌های تخصصی" subtitle="ظرفیت به‌صورت خودکار بررسی می‌شود" action={<StatusPill tone="neutral">حداکثر {toFa(state.workshops.length)} کارگاه</StatusPill>}>
            {errors.workshops && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                <Info size={14} /> {errors.workshops}
              </div>
            )}
            <div className="space-y-2.5">
              {ws.map((w) => {
                const checked = form.workshopIds.includes(w.id)
                const full = w.remaining <= 0 && !checked
                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={!w.active || full}
                    onClick={() => toggleWorkshop(w.id)}
                    className={`w-full rounded-xl border p-3.5 text-right transition disabled:opacity-60 ${
                      checked ? 'border-brand-400 bg-brand-50/60' : 'border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`grid size-5 place-items-center rounded-md border ${checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 bg-white'}`}>
                          {checked && <Check size={13} />}
                        </span>
                        <div>
                          <div className="text-[13px] font-semibold text-ink-800">{w.title}</div>
                          <div className="mt-0.5 text-[11px] text-ink-400">
                            {full ? 'ظرفیت تکمیل شد' : `${num(w.remaining)} جای خالی از ${num(w.capacity)}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-[12px] font-semibold text-ink-700 num">{money(w.price)}</div>
                    </div>
                    <div className="mt-2.5"><ProgressBar value={w.fill} tone={w.fill >= 90 ? 'warning' : 'brand'} /></div>
                  </button>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="پذیرایی و هدیه">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="وعده غذایی">
                <select className="field" value={form.mealId} onChange={(e) => set('mealId', e.target.value)}>
                  <option value="">بدون غذا</option>
                  {state.meals.map((m) => (
                    <option key={m.id} value={m.id}>{m.title} — {money(m.price)}</option>
                  ))}
                </select>
              </Field>
              <Field label="تخفیف (تومان)" hint={`حداکثر ${money((role?.price ?? 0) + (meal?.price ?? 0) + workshopsTotal)}`}>
                <input dir="ltr" inputMode="numeric" className="field text-left num" value={form.discount} onChange={(e) => set('discount', e.target.value)} placeholder="0" />
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50/50 p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><Gift size={17} /></span>
                <div>
                  <div className="text-[12.5px] font-medium text-ink-700">پکیج خوش‌آمدگویی</div>
                  <div className="text-[10.5px] text-ink-400">موجودی: {num(state.info.giftStock)} عدد</div>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-600">
                <input
                  type="checkbox"
                  checked={form.giftRequested}
                  onChange={(e) => set('giftRequested', e.target.checked)}
                  disabled={!state.info.giftEnabled || giftLeft <= 0}
                  className="size-4 accent-brand-600"
                />
                ثبت درخواست هدیه
              </label>
            </div>
          </SectionCard>

          <SectionCard title="پرداخت" subtitle={total > 0 ? `مبلغ قابل پرداخت: ${money(total)}` : 'این رده رایگان است'}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {methods.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => set('method', m.value)}
                  className={`rounded-xl border p-3 text-right transition ${
                    form.method === m.value ? 'border-brand-400 bg-brand-50/60' : 'border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-800">
                    <m.icon size={16} /> {m.label}
                  </div>
                  <div className="mt-1 text-[10.5px] leading-5 text-ink-400">{m.hint}</div>
                </button>
              ))}
            </div>

            {form.method === 'card' && (
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-dashed border-ink-300 bg-ink-50/40 p-4 sm:grid-cols-3">
                <Field label="شماره پیگیری" required error={errors.tracking}>
                  <input dir="ltr" inputMode="numeric" className="field bg-white text-left num" value={form.tracking} onChange={(e) => set('tracking', e.target.value)} placeholder="123456" />
                </Field>
                <Field label="۴ رقم آخر کارت" required error={errors.last4}>
                  <input dir="ltr" inputMode="numeric" maxLength={4} className="field bg-white text-left num" value={form.last4} onChange={(e) => set('last4', e.target.value)} placeholder="1234" />
                </Field>
                <Field label="تاریخ واریز" hint="به‌صورت خودکار امروز ثبت می‌شود">
                  <div className="field flex items-center bg-white text-ink-500 num">{faDate(new Date())}</div>
                </Field>
              </div>
            )}
            {form.method === 'pos' && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50/60 px-3.5 py-3 text-[12px] text-brand-700">
                <Wallet size={15} /> تراکنش پس از پرداخت روی دستگاه، به صندوق همین روز اضافه می‌شود.
              </div>
            )}
            {form.method === 'cash' && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-[12px] text-emerald-700">
                <CircleDollarSign size={15} /> مبلغ نقدی در گزارش روزانه صندوق ثبت خواهد شد.
              </div>
            )}
          </SectionCard>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-[84px] space-y-4">
            <SectionCard title="خلاصه ثبت‌نام">
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                <span className="grid size-10 place-items-center rounded-full bg-white text-brand-600 shadow-sm">
                  <UserPlus size={18} />
                </span>
                <div>
                  <div className="text-[12.5px] font-semibold text-ink-800">
                    {form.firstNameFa || form.lastNameFa ? `${form.firstNameFa} ${form.lastNameFa}` : 'شرکت‌کننده جدید'}
                  </div>
                  <div className="text-[10.5px] text-ink-400 num">
                    {form.nationalId ? toFa(form.nationalId) : 'کد ملی ثبت نشده'}
                  </div>
                </div>
              </div>

              <ul className="space-y-2.5 text-[12.5px]">
                {summary.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-2">
                    <span className="text-ink-500">{row.label}</span>
                    <span className={`num ${row.value < 0 ? 'text-success' : 'text-ink-700'}`}>
                      {row.value < 0 ? `− ${money(Math.abs(row.value))}` : money(row.value)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink-200 pt-4">
                <span className="text-[13px] font-semibold text-ink-700">مبلغ نهایی</span>
                <span className="text-[18px] font-extrabold text-brand-700 num">{money(total)}</span>
              </div>

              <button className="btn-primary mt-4 w-full !h-11" onClick={submit}>
                <Check size={17} /> ثبت‌نام و ثبت پرداخت
              </button>
              <p className="mt-2 text-center text-[10.5px] leading-5 text-ink-400">
                با ثبت، ظرفیت کارگاه‌ها و موجودی هدیه به‌روزرسانی می‌شود.
              </p>
            </SectionCard>

            <div className="card card-pad bg-gradient-to-br from-brand-600 to-brand-700 text-white">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold">
                <Percent size={15} /> نکته نمایشی
              </div>
              <p className="mt-2 text-[11.5px] leading-6 text-brand-100">
                ظرفیت کارگاه‌ها واقعی است: اگر یک کارگاه تکمیل شود، انتخاب آن غیرفعال می‌شود.
                کد ملی تکراری هم پذیرفته نمی‌شود.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={!!saved}
        onClose={() => setSaved(null)}
        title="ثبت‌نام با موفقیت انجام شد"
        subtitle={saved ? `${saved.firstNameFa} ${saved.lastNameFa} — ${faDateTime(saved.registeredAt)}` : undefined}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setSaved(null)}>ثبت‌نام بعدی</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (saved) onRegistered(saved)
                setSaved(null)
              }}
            >
              <BadgeCheck size={16} /> چاپ کارت سینه
            </button>
          </>
        }
      >
        {saved && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
              <span className="text-[12.5px] text-emerald-700">مبلغ ثبت‌شده در صندوق</span>
              <span className="text-[14px] font-bold text-emerald-800 num">{money(attendeeTotal(state, saved))}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <InfoRow label="کد ملی" value={toFa(saved.nationalId)} />
              <InfoRow label="رده" value={state.roles.find((r) => r.id === saved.roleId)?.title ?? '—'} />
              <InfoRow label="کارگاه‌ها" value={saved.workshopIds.length ? `${toFa(saved.workshopIds.length)} کارگاه` : 'بدون کارگاه'} />
              <InfoRow label="غذا" value={state.meals.find((m) => m.id === saved.mealId)?.title ?? 'بدون غذا'} />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function Field({
  label, children, required, error, hint,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  error?: string
  hint?: string
}) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[10.5px] text-ink-400">{hint}</p>
      ) : null}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-100 px-3 py-2">
      <div className="text-[10.5px] text-ink-400">{label}</div>
      <div className="mt-0.5 text-[12.5px] font-medium text-ink-700">{value}</div>
    </div>
  )
}
