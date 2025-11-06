import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Checkout from './pages/Checkout'
import Chat from './pages/Chat'
import Wishlist from './pages/Wishlist'
import Product from './pages/Product'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminDiscounts from './pages/AdminDiscounts'
import SellerProductForm from './pages/SellerProductForm'
import SellerProductEdit from './pages/SellerProductEdit'
import Orders from './pages/Orders'
import Compare from './pages/Compare'
import AdminActivity from './pages/AdminActivity'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Referrals from './pages/Referrals'
import TwoFactor from './pages/TwoFactor'
import Concierge from './pages/Concierge'
import Alerts from './pages/Alerts'
import Addresses from './pages/Addresses'
import PaymentMethods from './pages/PaymentMethods'
import Notifications from './pages/Notifications'
import RecentlyViewed from './pages/RecentlyViewed'
import Returns from './pages/Returns'
import OrderQueue from './pages/OrderQueue'

export default function App(){
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    function onOn(){ setOnline(true) }
    function onOff(){ setOnline(false) }
    window.addEventListener('online', onOn)
    window.addEventListener('offline', onOff)
    return () => { window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff) }
  }, [])
  return (
    <div className="min-h-screen page-shell pb-6">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white border px-3 py-2 rounded-xl z-50">Skip to content</a>
      <Navbar />
      {!online && (
        <div role="status" aria-live="polite" className="text-amber-900 text-sm py-2 px-4">
          <div className="max-w-6xl mx-auto surface rounded-2xl px-4 py-2 bg-amber-50 border-amber-200">You are offline. Some features may be unavailable.</div>
        </div>
      )}
      <main id="main" className="max-w-6xl mx-auto p-4 md:p-5">
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
          <Route path="/concierge" element={<Concierge/>} />
          <Route path="/alerts" element={<Alerts/>} />
          <Route path="/addresses" element={<Addresses/>} />
          <Route path="/payment-methods" element={<PaymentMethods/>} />
          <Route path="/notifications" element={<Notifications/>} />
          <Route path="/recently-viewed" element={<RecentlyViewed/>} />
          <Route path="/returns" element={<Returns/>} />
          <Route path="/order-queue" element={<OrderQueue/>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
