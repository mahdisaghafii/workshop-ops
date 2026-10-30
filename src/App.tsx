import { useEffect, useState } from 'react'
import { Shell } from './components/Shell'
import { Dashboard } from './pages/Dashboard'
import { Register } from './pages/Register'
import { Badges } from './pages/Badges'
import { Cashbox } from './pages/Cashbox'
import { Workshops } from './pages/Workshops'
import { Food } from './pages/Food'
import { Certificates } from './pages/Certificates'
import { BaseInfo } from './pages/BaseInfo'
import { Reports } from './pages/Reports'
import type { PageKey } from './lib/types'

export default function App() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [badgeFocus, setBadgeFocus] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [page])

  return (
    <Shell page={page} setPage={setPage}>
      {page === 'dashboard' && <Dashboard go={setPage} />}
      {page === 'register' && (
        <Register
          onRegistered={(a) => {
            setBadgeFocus(a.nationalId)
            setPage('badges')
          }}
        />
      )}
      {page === 'badges' && <Badges focus={badgeFocus} onConsumed={() => setBadgeFocus(null)} />}
      {page === 'cashbox' && <Cashbox />}
      {page === 'workshops' && <Workshops />}
      {page === 'food' && <Food />}
      {page === 'certificates' && <Certificates focus={badgeFocus} />}
      {page === 'base' && <BaseInfo go={setPage} />}
      {page === 'reports' && <Reports />}
    </Shell>
  )
}
