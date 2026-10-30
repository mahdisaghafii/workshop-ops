import { useMemo, useState } from 'react'
import {
  Award, Search, Printer, Download, CheckCircle2, Sparkles, AlertCircle, Clock, Undo2, Languages,
} from 'lucide-react'
import { useStore } from '../store'
import { PageHeader, SectionCard, StatusPill, EmptyState, Avatar, FitBox } from '../components/ui'
import { useToast } from '../components/Toast'
import { usePrint, PrintPage } from '../print'
import { downloadCsv, faDate, faLongDate, faTime, fullName, fullNameEn, num, toFa, toLatin } from '../lib/format'
import type { Attendee, WorkshopInfo } from '../lib/types'

const enDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** A4 landscape certificate (1123×794 px at 96dpi), shared by preview and print. */
function CertificateCard({ attendee, info }: { attendee: Attendee; info: WorkshopInfo }) {
  return (
    <div className="relative bg-[#fdfcf8]" style={{ width: 1123, height: 794 }} dir="rtl">
      <div className="absolute inset-[26px] border-[3px] border-[#1f2937]" />
      <div className="absolute inset-[37px] border border-[#b08d3f]" />
      <div className="absolute inset-[43px] border border-[#d6c690]" />

      <div className="relative flex h-full flex-col justify-between px-[86px] py-[64px] text-center">
        <div>
          <div className="text-[15px] font-bold tracking-[0.32em] text-[#b08d3f]">CERTIFICATE OF ATTENDANCE</div>
          <div className="mt-2 text-[23px] font-extrabold text-[#111827]">
            گواهی حضور در {info.title}
          </div>
          <div className="mt-1.5 text-[12px] text-[#6b7280]">
            {info.website} · {info.venue}
          </div>
        </div>

        <div>
          <div className="text-[12px] text-[#6b7280]">بدین‌وسیله گواهی می‌شود</div>
          <div className="mt-3 text-[40px] font-black leading-tight text-[#111827]">
            {fullName(attendee)}
          </div>
          {fullNameEn(attendee) && (
            <div className="mt-1 text-[18px] font-semibold uppercase tracking-[0.16em] text-[#374151]" dir="ltr">
              {fullNameEn(attendee)}
            </div>
          )}
          <p className="mx-auto mt-6 max-w-[720px] text-[13.5px] leading-8 text-[#4b5563]">
            {info.certificateText
              .replace('{date}', faLongDate(info.startDate))
              .replace('{venue}', info.venue)}
          </p>
          <p className="mx-auto mt-2 max-w-[720px] text-[12px] italic leading-7 text-[#6b7280]" dir="ltr">
            This certifies that the above participant attended the professional skincare and
            aesthetics workshop held on {enDate.format(new Date(info.startDate))} in Urmia, Iran.
          </p>
        </div>

        <div className="flex items-end justify-between px-[30px] text-[12px] text-[#374151]">
          <div className="w-[210px]">
            <div className="mb-1 text-[10px] tracking-wide text-[#9ca3af]">Scientific Secretary</div>
            <div className="border-t border-[#9ca3af] pt-1.5">دبیر علمی</div>
          </div>
          <div className="flex flex-col items-center gap-1 text-[#b08d3f]">
            <Sparkles size={22} />
            <div className="text-[10px] tracking-[0.2em] num">{faDate(info.startDate)}</div>
          </div>
          <div className="w-[210px]">
            <div className="mb-1 text-[10px] tracking-wide text-[#9ca3af]">Workshop Director</div>
            <div className="border-t border-[#9ca3af] pt-1.5">مدیر ورکشاپ</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Certificates({ focus }: { focus?: string | null }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [query, setQuery] = useState(focus ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { print } = usePrint()

  const found = useMemo(() => {
    const q = toLatin(query).trim().toLowerCase()
    if (!q) return []
    return state.attendees.filter(
      (a) =>
        a.nationalId.includes(q) ||
        `${a.firstNameFa} ${a.lastNameFa}`.includes(query.trim()) ||
        `${a.firstNameEn} ${a.lastNameEn}`.toLowerCase().includes(q),
    ).slice(0, 20)
  }, [query, state.attendees])

  const selected = state.attendees.find((a) => a.id === selectedId) ?? (found.length === 1 ? found[0] : null)
  const issued = state.attendees
    .filter((a) => a.certificateIssuedAt)
    .sort((a, b) => (a.certificateIssuedAt! < b.certificateIssuedAt! ? 1 : -1))

  const issue = () => {
    if (!selected) return
    dispatch({ type: 'issue-certificate', id: selected.id, at: new Date().toISOString() })
    print(
      <PrintPage size="A4 landscape">
        <CertificateCard attendee={selected} info={state.info} />
      </PrintPage>,
    )
    toast.push('success', 'گواهی صادر شد', `${fullName(selected)} — تاریخ و ساعت صدور ثبت شد.`)
  }

  const exportCsv = () => {
    downloadCsv('certificates.csv', [
      ['نام و نام خانوادگی', 'کد ملی', 'تاریخ صدور', 'ساعت صدور'],
      ...issued.map((a) => [fullName(a), a.nationalId, faDate(a.certificateIssuedAt!), faTime(a.certificateIssuedAt!)]),
    ])
  }

  return (
    <>
      <PageHeader
        title="صدور گواهی حضور"
        description="جست‌وجوی سریع، پیش‌نمایش و چاپ گواهی دوزبانه فارسی و انگلیسی"
        actions={
          <button className="btn-ghost" onClick={exportCsv} disabled={!issued.length}>
            <Download size={15} /> خروجی لیست صدور
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-2">
          <SectionCard title="جست‌وجوی شرکت‌کننده" subtitle="با کد ملی یا نام">
            <div className="relative">
              <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedId(null) }}
                placeholder="کد ملی یا نام و نام خانوادگی"
                className="field h-12 pr-11"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {state.attendees.slice(0, 3).map((a) => (
                <button key={a.id} onClick={() => { setQuery(a.nationalId); setSelectedId(a.id) }} className="chip bg-ink-50 text-ink-600 hover:bg-ink-100">
                  {a.firstNameFa} {a.lastNameFa}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="نتیجه" bodyClassName="p-0">
            {!query.trim() ? (
              <EmptyState icon={<Languages size={22} />} title="برای پیش‌نمایش، شرکت‌کننده را انتخاب کنید" description="گواهی به‌صورت دوزبانه و آماده چاپ A4 افقی طراحی شده است." />
            ) : found.length === 0 ? (
              <EmptyState icon={<AlertCircle size={22} />} title="شرکت‌کننده‌ای پیدا نشد" />
            ) : (
              <ul className="divide-y divide-ink-100">
                {found.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => setSelectedId(a.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-right ${selected?.id === a.id ? 'bg-brand-50/70' : 'hover:bg-ink-50'}`}
                    >
                      <Avatar name={a} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-ink-800">{fullName(a)}</div>
                        <div className="text-[10.5px] text-ink-400 num">{toFa(a.nationalId)}</div>
                      </div>
                      {a.certificateIssuedAt ? <StatusPill tone="success">صادر شده</StatusPill> : <StatusPill tone="neutral">صادر نشده</StatusPill>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {selected && (
            <SectionCard title="اطلاعات صدور">
              <div className="space-y-2 text-[12px]">
                <Row label="نام" value={fullName(selected)} />
                <Row label="نام انگلیسی" value={fullNameEn(selected) || '—'} />
                <Row label="رده" value={state.roles.find((r) => r.id === selected.roleId)?.title ?? '—'} />
                <Row label="وضعیت" value={selected.certificateIssuedAt ? `صادر شده — ${faDate(selected.certificateIssuedAt)} ساعت ${faTime(selected.certificateIssuedAt)}` : 'صادر نشده'} />
              </div>
              <button className="btn-primary mt-4 w-full !h-11" onClick={issue}>
                <Printer size={17} /> {selected.certificateIssuedAt ? 'چاپ مجدد گواهی' : 'صدور و چاپ گواهی'}
              </button>
              <p className="mt-2 text-center text-[10px] leading-5 text-ink-400">
                با هر چاپ، تاریخ و ساعت صدور ثبت می‌شود.
              </p>
            </SectionCard>
          )}
        </div>

        <div className="xl:col-span-3">
          <SectionCard
            title="پیش‌نمایش گواهی"
            subtitle="A4 افقی — دوزبانه"
            action={<StatusPill tone="brand"><Award size={12} /> گواهی حضور</StatusPill>}
            bodyClassName="bg-ink-50/60 p-4"
          >
            {!selected ? (
              <div className="grid min-h-[300px] place-items-center rounded-xl border-2 border-dashed border-ink-200 bg-white/60">
                <EmptyState icon={<Award size={24} />} title="گواهی‌ای برای پیش‌نمایش انتخاب نشده است" />
              </div>
            ) : (
              <FitBox width={1123} height={794} className="mx-auto">
                <CertificateCard attendee={selected} info={state.info} />
              </FitBox>
            )}
          </SectionCard>
          {selected && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-ink-300 bg-white/60 p-3.5 text-[11px] leading-6 text-ink-500">
              <Clock size={15} className="shrink-0 text-ink-400" />
              اندازه کاغذ خودکار روی A4 افقی تنظیم می‌شود؛ برای نمایش دقیق قاب‌ها و رنگ‌ها، در پنجره چاپ
              گزینه «Background graphics» را فعال کنید.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <SectionCard title="سابقه صدور گواهی" subtitle={`${toFa(issued.length)} گواهی صادر شده`} bodyClassName="p-0">
          {issued.length === 0 ? (
            <EmptyState title="هنوز گواهی صادر نشده است" icon={<Award size={22} />} />
          ) : (
            <div className="max-h-[380px] overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-ink-50/90 backdrop-blur">
                  <tr>
                    <th className="th">نام و نام خانوادگی</th>
                    <th className="th hidden sm:table-cell">رده</th>
                    <th className="th hidden sm:table-cell">کد ملی</th>
                    <th className="th hidden sm:table-cell">تاریخ صدور</th>
                    <th className="th hidden sm:table-cell">ساعت صدور</th>
                    <th className="th hidden sm:table-cell">وضعیت</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {issued.map((a) => (
                    <tr key={a.id} className="hover:bg-ink-50/50">
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={a} size="sm" />
                          <span className="font-medium text-ink-800">{fullName(a)}</span>
                        </div>
                      </td>
                      <td className="td hidden sm:table-cell">{state.roles.find((r) => r.id === a.roleId)?.title}</td>
                      <td className="td hidden num sm:table-cell">{toFa(a.nationalId)}</td>
                      <td className="td hidden text-ink-500 num sm:table-cell">{faDate(a.certificateIssuedAt!)}</td>
                      <td className="td hidden text-ink-500 num sm:table-cell">{faTime(a.certificateIssuedAt!)}</td>
                      <td className="td hidden sm:table-cell"><StatusPill tone="success">صادر شده</StatusPill></td>
                      <td className="td">
                        <button
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline"
                          onClick={() => { setQuery(a.nationalId); setSelectedId(a.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        >
                          <Printer size={13} /> مشاهده و چاپ
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
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-ink-50/70 px-3 py-2">
      <span className="text-[11px] text-ink-400">{label}</span>
      <span className="text-left text-[11.5px] font-medium text-ink-700">{value}</span>
    </div>
  )
}
