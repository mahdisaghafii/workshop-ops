import type { AppState, Attendee, Payment, PaymentMethod, Role, Workshop } from './types'
import { addDays, todayKey } from './format'

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const male: [string, string][] = [
  ['علی', 'Ali'], ['محمد', 'Mohammad'], ['رضا', 'Reza'], ['امیرحسین', 'Amirhossein'],
  ['سینا', 'Sina'], ['مهدی', 'Mahdi'], ['حسین', 'Hossein'], ['آرش', 'Arash'],
  ['پویا', 'Pouya'], ['سعید', 'Saeed'], ['کیوان', 'Keyvan'], ['بهنام', 'Behnam'],
  ['فرزاد', 'Farzad'], ['نوید', 'Navid'], ['یاسر', 'Yaser'], ['میلاد', 'Milad'],
]

const female: [string, string][] = [
  ['سارا', 'Sara'], ['نازنین', 'Nazanin'], ['فاطمه', 'Fatemeh'], ['مریم', 'Maryam'],
  ['الهام', 'Elham'], ['شیما', 'Shima'], ['پریسا', 'Parisa'], ['نگین', 'Negin'],
  ['زهرا', 'Zahra'], ['آیدا', 'Aida'], ['مهسا', 'Mahsa'], ['لیلا', 'Leila'],
  ['رویا', 'Roya'], ['سمانه', 'Samaneh'], ['ترانه', 'Taraneh'], ['هستی', 'Hasti'],
]

const family: [string, string][] = [
  ['محمدی', 'Mohammadi'], ['رضایی', 'Rezaei'], ['احمدی', 'Ahmadi'], ['حسینی', 'Hosseini'],
  ['کریمی', 'Karimi'], ['موسوی', 'Mousavi'], ['نجفی', 'Najafi'], ['شریفی', 'Sharifi'],
  ['صادقی', 'Sadeghi'], ['اکبری', 'Akbari'], ['جعفری', 'Jafari'], ['مرادی', 'Moradi'],
  ['علوی', 'Alavi'], ['قاسمی', 'Ghasemi'], ['نیک‌پور', 'Nikpour'], ['امینی', 'Amini'],
  ['سلطانی', 'Soltani'], ['رحیمی', 'Rahimi'], ['فرهادی', 'Farhadi'], ['بهرامی', 'Bahrami'],
]

const provinces = [
  'آذربایجان غربی', 'تهران', 'آذربایجان شرقی', 'اصفهان', 'خراسان رضوی',
  'فارس', 'البرز', 'گیلان', 'کردستان', 'کرمانشاه', 'زنجان', 'مرکزی',
]

const specialties = ['جراح', 'دانشجو', 'متخصص پوست', 'پزشک عمومی', 'پرستار', 'ماما']

const roles: Role[] = [
  { id: 'attendee', title: 'شرکت‌کننده', price: 2_000_000 },
  { id: 'student', title: 'دانشجو', price: 800_000, note: 'تخفیف دانشجویی' },
  { id: 'speaker', title: 'سخنران', price: 0 },
  { id: 'executive', title: 'تیم اجرایی', price: 0 },
  { id: 'scientific', title: 'تیم علمی', price: 0 },
  { id: 'company', title: 'شرکت‌ها', price: 0 },
  { id: 'guest', title: 'میهمان', price: 0 },
]

const workshops: Workshop[] = [
  { id: 'w1', title: 'کارگاه تزریق ژل و فیلر', price: 600_000, capacity: 50, active: true },
  { id: 'w2', title: 'کارگاه بوتاکس پیشرفته', price: 400_000, capacity: 30, active: true },
  { id: 'w3', title: 'کارگاه لیزر و جوان‌سازی پوست', price: 750_000, capacity: 40, active: true },
]

const roleWeights: [string, number][] = [
  ['attendee', 30], ['student', 9], ['speaker', 3], ['executive', 3],
  ['scientific', 2], ['company', 1], ['guest', 1],
]

export function buildSeed(): AppState {
  const rand = mulberry32(20261030)
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
  const weighted = () => {
    const total = roleWeights.reduce((s, [, w]) => s + w, 0)
    let r = rand() * total
    for (const [id, w] of roleWeights) {
      if ((r -= w) <= 0) return id
    }
    return 'attendee'
  }

  const total = 54
  const attendees: Attendee[] = []
  const usedNids = new Set<string>()
  const workshopCount = new Map<string, number>()
  const now = new Date()

  for (let i = 0; i < total; i++) {
    const isFemale = rand() > 0.48
    const [firstFa, firstEn] = pick(isFemale ? female : male)
    const [lastFa, lastEn] = pick(family)
    const roleId = weighted()
    const isPaying = roleId === 'attendee' || roleId === 'student'
    const role = roles.find((r) => r.id === roleId)!

    let nid = ''
    do {
      nid = String(Math.floor(rand() * 9_000_000_000) + 1_000_000_000)
    } while (usedNids.has(nid))
    usedNids.add(nid)

    const daysAgo = Math.min(13, Math.floor((i / total) * 14) + Math.floor(rand() * 2))
    const registeredAt = addDays(now, -daysAgo)
    registeredAt.setHours(9 + Math.floor(rand() * 8), Math.floor(rand() * 60), 0, 0)

    // workshop picks
    const workshopIds: string[] = []
    if (isPaying || rand() > 0.8) {
      for (const w of workshops) {
        const used = workshopCount.get(w.id) ?? 0
        if (used >= w.capacity) continue
        if (rand() < 0.42) {
          workshopIds.push(w.id)
          workshopCount.set(w.id, used + 1)
        }
      }
    }

    const mealId = rand() < 0.82 ? 'lunch' : rand() < 0.4 ? 'dinner' : null
    const mealPrice = mealId === 'lunch' ? 250_000 : mealId === 'dinner' ? 220_000 : 0
    const workshopsTotal = workshopIds.reduce(
      (s, id) => s + (workshops.find((w) => w.id === id)?.price ?? 0),
      0,
    )
    const discount = roleId === 'student' && rand() < 0.3 ? 100_000 : 0
    const amount = Math.max(0, role.price + mealPrice + workshopsTotal - discount)

    const payments: Payment[] = []
    if (amount > 0) {
      const methodRoll = rand()
      const method: PaymentMethod = methodRoll < 0.52 ? 'pos' : methodRoll < 0.76 ? 'cash' : 'card'
      const paidAt = new Date(registeredAt)
      paidAt.setMinutes(paidAt.getMinutes() + 10)
      payments.push({
        id: `p${i}`,
        method,
        amount,
        date: paidAt.toISOString(),
        ...(method === 'card'
          ? {
              tracking: String(Math.floor(rand() * 900_000) + 100_000),
              last4: String(Math.floor(rand() * 9000) + 1000),
              depositDate: paidAt.toISOString(),
            }
          : {}),
      })
    }

    const giftRequested = rand() < 0.76
    const badgePrinted = rand() < 0.58
    const delivered = mealId && rand() < 0.62

    const foodDeliveredAt = delivered
      ? (() => {
          const d = new Date(now)
          d.setHours(12, Math.floor(rand() * 45), 0, 0)
          return d.toISOString()
        })()
      : null

    const badgePrintedAt = badgePrinted
      ? (() => {
          const d = new Date(now)
          d.setHours(9 + Math.floor(rand() * 3), Math.floor(rand() * 60), 0, 0)
          return d.toISOString()
        })()
      : null

    const certificateIssuedAt =
      rand() < 0.06
        ? (() => {
            const d = new Date(now)
            d.setHours(16, Math.floor(rand() * 40), 0, 0)
            return d.toISOString()
          })()
        : null

    attendees.push({
      id: `a${i + 1}`,
      firstNameFa: firstFa,
      lastNameFa: lastFa,
      firstNameEn: firstEn,
      lastNameEn: lastEn,
      nationalId: nid,
      phone: `091${Math.floor(rand() * 9) + 1}${String(Math.floor(rand() * 9_000_000) + 1_000_000)}`,
      roleId,
      province: roleId === 'attendee' && rand() < 0.4 ? 'آذربایجان غربی' : pick(provinces),
      specialty: roleId === 'student' ? 'دانشجو' : pick(specialties.filter((s) => s !== 'دانشجو')),
      gender: isFemale ? 'female' : 'male',
      workshopIds,
      mealId,
      giftRequested,
      giftDeliveredAt: giftRequested && rand() < 0.45 ? now.toISOString() : null,
      foodDeliveredAt,
      badgePrintedAt,
      certificateIssuedAt,
      registeredAt: registeredAt.toISOString(),
      payments,
      discount,
    })
  }

  return {
    info: {
      title: 'ورکشاپ ارومیه',
      website: 'workshop-urmia.ir',
      startDate: addDays(now, 12).toISOString(),
      endDate: addDays(now, 13).toISOString(),
      venue: 'ارومیه، سالن اصلی همایش‌ها',
      giftTitle: 'پکیج خوش‌آمدگویی',
      giftStock: 120,
      giftEnabled: true,
      certificateText:
        'در ورکشاپ تخصصی پوست و زیبایی که در تاریخ {date} در {venue} برگزار گردید، شرکت نموده‌اند.',
    },
    roles,
    workshops,
    meals: [
      { id: 'lunch', title: 'ناهار', price: 250_000 },
      { id: 'dinner', title: 'شام', price: 220_000 },
      { id: 'snack', title: 'میان‌وعده', price: 90_000 },
    ],
    sponsors: [
      { id: 's1', name: 'شرکت دارویی آریا', tier: 'طلایی' },
      { id: 's2', name: 'تجهیزات پزشکی پارس', tier: 'نقره‌ای' },
      { id: 's3', name: 'کلینیک زیبایی نیکان', tier: 'برنزی' },
      { id: 's4', name: 'آزمایشگاه پوست رازی', tier: 'نقره‌ای' },
    ],
    attendees,
  }
}

export const todayISO = todayKey()
