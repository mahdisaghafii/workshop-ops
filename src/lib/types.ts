export type RoleId = string
export type PaymentMethod = 'pos' | 'cash' | 'card'

export interface Role {
  id: RoleId
  title: string
  price: number
  note?: string
}

export interface Workshop {
  id: string
  title: string
  price: number
  capacity: number
  active: boolean
}

export interface Meal {
  id: string
  title: string
  price: number
}

export interface Sponsor {
  id: string
  name: string
  tier: 'طلایی' | 'نقره‌ای' | 'برنزی'
}

export interface Payment {
  id: string
  method: PaymentMethod
  amount: number
  date: string // ISO
  tracking?: string
  last4?: string
  depositDate?: string
}

export interface Attendee {
  id: string
  firstNameFa: string
  lastNameFa: string
  firstNameEn: string
  lastNameEn: string
  nationalId: string
  phone: string
  roleId: RoleId
  province: string
  specialty: string
  gender: 'male' | 'female'
  workshopIds: string[]
  mealId: string | null
  giftRequested: boolean
  giftDeliveredAt: string | null
  foodDeliveredAt: string | null
  badgePrintedAt: string | null
  certificateIssuedAt: string | null
  registeredAt: string
  payments: Payment[]
  discount: number
}

export interface WorkshopInfo {
  title: string
  website: string
  startDate: string
  endDate: string
  venue: string
  giftTitle: string
  giftStock: number
  giftEnabled: boolean
  certificateText: string
}

export interface AppState {
  info: WorkshopInfo
  roles: Role[]
  workshops: Workshop[]
  meals: Meal[]
  sponsors: Sponsor[]
  attendees: Attendee[]
}

export type PageKey =
  | 'dashboard'
  | 'register'
  | 'badges'
  | 'cashbox'
  | 'workshops'
  | 'food'
  | 'certificates'
  | 'base'
  | 'reports'
