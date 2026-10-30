import { useMemo, useState } from 'react'
import {
  Presentation, Plus, Users, Pencil, Download, Search, Wallet, AlertTriangle, Check,
} from 'lucide-react'
import { useStore } from '../store'
import { PageHeader, SectionCard, Modal, ProgressBar, StatusPill, EmptyState, Avatar, Toggle } from '../components/ui'
import { useToast } from '../components/Toast'
import { workshopStats } from '../lib/stats'
import { downloadCsv, faDate, fullName, money, num, toFa } from '../lib/format'
import type { Attendee, Workshop as WorkshopType } from '../lib/types'

type Draft = { id?: string; title: string; price: string; capacity: string; active: boolean }
const emptyDraft: Draft = { title: '', price: '0', capacity: '30', active: true }

export function Workshops() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const ws = workshopStats(state)
  const [listFor, setListFor] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const listWorkshop = ws.find((w) => w.id === listFor)
  const listAttendees = useMemo(() => {
    if (!listWorkshop) return []
    const q = query.trim()
    return listWorkshop.attendees.filter(
      (a) => !q || a.nationalId.includes(q) || fullName(a).includes(q),
    )
  }, [listWorkshop, query])

  const openNew = () => { setDraft(emptyDraft); setErrors({}) }
  const openEdit = (w: WorkshopType) => {
    setDraft({ id: w.id, title: w.title, price: String(w.price), capacity: String(w.capacity), active: w.active })
    setErrors({})
  }

  const save = () => {
    if (!draft) return
    const e: Record<string, string> = {}
    if (!draft.title.trim()) e.title = 'عنوان کارگاه الزامی است.'
    const capacity = Number(draft.capacity)
    const price = Number(draft.price || 0)
    if (!Number.isFinite(capacity) || capacity <= 0) e.capacity = 'ظرفیت باید عددی بزرگ‌تر از صفر باشد.'
    if (!Number.isFinite(price) || price < 0) e.price = 'هزینه معتبر نیست.'
    if (draft.id) {
      const current = ws.find((w) => w.id === draft.id)
      if (current && capacity < current.enrolled) {
        e.capacity = `ظرفیت نمی‌تواند کمتر از تعداد ثبت‌نام‌شده (${toFa(current.enrolled)}) باشد.`
      }
    }
    setErrors(e)
    if (Object.keys(e).length) return
    const id = draft.id ?? `w${Date.now()}`
    dispatch({
      type: 'save-workshop',
      workshop: { id, title: draft.title.trim(), price, capacity, active: draft.active },
    })
    toast.push('success', draft.id ? 'کارگاه به‌روزرسانی شد' : 'کارگاه جدید اضافه شد', draft.title)
    setDraft(null)
  }

  const exportWorkshop = (id: string) => {
    const w = ws.find((x) => x.id === id)
    if (!w) return
    downloadCsv(`workshop-${id}.csv`, [
      ['نام و نام خانوادگی', 'کد ملی', 'موبایل', 'رده', 'استان', 'تاریخ ثبت‌نام'],
      ...w.attendees.map((a) => [
        fullName(a), a.nationalId, a.phone,
        state.roles.find((r) => r.id === a.roleId)?.title ?? '',
        a.province, faDate(a.registeredAt),
      ]),
    ])
    toast.push('success', 'خروجی اکسل آماده شد', w.title)
  }

  const exportAll = () => {
    downloadCsv('all-workshops.csv', [
      ['کارگاه', 'ظرفیت', 'ثبت‌نام‌شده', 'هزینه (تومان)'],
      ...ws.map((w) => [w.title, w.capacity, w.enrolled, w.price]),
    ])
  }

  return (
    <>
      <PageHeader
        title="کارگاه‌های تخصصی"
        description="تعریف کارگاه، ظرفیت، هزینه و مشاهده آنلاین ثبت‌نام‌شدگان هر کارگاه"
        actions={
          <>
            <button className="btn-ghost" onClick={exportAll}>
              <Download size={15} /> خروجی همه کارگاه‌ها
            </button>
            <button className="btn-primary" onClick={openNew}>
              <Plus size={16} /> افزودن کارگاه
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ws.map((w) => (
          <div key={w.id} className="card overflow-hidden">
            <div className="border-b border-ink-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Presentation size={17} />
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-bold text-ink-900">{w.title}</h3>
                    <div className="mt-0.5 text-[11px] text-ink-400 num">{money(w.price)}</div>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(w)}
                  className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                  aria-label="ویرایش"
                >
                  <Pencil size={14} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11.5px]">
                <span className="text-ink-500">
                  ظرفیت: <span className="font-semibold text-ink-800 num">{num(w.capacity)}</span>
                </span>
                <span className="text-ink-500">
                  ثبت‌نام: <span className="font-semibold text-ink-800 num">{num(w.enrolled)}</span>
                </span>
                {w.active ? <StatusPill tone="success">فعال</StatusPill> : <StatusPill tone="neutral">غیرفعال</StatusPill>}
              </div>
              <div className="mt-2"><ProgressBar value={w.fill} tone={w.fill >= 90 ? 'warning' : 'brand'} /></div>
              <div className="mt-1 text-[10.5px] text-ink-400 num">
                {w.remaining > 0 ? `${toFa(w.remaining)} جای خالی` : 'ظرفیت تکمیل شده'} · {toFa(w.fill)}٪
              </div>
            </div>

            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-500">لیست ثبت‌نام‌شدگان</span>
                <span className="text-[10.5px] text-ink-400 num">{toFa(w.attendees.length)} نفر</span>
              </div>
              {w.attendees.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2.5 text-[11.5px] text-ink-400">
                  <Users size={14} /> هنوز کسی ثبت‌نام نکرده است.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {w.attendees.slice(0, 4).map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                      <Avatar name={a} size="sm" />
                      <span className="flex-1 truncate text-[12px] text-ink-700">{fullName(a)}</span>
                      <span className="text-[10.5px] text-ink-400 num">{toFa(a.nationalId)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-ink-100 bg-ink-50/50 p-3">
              <button className="btn-ghost flex-1 !h-9 !text-[12px]" onClick={() => { setListFor(w.id); setQuery('') }}>
                <Users size={14} /> لیست کامل
              </button>
              <button className="btn-ghost !h-9 !px-3 !text-[12px]" onClick={() => exportWorkshop(w.id)} disabled={!w.attendees.length}>
                <Download size={14} /> اکسل
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={openNew}
          className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-white/50 text-ink-400 transition hover:border-brand-300 hover:bg-brand-50/30 hover:text-brand-600"
        >
          <Plus size={26} />
          <span className="text-[12.5px] font-medium">افزودن کارگاه جدید</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card card-pad">
          <div className="flex items-center gap-2 text-[11.5px] text-ink-400"><Presentation size={14} /> کل ظرفیت</div>
          <div className="mt-1 text-[19px] font-extrabold text-ink-900 num">{num(ws.reduce((s, w) => s + w.capacity, 0))}</div>
        </div>
        <div className="card card-pad">
          <div className="flex items-center gap-2 text-[11.5px] text-ink-400"><Users size={14} /> ثبت‌نام‌شده</div>
          <div className="mt-1 text-[19px] font-extrabold text-ink-900 num">{num(ws.reduce((s, w) => s + w.enrolled, 0))}</div>
        </div>
        <div className="card card-pad">
          <div className="flex items-center gap-2 text-[11.5px] text-ink-400"><Wallet size={14} /> درآمد کارگاه‌ها</div>
          <div className="mt-1 text-[19px] font-extrabold text-ink-900 num">
            {money(ws.reduce((s, w) => s + w.enrolled * w.price, 0))}
          </div>
        </div>
      </div>

      {/* attendee list modal */}
      <Modal
        open={!!listFor}
        onClose={() => setListFor(null)}
        title={listWorkshop?.title ?? ''}
        subtitle={listWorkshop ? `${num(listWorkshop.enrolled)} ثبت‌نام از ${num(listWorkshop.capacity)} ظرفیت` : undefined}
        width="max-w-3xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setListFor(null)}>بستن</button>
            <button className="btn-soft" onClick={() => listWorkshop && exportWorkshop(listWorkshop.id)}>
              <Download size={15} /> خروجی اکسل
            </button>
          </>
        }
      >
        <div className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجو با نام یا کد ملی" className="field pr-9" />
          </div>
        </div>
        {listAttendees.length === 0 ? (
          <EmptyState title="نتیجه‌ای پیدا نشد" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-100">
            <table className="w-full">
              <thead className="bg-ink-50">
                <tr>
                  <th className="th">نام</th>
                  <th className="th">کد ملی</th>
                  <th className="th">رده</th>
                  <th className="th">استان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {listAttendees.map((a: Attendee) => (
                  <tr key={a.id}>
                    <td className="td">{fullName(a)}</td>
                    <td className="td num">{toFa(a.nationalId)}</td>
                    <td className="td">{state.roles.find((r) => r.id === a.roleId)?.title}</td>
                    <td className="td">{a.province}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* create / edit modal */}
      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'ویرایش کارگاه' : 'افزودن کارگاه'}
        subtitle="عنوان، هزینه، ظرفیت و وضعیت فعال‌بودن را تعیین کنید."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setDraft(null)}>انصراف</button>
            <button className="btn-primary" onClick={save}><Check size={16} /> ذخیره</button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div>
              <label className="label">عنوان کارگاه <span className="text-danger">*</span></label>
              <input className="field" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="مثلاً کارگاه تزریق ژل و فیلر" />
              {errors.title && <p className="mt-1 text-[11px] text-danger">{errors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">هزینه (تومان) <span className="text-danger">*</span></label>
                <input dir="ltr" inputMode="numeric" className="field text-left num" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
                {errors.price && <p className="mt-1 text-[11px] text-danger">{errors.price}</p>}
              </div>
              <div>
                <label className="label">ظرفیت کل <span className="text-danger">*</span></label>
                <input dir="ltr" inputMode="numeric" className="field text-left num" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} />
                {errors.capacity && <p className="mt-1 text-[11px] text-danger">{errors.capacity}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-ink-200 p-3">
              <div className="flex items-center gap-2 text-[12.5px] text-ink-600">
                <AlertTriangle size={15} className="text-ink-400" />
                کارگاه در فرم ثبت‌نام قابل انتخاب باشد
              </div>
              <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
            </div>
            {draft.id && (
              <button
                className="text-[11.5px] font-medium text-danger hover:underline"
                onClick={() => { setDeleteId(draft.id!); setDraft(null) }}
              >
                حذف این کارگاه
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="حذف کارگاه"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setDeleteId(null)}>انصراف</button>
            <button
              className="btn-danger-soft"
              onClick={() => {
                dispatch({ type: 'delete-workshop', id: deleteId! })
                setDeleteId(null)
                toast.push('info', 'کارگاه حذف شد')
              }}
            >
              حذف
            </button>
          </>
        }
      >
        <p className="text-[13px] leading-7 text-ink-600">
          با حذف کارگاه، انتخاب آن از ثبت‌نام‌های قبلی حذف نمی‌شود اما دیگر قابل انتخاب نیست. برای حفظ تاریخچه،
          پیشنهاد می‌شود به‌جای حذف، آن را غیرفعال کنید.
        </p>
      </Modal>
    </>
  )
}
