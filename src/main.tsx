import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { StoreProvider } from './store'
import { ToastProvider } from './components/Toast'
import { PrintProvider } from './print'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <ToastProvider>
        <PrintProvider>
          <App />
        </PrintProvider>
      </ToastProvider>
    </StoreProvider>
  </StrictMode>,
)
