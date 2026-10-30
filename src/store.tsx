import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { AppState, Attendee, Meal, Role, Sponsor, Workshop, WorkshopInfo } from './lib/types'
import { buildSeed } from './lib/seed'

const STORAGE_KEY = 'workshop-ops-demo-v3'

type Action =
  | { type: 'add-attendee'; attendee: Attendee }
  | { type: 'update-attendee'; id: string; patch: Partial<Attendee> }
  | { type: 'deliver-food'; id: string; at: string }
  | { type: 'undo-food'; id: string }
  | { type: 'deliver-gift'; id: string; at: string }
  | { type: 'print-badge'; id: string; at: string }
  | { type: 'issue-certificate'; id: string; at: string }
  | { type: 'update-info'; patch: Partial<WorkshopInfo> }
  | { type: 'save-role'; role: Role }
  | { type: 'delete-role'; id: string }
  | { type: 'save-workshop'; workshop: Workshop }
  | { type: 'delete-workshop'; id: string }
  | { type: 'save-meal'; meal: Meal }
  | { type: 'delete-meal'; id: string }
  | { type: 'save-sponsor'; sponsor: Sponsor }
  | { type: 'delete-sponsor'; id: string }
  | { type: 'reset' }

function upd(state: AppState, id: string, fn: (a: Attendee) => Attendee): AppState {
  return { ...state, attendees: state.attendees.map((a) => (a.id === id ? fn(a) : a)) }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'add-attendee':
      return { ...state, attendees: [action.attendee, ...state.attendees] }
    case 'update-attendee':
      return upd(state, action.id, (a) => ({ ...a, ...action.patch }))
    case 'deliver-food':
      return upd(state, action.id, (a) => ({ ...a, foodDeliveredAt: action.at }))
    case 'undo-food':
      return upd(state, action.id, (a) => ({ ...a, foodDeliveredAt: null }))
    case 'deliver-gift':
      return upd(state, action.id, (a) => ({ ...a, giftDeliveredAt: action.at }))
    case 'print-badge':
      return upd(state, action.id, (a) => ({ ...a, badgePrintedAt: action.at }))
    case 'issue-certificate':
      return upd(state, action.id, (a) => ({ ...a, certificateIssuedAt: action.at }))
    case 'update-info':
      return { ...state, info: { ...state.info, ...action.patch } }
    case 'save-role': {
      const exists = state.roles.some((r) => r.id === action.role.id)
      return {
        ...state,
        roles: exists
          ? state.roles.map((r) => (r.id === action.role.id ? action.role : r))
          : [...state.roles, action.role],
      }
    }
    case 'delete-role':
      return { ...state, roles: state.roles.filter((r) => r.id !== action.id) }
    case 'save-workshop': {
      const exists = state.workshops.some((w) => w.id === action.workshop.id)
      return {
        ...state,
        workshops: exists
          ? state.workshops.map((w) => (w.id === action.workshop.id ? action.workshop : w))
          : [...state.workshops, action.workshop],
      }
    }
    case 'delete-workshop':
      return { ...state, workshops: state.workshops.filter((w) => w.id !== action.id) }
    case 'save-meal': {
      const exists = state.meals.some((m) => m.id === action.meal.id)
      return {
        ...state,
        meals: exists
          ? state.meals.map((m) => (m.id === action.meal.id ? action.meal : m))
          : [...state.meals, action.meal],
      }
    }
    case 'delete-meal':
      return { ...state, meals: state.meals.filter((m) => m.id !== action.id) }
    case 'save-sponsor': {
      const exists = state.sponsors.some((s) => s.id === action.sponsor.id)
      return {
        ...state,
        sponsors: exists
          ? state.sponsors.map((s) => (s.id === action.sponsor.id ? action.sponsor : s))
          : [...state.sponsors, action.sponsor],
      }
    }
    case 'delete-sponsor':
      return { ...state, sponsors: state.sponsors.filter((s) => s.id !== action.id) }
    case 'reset':
      return buildSeed()
    default:
      return state
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.attendees && parsed.roles && parsed.workshops) return parsed
    }
  } catch {
    /* corrupted demo state — fall back to seed */
  }
  return buildSeed()
}

type Store = {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        /* storage might be full / disabled */
      }
    }, 150)
    return () => window.clearTimeout(id)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
