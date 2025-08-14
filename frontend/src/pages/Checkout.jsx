import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { api } from '../lib/api'
import { clearCart } from '../store'
import { useI18n } from '../i18n.jsx'
import { useNavigate } from 'react-router-dom'

export default function Checkout(){
  const { t } = useI18n()
  const items = useSelector(s => s.cart.items)
  const token = useSelector(s => s.auth.token)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const [discountCode, setDiscountCode] = useState('')
  const [referralCode, setReferralCode] = useState(() => localStorage.getItem('ref_code') || '')
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD')
  const taxRate = Number(import.meta.env.VITE_TAX_RATE || 0)
  const estTax = subtotal * taxRate
  const estTotal = subtotal + estTax

  async function placeOrder(){
    setError('')
    try {
      const { data } = await api.post('/orders/checkout', { items, discountCode: discountCode || undefined, referralCode: referralCode || undefined, currency })
      setResult(data)
      // If simulated payment, consider it paid
      if (data.simulated) {
        dispatch(clearCart())
        setShowModal(true)
        setTimeout(() => navigate('/orders'), 1500)
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Checkout failed')
    }
  }

  async function payWith(provider){
    try {
      if (provider === 'paypal'){
        const { data } = await api.post('/payments/paypal/checkout', { total: estTotal })
        window.open(data.approveUrl, '_blank')
        await placeOrder()
      } else if (provider === 'googlepay'){
        const { data } = await api.post('/payments/googlepay/checkout', { total: estTotal })
        alert(`Google Pay token: ${data.token}`)
        await placeOrder()
      } else if (provider === 'applepay'){
        const { data } = await api.post('/payments/applepay/checkout', { total: estTotal })
        alert(`Apple Pay session: ${data.sessionId}`)
        await placeOrder()
      }
    } catch {}
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">{t('checkout')}</h1>
      <div className="bg-white rounded shadow p-4">
        <label className="block text-sm text-gray-700 mb-1" htmlFor="currency">{t('currency')}</label>
        <select id="currency" value={currency} onChange={e=>setCurrency(e.target.value)} className="border rounded px-2 py-1 mb-3">
          <option>USD</option>
          <option>EUR</option>
          <option>RWF</option>
        </select>
        <div className="flex items-center justify-between mb-2">
          <div>{t('items')}</div>
          <div>{items.length}</div>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between"><div>{t('subtotal')}</div><div>${subtotal.toFixed(2)}</div></div>
          <div className="flex items-center justify-between"><div>{t('estTax')}</div><div>${estTax.toFixed(2)}</div></div>
          <div className="flex items-center justify-between font-semibold"><div>{t('estTotal')}</div><div>${(estTotal).toFixed(2)}</div></div>
        </div>
        <div className="mt-3">
          <label className="block text-sm text-gray-700 mb-1" htmlFor="discount">{t('discountCode')}</label>
          <input id="discount" value={discountCode} onChange={e=>setDiscountCode(e.target.value)} placeholder="e.g., SAVE10" className="border rounded px-3 py-2 w-full" />
        </div>
        <div className="mt-3">
          <label className="block text-sm text-gray-700 mb-1" htmlFor="referral">Referral Code</label>
          <input id="referral" value={referralCode} onChange={e=>setReferralCode(e.target.value)} placeholder="e.g., ABC123" className="border rounded px-3 py-2 w-full" />
        </div>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        <button aria-label={t('placeOrder')} onClick={placeOrder} className="mt-4 bg-green-600 text-white px-4 py-2 rounded w-full">{t('placeOrder')}</button>
        {result && (
          <div className="mt-4 text-sm">
            {result.simulated && <div className="text-green-700">Payment simulated. Order ID: {result.orderId}</div>}
            {result.clientSecret && <div className="text-blue-700">Stripe client secret created. Complete payment on client. Order ID: {result.orderId}</div>}
            {typeof result.total !== 'undefined' && (
              <div className="mt-2">
                <div>{t('currency')}: {result.currency}</div>
                <div>{t('discountCode')}: {result.discountApplied?.toFixed?.(2) || 0}</div>
                <div>{t('estTax')}: {result.tax?.toFixed?.(2) || 0}</div>
                <div className="font-semibold">{t('estTotal')}: {result.total?.toFixed?.(2)}</div>
              </div>
            )}
          </div>
        )}
        <div className="mt-6 border-t pt-4">
          <div className="text-sm text-gray-600 mb-2">{t('otherPaymentMethods')}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button aria-label={t('payWithPayPal')} onClick={()=>payWith('paypal')} className="border rounded px-3 py-2">{t('payWithPayPal')}</button>
            <button aria-label={t('payWithGooglePay')} onClick={()=>payWith('googlepay')} className="border rounded px-3 py-2">{t('payWithGooglePay')}</button>
            <button aria-label={t('payWithApplePay')} onClick={()=>payWith('applepay')} className="border rounded px-3 py-2">{t('payWithApplePay')}</button>
          </div>
        </div>
      </div>
      {showModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow p-6 w-80 text-center">
            <div className="text-lg font-semibold mb-2">{t('paymentConfirmed')}</div>
            <div className="text-sm text-gray-600 mb-4">{t('redirecting')}</div>
            <button onClick={()=>{ setShowModal(false); navigate('/orders') }} className="border rounded px-4 py-2">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

