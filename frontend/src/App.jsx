import React, { useEffect, useState } from 'react'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Checkout from './pages/Checkout'
import Chat from './pages/Chat'
import { useSelector } from 'react-redux'
import Wishlist from './pages/Wishlist'
import Product from './pages/Product'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminDiscounts from './pages/AdminDiscounts'
import SellerProductForm from './pages/SellerProductForm'
import SellerProductEdit from './pages/SellerProductEdit'
import { useI18n } from './i18n.jsx'
import Orders from './pages/Orders'
import Compare from './pages/Compare'
import AdminActivity from './pages/AdminActivity'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Referrals from './pages/Referrals'
import TwoFactor from './pages/TwoFactor'

export default function App(){
  const user = useSelector(s => s.auth.user)
  const { t, lang, setLang } = useI18n()
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD')
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    function onOn(){ setOnline(true) }
    function onOff(){ setOnline(false) }
    window.addEventListener('online', onOn)
    window.addEventListener('offline', onOff)
    return () => { window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff) }
  }, [])

  function changeCurrency(next){
    setCurrency(next)
    localStorage.setItem('currency', next)
  }
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white border px-3 py-2 rounded">Skip to content</a>
      <Navbar />
      {!online && (
        <div role="status" aria-live="polite" className="bg-amber-100 text-amber-900 text-sm py-2">
          <div className="max-w-6xl mx-auto px-4">You are offline. Some features may be unavailable.</div>
        </div>
      )}
      <main id="main" className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Products/>} />
          <Route path="/product/:id" element={<Product/>} />
          <Route path="/cart" element={<Cart/>} />
          <Route path="/wishlist" element={<Wishlist/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/checkout" element={<Checkout/>} />
          <Route path="/chat" element={<Chat/>} />
          <Route path="/orders" element={<Orders/>} />
          <Route path="/compare" element={<Compare/>} />
          <Route path="/seller" element={<SellerDashboard/>} />
          <Route path="/seller/new" element={<SellerProductForm/>} />
          <Route path="/seller/edit/:id" element={<SellerProductEdit/>} />
          <Route path="/admin" element={<AdminDashboard/>} />
          <Route path="/admin/discounts" element={<AdminDiscounts/>} />
          <Route path="/admin/activity" element={<AdminActivity/>} />
          <Route path="/referrals" element={<Referrals/>} />
          <Route path="/security/2fa" element={<TwoFactor/>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
