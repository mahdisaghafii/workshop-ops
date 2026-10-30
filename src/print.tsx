import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

const PrintContext = createContext<{ print: (node: ReactNode) => void } | null>(null)

/**
 * Declares the paper for the job it wraps. Mounted only while printing, so it
 * wins over the global `@page` rule and each document gets the right size
 * without the operator having to pick one in the print dialog.
 */
export function PrintPage({
  size,
  children,
}: {
  size: '85mm 55mm' | 'A4' | 'A4 landscape'
  children: ReactNode
}) {
  return (
    <>
      <style>{`@page { size: ${size}; margin: 0; }`}</style>
      {children}
    </>
  )
}

/**
 * Renders print-only content through a portal on <body>, so the app shell can be
 * hidden with `display:none` while printing. That keeps pagination correct:
 * a badge prints one 85×55mm page, a certificate one A4 landscape page, and
 * long reports flow across as many pages as they need.
 */
export function PrintProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<ReactNode>(null)

  useEffect(() => {
    const after = () => setNode(null)
    window.addEventListener('afterprint', after)
    return () => window.removeEventListener('afterprint', after)
  }, [])

  const print = useCallback((next: ReactNode) => {
    setNode(next)
    window.setTimeout(() => window.print(), 120)
  }, [])

  return (
    <PrintContext.Provider value={{ print }}>
      {children}
      {node
        ? createPortal(<div className="print-root">{node}</div>, document.body)
        : null}
    </PrintContext.Provider>
  )
}

export function usePrint() {
  const ctx = useContext(PrintContext)
  if (!ctx) throw new Error('usePrint must be used inside PrintProvider')
  return ctx
}
