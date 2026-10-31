import { useState } from 'react'
import {
  Settings2, CalendarDays, Minus, Plus, Users, UtensilsCrossed, Gift, FileText,
  Building2, Check, Pencil, Trash2, ExternalLink, Wallet,
} from 'lucide-react'
import { useStore } from '../store'
import { PageHeader, SectionCard, Modal, Toggle, StatusPill, EmptyState } from '../components/ui'
import { useToast } from '../components/Toast'
import { addDays, faDate, money, num, toFa, toLatin } from '../lib/format'
import type { Meal, Role, Sponsor } from '../lib/types'
import type { PageKey } from '../lib/types'

const TABS = [
  { key: 'event', label: 'اطلاعات رویداد', icon: CalendarDays },
  { key: 'roles', label: 'رده‌ها و هزینه‌ها', icon: Users },
  { key: 'meals', label: 'وعده‌های غذایی', icon: UtensilsCrossed },
  { key: 'gift', label: 'پکیج هدیه', icon: Gift },
  { key: 'certificate', label: 'متن گواهی', icon: FileText },
  { key: 'sponsors', label: 'اسپانسرها', icon: Building2 },
] as const

type TabKey = (typeof TABS)[number]['key']

export function BaseInfo({ go }: { go: (p: PageKey) => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<TabKey>('event')
  const [info, setInfo] = useState(state.info)
  const [roleDraft, setRoleDraft] = useState<Role | null>(null)
  const [mealDraft, setMealDraft] = useState<Meal | null>(null)
  const [sponsorDraft, setSponsorDraft] = useState<Sponsor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'role' | 'meal' | 'sponsor'; id: string; title: string } | null>(null)

  const saveInfo = () => {
    dispatch({ type: 'update-info', patch: info })
    toast.push('success', 'اطلاعات پایه ذخیره شد', 'تغییرات در سرصفحه و گزارش‌ها اعمال شد.')
  }

  return (
    <>
      <PageHeader
        title="اطلاعات پایه"
        description="تنظیمات رویداد، رده‌ها، غذا، هدیه، متن گواهی و اسپانسرها"
        actions={
          <button className="btn-primary" onClick={saveInfo}>
            <Check size={16} /> ذخیره تغییرات
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-ink-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition ${
              tab === t.key ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-500 hover:bg-ink-50'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'event' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <SectionCard title="مشخصات ورکشاپ" className="xl:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">عنوان ورکشاپ</label>
                <input className="field" value={info.title} onChange={(e) => setInfo({ ...info, title: e.target.value })} />
              </div>
              <div>
                <label className="label">وب‌سایت</label>
                <input dir="ltr" className="field text-left" value={info.website} onChange={(e) => setInfo({ ...info, website: e.target.value })} />
              </div>
              <div>
                <label className="label">محل برگزاری</label>
                <input className="field" value={info.venue} onChange={(e) => setInfo({ ...info, venue: e.target.value })} />
              </div>
              <div>
                <label className="label">تاریخ شروع</label>
                <DateStepper value={info.startDate} onChange={(v) => setInfo({ ...info, startDate: v })} />
              </div>
              <div>
                <label className="label">تاریخ پایان</label>
                <DateStepper value={info.endDate} onChange={(v) => setInfo({ ...info, endDate: v })} />
              </div>
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard title="دسترسی سریع">
              <div className="space-y-3">
                <button className="btn-ghost w-full justify-between" onClick={() => go('workshops')}>
                  <span className="flex items-center gap-2"><Settings2 size={15} /> مدیریت کارگاه‌ها</span>
                  <ExternalLink size={14} className="text-ink-400" />
                </button>
                <button className="btn-ghost w-full justify-between" onClick={() => go('cashbox')}>
                  <span className="flex items-center gap-2"><Wallet size={15} /> گزارش صندوق</span>
                  <ExternalLink size={14} className="text-ink-400" />
                </button>
              </div>
            </SectionCard>

            <div className="card card-pad bg-ink-50/80">
              <div className="text-[11.5px] font-semibold text-ink-700">خلاصه</div>
              <ul className="mt-2 space-y-2 text-[11.5px] text-ink-500">
                <li className="flex justify-between"><span>ثبت‌نام‌ها</span><span className="num text-ink-800">{num(state.attendees.length)}</span></li>
                <li className="flex justify-between"><span>رده‌ها</span><span className="num text-ink-800">{num(state.roles.length)}</span></li>
                <li className="flex justify-between"><span>کارگاه‌ها</span><span className="num text-ink-800">{num(state.workshops.length)}</span></li>
                <li className="flex justify-between"><span>وعده‌های غذایی</span><span className="num text-ink-800">{num(state.meals.length)}</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <SectionCard
          title="رده‌های شرکت‌کنندگان و هزینه ثبت‌نام"
          subtitle="هزینه هر رده مستقیماً در فرم ثبت‌نام استفاده می‌شود"
          action={<button className="btn-primary !h-9 !text-[12px]" onClick={() => setRoleDraft({ id: '', title: '', price: 0 })}><Plus size={15} /> افزودن رده</button>}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-ink-100">
            {state.roles.map((r) => {
              const count = state.attendees.filter((a) => a.roleId === r.id).length
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-ink-800">{r.title}</div>
                    <div className="text-[10.5px] text-ink-400 num">{num(count)} ثبت‌نام · {r.price === 0 ? 'رایگان' : money(r.price)}</div>
                  </div>
                  <div className="text-[12px] text-ink-500 num">
                    {state.attendees.filter((a) => a.roleId === r.id).reduce((s, a) => s + a.payments.reduce((x, p) => x + p.amount, 0), 0) === 0
                      ? <span className="text-ink-400">بدون درآمد</span>
                      : money(state.attendees.filter((a) => a.roleId === r.id).reduce((s, a) => s + a.payments.reduce((x, p) => x + p.amount, 0), 0))}
                  </div>
                  <StatusPill tone={r.price === 0 ? 'neutral' : 'brand'}>{r.price === 0 ? 'رایگان' : 'پولی'}</StatusPill>
                  <div className="flex items-center gap-1">
                    <button className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700" onClick={() => setRoleDraft(r)}><Pencil size={14} /></button>
                    <button className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-danger" onClick={() => setDeleteTarget({ kind: 'role', id: r.id, title: r.title })}><Trash2 size={14} /></button>
                  </div>
                </li>
              )
            })}
          </ul>
        </SectionCard>
      )}

      {tab === 'meals' && (
        <SectionCard
          title="وعده‌های غذایی"
          subtitle="مبلغ غذا در هزینه ثبت‌نام افزوده می‌شود و در مدیریت غذا استفاده می‌شود"
          action={<button className="btn-primary !h-9 !text-[12px]" onClick={() => setMealDraft({ id: '', title: '', price: 0 })}><Plus size={15} /> افزودن وعده</button>}
          bodyClassName="p-0"
        >
          <table className="w-full">
            <thead className="bg-ink-50/70">
              <tr>
                <th className="th">عنوان وعده</th>
                <th className="th">مبلغ (تومان)</th>
                <th className="th">تعداد ثبت‌شده</th>
                <th className="th">تحویل‌شده</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {state.meals.map((m) => {
                const total = state.attendees.filter((a) => a.mealId === m.id).length
                const delivered = state.attendees.filter((a) => a.mealId === m.id && a.foodDeliveredAt).length
                return (
                  <tr key={m.id}>
                    <td className="td font-medium text-ink-800">{m.title}</td>
                    <td className="td num">{money(m.price)}</td>
                    <td className="td num">{num(total)}</td>
                    <td className="td num">{num(delivered)}</td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        <button className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700" onClick={() => setMealDraft(m)}><Pencil size={14} /></button>
                        <button className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-danger" onClick={() => setDeleteTarget({ kind: 'meal', id: m.id, title: m.title })}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </SectionCard>
      )}

      {tab === 'gift' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SectionCard title="پکیج خوش‌آمدگویی" subtitle="کنترل موجودی انبار و نمایش در فرم ثبت‌نام">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-ink-200 p-3.5">
                <div>
                  <div className="text-[12.5px] font-medium text-ink-700">نمایش در فرم ثبت‌نام</div>
                  <div className="mt-0.5 text-[10.5px] text-ink-400">اگر غیرفعال باشد، درخواست هدیه ثبت نمی‌شود.</div>
                </div>
                <Toggle checked={info.giftEnabled} onChange={(v) => setInfo({ ...info, giftEnabled: v })} />
              </div>
              <div>
                <label className="label">نام پکیج هدیه</label>
                <input className="field" value={info.giftTitle} onChange={(e) => setInfo({ ...info, giftTitle: e.target.value })} />
              </div>
              <div>
                <label className="label">موجودی کل</label>
                <input dir="ltr" inputMode="numeric" className="field text-left num" value={info.giftStock} onChange={(e) => setInfo({ ...info, giftStock: Number(toLatin(e.target.value) || 0) })} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="وضعیت توزیع هدیه">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="درخواست‌ها" value={num(state.attendees.filter((a) => a.giftRequested).length)} />
              <Stat label="تحویل‌شده" value={num(state.attendees.filter((a) => a.giftDeliveredAt).length)} />
              <Stat label="موجودی انبار" value={num(Math.max(0, info.giftStock - state.attendees.filter((a) => a.giftDeliveredAt).length))} />
              <Stat label="در انتظار" value={num(state.attendees.filter((a) => a.giftRequested && !a.giftDeliveredAt).length)} />
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-[11px] leading-6 text-amber-800">
              تحویل هدیه در نسخه نهایی با همان اسکن بارکد کارت سینه در محل پذیرش انجام می‌شود و موجودی انبار به‌صورت
              لحظه‌ای کم می‌شود.
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'certificate' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <SectionCard title="متن گواهی حضور" subtitle="از {date} و {venue} برای درج تاریخ و محل استفاده کنید" className="xl:col-span-2">
            <textarea
              rows={6}
              className="field h-auto py-3 leading-7"
              value={info.certificateText}
              onChange={(e) => setInfo({ ...info, certificateText: e.target.value })}
            />
            <div className="mt-3 flex flex-wrap gap-2 text-[10.5px]">
              <span className="chip bg-brand-50 text-brand-700">{'{date}'} تاریخ برگزاری</span>
              <span className="chip bg-brand-50 text-brand-700">{'{venue}'} محل برگزاری</span>
            </div>
          </SectionCard>
          <SectionCard title="پیش‌نمایش متن">
            <p className="text-[12px] leading-7 text-ink-600">
              {info.certificateText
                .replace('{date}', faDate(state.info.startDate))
                .replace('{venue}', state.info.venue)}
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-3 text-[10.5px] leading-6 text-ink-400">
              گواهی نهایی به‌صورت دوزبانه (فارسی و انگلیسی) و A4 افقی چاپ می‌شود.
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'sponsors' && (
        <SectionCard
          title="اسپانسرها"
          subtitle="نام و سطح حمایت برای درج در گواهی و بنرها"
          action={<button className="btn-primary !h-9 !text-[12px]" onClick={() => setSponsorDraft({ id: '', name: '', tier: 'نقره‌ای' })}><Plus size={15} /> افزودن اسپانسر</button>}
          bodyClassName="p-0"
        >
          {state.sponsors.length === 0 ? (
            <EmptyState title="اسپانسری ثبت نشده است" icon={<Building2 size={22} />} />
          ) : (
            <ul className="divide-y divide-ink-100">
              {state.sponsors.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><Building2 size={16} /></span>
                  <span className="flex-1 text-[13px] font-medium text-ink-800">{s.name}</span>
                  <StatusPill tone={s.tier === 'طلایی' ? 'warning' : s.tier === 'نقره‌ای' ? 'neutral' : 'brand'}>
                    {s.tier}
                  </StatusPill>
                  <button className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700" onClick={() => setSponsorDraft(s)}><Pencil size={14} /></button>
                  <button className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-danger" onClick={() => setDeleteTarget({ kind: 'sponsor', id: s.id, title: s.name })}><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {/* role modal */}
      <Modal
        open={!!roleDraft}
        onClose={() => setRoleDraft(null)}
        title={roleDraft?.id ? 'ویرایش رده' : 'افزودن رده'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setRoleDraft(null)}>انصراف</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (!roleDraft?.title.trim()) { toast.push('error', 'عنوان رده الزامی است'); return }
                dispatch({ type: 'save-role', role: { ...roleDraft, id: roleDraft.id || `r${Date.now()}` } })
                setRoleDraft(null)
                toast.push('success', 'رده ذخیره شد')
              }}
            >
              <Check size={15} /> ذخیره
            </button>
          </>
        }
      >
        {roleDraft && (
          <div className="space-y-4">
            <div>
              <label className="label">عنوان رده</label>
              <input className="field" value={roleDraft.title} onChange={(e) => setRoleDraft({ ...roleDraft, title: e.target.value })} placeholder="مثلاً میهمان ویژه" />
            </div>
            <div>
              <label className="label">هزینه ثبت‌نام (تومان)</label>
              <input dir="ltr" inputMode="numeric" className="field text-left num" value={roleDraft.price} onChange={(e) => setRoleDraft({ ...roleDraft, price: Number(toLatin(e.target.value) || 0) })} />
              <p className="mt-1 text-[10.5px] text-ink-400">برای رده رایگان، مقدار صفر را وارد کنید.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* meal modal */}
      <Modal
        open={!!mealDraft}
        onClose={() => setMealDraft(null)}
        title={mealDraft?.id ? 'ویرایش وعده' : 'افزودن وعده'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setMealDraft(null)}>انصراف</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (!mealDraft?.title.trim()) { toast.push('error', 'عنوان وعده الزامی است'); return }
                dispatch({ type: 'save-meal', meal: { ...mealDraft, id: mealDraft.id || `m${Date.now()}` } })
                setMealDraft(null)
                toast.push('success', 'وعده ذخیره شد')
              }}
            >
              <Check size={15} /> ذخیره
            </button>
          </>
        }
      >
        {mealDraft && (
          <div className="space-y-4">
            <div>
              <label className="label">عنوان وعده</label>
              <input className="field" value={mealDraft.title} onChange={(e) => setMealDraft({ ...mealDraft, title: e.target.value })} placeholder="مثلاً ناهار" />
            </div>
            <div>
              <label className="label">مبلغ (تومان)</label>
              <input dir="ltr" inputMode="numeric" className="field text-left num" value={mealDraft.price} onChange={(e) => setMealDraft({ ...mealDraft, price: Number(toLatin(e.target.value) || 0) })} />
            </div>
          </div>
        )}
      </Modal>

      {/* sponsor modal */}
      <Modal
        open={!!sponsorDraft}
        onClose={() => setSponsorDraft(null)}
        title={sponsorDraft?.id ? 'ویرایش اسپانسر' : 'افزودن اسپانسر'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setSponsorDraft(null)}>انصراف</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (!sponsorDraft?.name.trim()) { toast.push('error', 'نام اسپانسر الزامی است'); return }
                dispatch({ type: 'save-sponsor', sponsor: { ...sponsorDraft, id: sponsorDraft.id || `s${Date.now()}` } })
                setSponsorDraft(null)
                toast.push('success', 'اسپانسر ذخیره شد')
              }}
            >
              <Check size={15} /> ذخیره
            </button>
          </>
        }
      >
        {sponsorDraft && (
          <div className="space-y-4">
            <div>
              <label className="label">نام اسپانسر</label>
              <input className="field" value={sponsorDraft.name} onChange={(e) => setSponsorDraft({ ...sponsorDraft, name: e.target.value })} />
            </div>
            <div>
              <label className="label">سطح حمایت</label>
              <select className="field" value={sponsorDraft.tier} onChange={(e) => setSponsorDraft({ ...sponsorDraft, tier: e.target.value as Sponsor['tier'] })}>
                <option>طلایی</option>
                <option>نقره‌ای</option>
                <option>برنزی</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف مورد"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>انصراف</button>
            <button
              className="btn-danger-soft"
              onClick={() => {
                if (!deleteTarget) return
                if (deleteTarget.kind === 'role') dispatch({ type: 'delete-role', id: deleteTarget.id })
                if (deleteTarget.kind === 'meal') dispatch({ type: 'delete-meal', id: deleteTarget.id })
                if (deleteTarget.kind === 'sponsor') dispatch({ type: 'delete-sponsor', id: deleteTarget.id })
                setDeleteTarget(null)
                toast.push('info', 'حذف انجام شد')
              }}
            >
              حذف
            </button>
          </>
        }
      >
        <p className="text-[13px] leading-7 text-ink-600">
          «{deleteTarget?.title}» حذف شود؟ رکوردهای ثبت‌نام قبلی و گزارش‌های مالی تغییر نمی‌کنند.
        </p>
      </Modal>
    </>
  )
}

function DateStepper({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" className="grid size-11 shrink-0 place-items-center rounded-xl border border-ink-200 bg-white text-ink-500 hover:bg-ink-50" onClick={() => onChange(addDays(new Date(value), -1).toISOString())} aria-label="روز قبل">
        <Minus size={15} />
      </button>
      <div className="flex h-11 flex-1 items-center justify-center rounded-xl border border-ink-200 bg-ink-50/60 text-[13px] font-medium text-ink-700 num">
        {faDate(value)}
      </div>
      <button type="button" className="grid size-11 shrink-0 place-items-center rounded-xl border border-ink-200 bg-white text-ink-500 hover:bg-ink-50" onClick={() => onChange(addDays(new Date(value), 1).toISOString())} aria-label="روز بعد">
        <Plus size={15} />
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 px-3 py-2.5">
      <div className="text-[10.5px] text-ink-400">{label}</div>
      <div className="mt-0.5 text-[16px] font-extrabold text-ink-900 num">{value}</div>
    </div>
  )
}
