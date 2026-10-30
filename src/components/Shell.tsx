import { useEffect, useState } from 'react'
import {
  LayoutDashboard, UserPlus, IdCard, Wallet, Presentation, UtensilsCrossed,
  Award, Settings2, BarChart3, Menu, X, RotateCcw, CalendarDays, MapPin, Sparkles,
} from 'lucide-react'
import type { PageKey } from '../lib/types'
import { useStore } from '../store'
import { faDate, faTime, toFa } from '../lib/format'
import { Modal } from './ui'
import { useToast } from './Toast'

const NAV: { key: PageKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { key: 'register', label: 'فرم ثبت‌نام', icon: UserPlus },
  { key: 'badges', label: 'کارت سینه', icon: IdCard },
  { key: 'cashbox', label: 'صندوق و مدیریت مالی', icon: Wallet },
  { key: 'workshops', label: 'کارگاه‌ها', icon: Presentation },
  { key: 'food', label: 'مدیریت غذا', icon: UtensilsCrossed },
  { key: 'certificates', label: 'صدور گواهی', icon: Award },
  { key: 'base', label: 'اطلاعات پایه', icon: Settings2 },
  { key: 'reports', label: 'گزارشات', icon: BarChart3 },
]

const WEEKDAY = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' })

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])
  return (
    <div className="hidden items-center gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-2 md:flex">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
        <CalendarDays size={16} />
      </span>
      <div className="leading-tight">
        <div className="text-[11px] text-ink-400">
          {WEEKDAY.format(now)} {faDate(now)}
        </div>
        <div className="text-[12.5px] font-semibold text-ink-700 num">{faTime(now)}</div>
      </div>
    </div>
  )
}

export function Shell({
  page,
  setPage,
  children,
}: {
  page: PageKey
  setPage: (p: PageKey) => void
  children: React.ReactNode
}) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const active = NAV.find((n) => n.key === page)

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <div className="px-3 pb-2 text-[10.5px] font-medium tracking-wide text-ink-400">مدیریت ورکشاپ</div>
      {NAV.map(({ key, label, icon: Icon }) => {
        const isActive = key === page
        return (
          <button
            key={key}
            onClick={() => {
              setPage(key)
              setMobileOpen(false)
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${
              isActive
                ? 'bg-brand-600 font-semibold text-white shadow-sm shadow-brand-600/25'
                : 'font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-800'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
            {key === 'food' && state.attendees.some((a) => a.mealId && !a.foodDeliveredAt) && (
              <span className={`mr-auto size-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-warning'}`} />
            )}
          </button>
        )
      })}
    </nav>
  )

  const brand = (
    <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-[18px]">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <Sparkles size={19} />
      </div>
      <div className="leading-tight">
        <div className="text-[13.5px] font-extrabold text-ink-900">سامانه ورکشاپ</div>
        <div className="mt-0.5 text-[10.5px] text-ink-400">نسخه نمایشی محصول</div>
      </div>
      <button
        className="mr-auto grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-50 lg:hidden"
        onClick={() => setMobileOpen(false)}
        aria-label="بستن منو"
      >
        <X size={16} />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-[248px] flex-col border-l border-ink-200/80 bg-white lg:flex">
        {brand}
        {nav}
        <div className="border-t border-ink-100 p-4">
          <div className="rounded-xl bg-ink-50 p-3">
            <div className="text-[11.5px] font-semibold text-ink-700">{state.info.title}</div>
            <div className="mt-1 flex items-center gap-1 text-[10.5px] text-ink-400">
              <MapPin size={11} /> {state.info.venue}
            </div>
            <div className="mt-1 text-[10.5px] text-ink-400 num">
              {faDate(state.info.startDate)} — {faDate(state.info.endDate)}
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-[270px] flex-col bg-white">
            {brand}
            {nav}
          </aside>
        </div>
      )}

      <div className="lg:mr-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-ink-200/70 bg-white/85 px-5 backdrop-blur-md no-print">
          <button
            className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-600 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="باز کردن منو"
          >
            <Menu size={17} />
          </button>
          <div className="hidden sm:block">
            <div className="text-[13px] font-bold text-ink-800">{state.info.title}</div>
            <div className="mt-0.5 text-[10.5px] text-ink-400">{active?.label}</div>
          </div>
          <div className="mr-auto flex items-center gap-2">
            <span className="chip hidden bg-amber-50 text-amber-700 md:inline-flex">
              <span className="size-1.5 rounded-full bg-amber-500" />
              داده نمونه — {toFa(state.attendees.length)} ثبت‌نام
            </span>
            <Clock />
            <button
              onClick={() => setResetOpen(true)}
              className="btn-ghost !h-9 !px-3 !text-[12px]"
              title="بازنشانی داده‌های نمونه"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">بازنشانی</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] p-4 md:p-6">{children}</main>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="بازنشانی داده‌های نمونه"
        subtitle="همه تغییرات این جلسه حذف و داده‌های اولیه بازسازی می‌شود."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setResetOpen(false)}>انصراف</button>
            <button
              className="btn-danger-soft"
              onClick={() => {
                dispatch({ type: 'reset' })
                setResetOpen(false)
                toast.push('info', 'داده‌های نمونه بازسازی شد', 'صفحه به وضعیت اولیه بازگشت.')
              }}
            >
              <RotateCcw size={15} /> بازنشانی
            </button>
          </>
        }
      >
        <p className="text-[13px] leading-7 text-ink-600">
          این نسخه نمایشی است و همه اطلاعات در مرورگر شما نگهداری می‌شود. با بازنشانی، ثبت‌نام‌ها،
          پرداخت‌ها، تحویل غذا، چاپ کارت و گواهی‌ها به وضعیت اولیه برمی‌گردند.
        </p>
      </Modal>
    </div>
  )
}
