import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import store from './store'
import { setAuth } from './store'
import './index.css'
import App from './App'
import { I18nProvider } from './i18n.jsx'
import { setAuthToken } from './lib/api'

// Capture referral code from URL once and persist
try {
  const url = new URL(window.location.href)
  const ref = url.searchParams.get('ref')
  if (ref) {
    localStorage.setItem('ref_code', ref)
    url.searchParams.delete('ref')
    window.history.replaceState({}, '', url.toString())
  }
} catch {}

// Initialize auth header from persisted token
try {
  const tok = localStorage.getItem('auth_token')
  const userRaw = localStorage.getItem('auth_user')
  if (tok) {
    setAuthToken(tok)
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw)
        if (user && user.id) {
          store.dispatch(setAuth({ token: tok, user }))
        }
      } catch {}
    }
  }
} catch {}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nProvider>
    </Provider>
  </React.StrictMode>
)

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
