import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useI18n } from '../i18n.jsx'

export default function Navbar(){
  const user = useSelector(s => s.auth.user)
  const { t, lang, setLang } = useI18n()
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD')
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')

  useEffect(()=>{ const params = new URLSearchParams(location.search); setQ(params.get('q') || '') }, [location.search])

  function changeCurrency(next){
    setCurrency(next)
    try { localStorage.setItem('currency', next) } catch {}
  }
  function onSearch(e){
    e.preventDefault()
    const url = new URL(window.location.href)
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q')
    navigate(`/` + url.search)
  }

  return (
    <header className="bg-white/95 backdrop-blur border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto p-3 md:p-4">
        <div className="flex items-center gap-4">
          <Link aria-label="Home" to="/" className="font-bold text-xl text-slate-900">SafeShop</Link>
          <form onSubmit={onSearch} className="hidden md:flex items-center gap-2 flex-1">
            <label htmlFor="nav-search" className="sr-only">{t('search')}</label>
            <input id="nav-search" value={q} onChange={e=>setQ(e.target.value)} placeholder={t('searchProducts')} className="border rounded px-3 py-2 w-full" />
            <button className="border rounded px-3 py-2">{t('search')}</button>
          </form>
          <nav className="flex items-center gap-3 md:gap-4 text-slate-700">
            <Link to="/">{t('products')}</Link>
            <Link to="/cart">{t('cart')}</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/wishlist">Wishlist</Link>
            {user && <Link to="/referrals">Referrals</Link>}
            <Link to="/chat">{t('chat')}</Link>
            {user?.role === 'seller' && (
              <>
                <Link to="/seller" className="text-amber-700">Seller</Link>
                <Link to="/seller/new" className="text-amber-700">New Product</Link>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <Link to="/admin" className="text-red-700">Admin</Link>
                <Link to="/admin/discounts" className="text-red-700">Discounts</Link>
                <Link to="/admin/activity" className="text-red-700">Activity</Link>
              </>
            )}
            <label className="sr-only" htmlFor="currency">Currency</label>
            <select id="currency" aria-label="Currency" value={currency} onChange={e=>changeCurrency(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="RWF">RWF</option>
            </select>
            <button aria-label="Toggle language" onClick={()=>setLang(lang==='en'?'rw':'en')} className="px-2 py-1 border rounded text-sm">{lang.toUpperCase()}</button>
            {user ? <span className="text-sm" aria-label={`Welcome ${user.name}`}>Hi, {user.name}</span> : <Link to="/login" className="text-blue-600">{t('login')}</Link>}
          </nav>
        </div>
        <form onSubmit={onSearch} className="md:hidden mt-2 flex items-center gap-2">
          <label htmlFor="nav-search-sm" className="sr-only">{t('search')}</label>
          <input id="nav-search-sm" value={q} onChange={e=>setQ(e.target.value)} placeholder={t('searchProducts')} className="border rounded px-3 py-2 w-full" />
          <button className="border rounded px-3 py-2">{t('search')}</button>
        </form>
      </div>
    </header>
  )
}
