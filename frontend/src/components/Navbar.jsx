import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useI18n } from '../i18n.jsx'
import { api } from '../lib/api'
import { logout } from '../store'
import { setAuthToken } from '../lib/api'

export default function Navbar(){
  const dispatch = useDispatch()
  const user = useSelector((s) => s.auth.user)
  const token = useSelector((s) => s.auth.token)
  const { t, lang, setLang } = useI18n()
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD')
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState({ queries: [], products: [] })
  const [trending, setTrending] = useState([])
  const [showSuggest, setShowSuggest] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setQ(params.get('q') || '')
  }, [location.search])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data } = await api.get('/search/trending')
        if (active) setTrending((data || []).slice(0, 6))
      } catch {}
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setSuggestions({ queries: [], products: [] })
      return
    }
    const id = setTimeout(async () => {
      try {
        const { data } = await api.get('/search/suggest', { params: { q: term } })
        setSuggestions(data || { queries: [], products: [] })
      } catch {
        setSuggestions({ queries: [], products: [] })
      }
    }, 180)
    return () => clearTimeout(id)
  }, [q])

  function changeCurrency(next){
    setCurrency(next)
    try { localStorage.setItem('currency', next) } catch {}
  }

  function submitSearch(e){
    e.preventDefault()
    const params = new URLSearchParams(location.search)
    const term = q.trim()
    if (term) params.set('q', term)
    else params.delete('q')
    navigate('/?' + params.toString())
    setShowSuggest(false)
  }

  function chooseSuggestion(term){
    const params = new URLSearchParams(location.search)
    params.set('q', term)
    setQ(term)
    navigate('/?' + params.toString())
    setShowSuggest(false)
  }

  function doLogout(){
    dispatch(logout())
    setAuthToken(null)
    try { localStorage.removeItem('auth_user') } catch {}
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 pt-3 px-3 md:px-4">
      <div className="max-w-6xl mx-auto surface rounded-3xl px-3 md:px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link aria-label="Home" to="/" className="brand-font text-xl font-extrabold text-slate-900 tracking-tight">SafeShop</Link>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
                <span className="chip">Fast shipping</span>
                <span className="chip">Buyer protection</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <select id="currency" aria-label="Currency" value={currency} onChange={(e) => changeCurrency(e.target.value)} className="px-2 py-1.5">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RWF">RWF</option>
              </select>
              <button aria-label="Toggle language" onClick={() => setLang(lang === 'en' ? 'rw' : 'en')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">{lang.toUpperCase()}</button>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-sm font-semibold">Hi, {user.name}</span>
                  <button onClick={doLogout} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm">Logout</button>
                </div>
              ) : (
                <Link to="/login" className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">{t('login')}</Link>
              )}
            </div>
          </div>

          <form onSubmit={submitSearch} className="relative">
            <label htmlFor="nav-search" className="sr-only">{t('search')}</label>
            <input
              id="nav-search"
              value={q}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('searchProducts')}
              className="w-full pr-28 px-4 py-3"
            />
            <button className="absolute right-1.5 top-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600">{t('search')}</button>

            {showSuggest && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 text-sm">
                {q.trim().length < 2 ? (
                  <div>
                    <div className="text-xs text-slate-500 px-2 py-1">Trending searches</div>
                    <div className="flex flex-wrap gap-2 p-2">
                      {trending.map((item) => (
                        <button key={item._id} type="button" onClick={() => chooseSuggestion(item.query)} className="chip hover:border-orange-300 hover:text-orange-700">
                          {item.query}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-auto">
                    {(suggestions.queries || []).map((term) => (
                      <button key={term} type="button" onClick={() => chooseSuggestion(term)} className="block text-left w-full px-3 py-2 hover:bg-slate-50 rounded-xl">
                        {term}
                      </button>
                    ))}
                    {(suggestions.products || []).map((p) => (
                      <Link key={p._id} to={`/product/${p._id}`} className="block px-3 py-2 hover:bg-slate-50 rounded-xl" onClick={() => setShowSuggest(false)}>
                        {p.title} · ${p.price}
                      </Link>
                    ))}
                    {(suggestions.queries || []).length === 0 && (suggestions.products || []).length === 0 && (
                      <div className="px-3 py-2 text-slate-500">No suggestions</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>

          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-sm">
            <Link to="/" className="chip hover:border-slate-300">{t('products')}</Link>
            <Link to="/cart" className="chip hover:border-slate-300">{t('cart')}</Link>
            <Link to="/orders" className="chip hover:border-slate-300">Orders</Link>
            <Link to="/wishlist" className="chip hover:border-slate-300">Wishlist</Link>
            <Link to="/concierge" className="chip hover:border-slate-300">{t('concierge')}</Link>
            {token && <Link to="/recently-viewed" className="chip hover:border-slate-300">History</Link>}
            {token && <Link to="/alerts" className="chip hover:border-slate-300">{t('priceAlerts')}</Link>}
            {token && <Link to="/notifications" className="chip hover:border-slate-300">Notifications</Link>}
            {token && <Link to="/returns" className="chip hover:border-slate-300">Returns</Link>}
            {token && <Link to="/addresses" className="chip hover:border-slate-300">Addresses</Link>}
            {token && <Link to="/payment-methods" className="chip hover:border-slate-300">Payments</Link>}
            {token && <Link to="/referrals" className="chip hover:border-slate-300">Referrals</Link>}
            <Link to="/chat" className="chip hover:border-slate-300">{t('chat')}</Link>
            {user?.role === 'seller' && <Link to="/seller" className="chip bg-amber-50 text-amber-800 border-amber-200">Seller</Link>}
            {user?.role === 'seller' && <Link to="/order-queue" className="chip bg-amber-50 text-amber-800 border-amber-200">Queue</Link>}
            {user?.role === 'seller' && <Link to="/seller/new" className="chip bg-amber-50 text-amber-800 border-amber-200">New Product</Link>}
            {user?.role === 'admin' && <Link to="/admin" className="chip bg-red-50 text-red-700 border-red-200">Admin</Link>}
            {user?.role === 'admin' && <Link to="/order-queue" className="chip bg-red-50 text-red-700 border-red-200">Queue</Link>}
            {user?.role === 'admin' && <Link to="/admin/discounts" className="chip bg-red-50 text-red-700 border-red-200">Discounts</Link>}
            {user?.role === 'admin' && <Link to="/admin/activity" className="chip bg-red-50 text-red-700 border-red-200">Activity</Link>}
          </nav>
        </div>
      </div>
    </header>
  )
}
