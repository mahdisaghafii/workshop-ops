import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'

type ToastKind = 'success' | 'info' | 'error'
type ToastItem = { id: number; kind: ToastKind; title: string; description?: string }

const ToastContext = createContext<{
  push: (kind: ToastKind, title: string, description?: string) => void
} | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const push = useCallback((kind: ToastKind, title: string, description?: string) => {
    const id = ++seq.current
    setToasts((t) => [...t, { id, kind, title, description }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 left-5 z-[100] flex w-[340px] max-w-[calc(100vw-2.5rem)] flex-col gap-2 no-print">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-3.5 shadow-lg shadow-ink-900/5 animate-[toast-in_.18s_ease-out]"
            >
              <span
                className={
                  t.kind === 'success'
                    ? 'text-success'
                    : t.kind === 'error'
                      ? 'text-danger'
                      : 'text-info'
                }
              >
                {t.kind === 'success' ? (
                  <CheckCircle2 size={20} />
                ) : t.kind === 'error' ? (
                  <AlertTriangle size={20} />
                ) : (
                  <Info size={20} />
                )}
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-ink-800">{t.title}</div>
                {t.description && (
                  <div className="mt-0.5 text-[12px] leading-5 text-ink-500">{t.description}</div>
                )}
              </div>
              <button
                onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
                className="text-ink-400 hover:text-ink-600"
                aria-label="بستن"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
