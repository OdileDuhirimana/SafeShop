import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { clearCart } from '../store'
import { useI18n } from '../i18n.jsx'

export default function Checkout(){
  const { t } = useI18n()
  const items = useSelector((s) => s.cart.items)
  const token = useSelector((s) => s.auth.token)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimization, setOptimization] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [shippingAddressId, setShippingAddressId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const [discountCode, setDiscountCode] = useState('')
  const [referralCode, setReferralCode] = useState(() => localStorage.getItem('ref_code') || '')
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD')
  const taxRate = Number(import.meta.env.VITE_TAX_RATE || 0)
  const estTax = subtotal * taxRate
  const estTotal = subtotal + estTax

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const [{ data: addr }, { data: methods }] = await Promise.all([
          api.get('/addresses'),
          api.get('/payment-methods'),
        ])
        setAddresses(addr || [])
        setPaymentMethods(methods || [])
        const defaultAddr = (addr || []).find((x) => x.isDefault) || (addr || [])[0]
        const defaultPm = (methods || []).find((x) => x.isDefault) || (methods || [])[0]
        setShippingAddressId(defaultAddr?._id || '')
        setPaymentMethodId(defaultPm?._id || '')
      } catch {}
    })()
  }, [token])

  async function placeOrder(){
    setError('')
    if (!token) {
      setError('Please login before checkout')
      return
    }
    try {
      const { data } = await api.post('/orders/checkout', {
        items,
        discountCode: discountCode || undefined,
        referralCode: referralCode || undefined,
        currency,
        shippingAddressId: shippingAddressId || undefined,
        paymentMethodId: paymentMethodId || undefined,
      })
      setResult(data)
      if (data.simulated) {
        dispatch(clearCart())
        setShowModal(true)
        setTimeout(() => navigate('/orders'), 1500)
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Checkout failed')
    }
  }

  async function optimizeSavings(){
    setOptimizing(true)
    setOptimization(null)
    setError('')
    try {
      const { data } = await api.post('/orders/optimize', { items, currency, discountCode: discountCode || undefined })
      setOptimization(data)
      if (data?.best?.code && data.best.code !== discountCode) {
        setDiscountCode(data.best.code)
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to optimize savings')
    } finally {
      setOptimizing(false)
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
    <div className="space-y-6">
      <div>
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">Checkout</h1>
        <p className="text-slate-600 mt-1">Fast, secure, and optimized for the best total price.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-4">
          <section className="surface rounded-3xl p-4 md:p-5">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Step 1 · Delivery & Payment</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-slate-700">Shipping address</label>
                  <Link to="/addresses" className="text-sm text-orange-600">Manage</Link>
                </div>
                <select value={shippingAddressId} onChange={(e) => setShippingAddressId(e.target.value)} className="w-full px-3 py-2.5">
                  <option value="">No address selected</option>
                  {addresses.map((a) => (
                    <option key={a._id} value={a._id}>{a.label}: {a.line1}, {a.city}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-slate-700">Payment method</label>
                  <Link to="/payment-methods" className="text-sm text-orange-600">Manage</Link>
                </div>
                <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="w-full px-3 py-2.5">
                  <option value="">No payment method selected</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm._id} value={pm._id}>{pm.provider} · {pm.brand} · ****{pm.last4}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="surface rounded-3xl p-4 md:p-5">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Step 2 · Offers & Codes</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('discountCode')}</label>
                <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="e.g., SAVE10" className="w-full px-3 py-2.5" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Referral Code</label>
                <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="e.g., ABC123" className="w-full px-3 py-2.5" />
              </div>
            </div>
            <button onClick={optimizeSavings} className="mt-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50" disabled={optimizing || items.length === 0}>
              {optimizing ? t('loading') : t('findBestSavings')}
            </button>

            {optimization?.best && (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <div>{t('bestCode')}: <span className="font-bold">{optimization.best.code || t('noCode')}</span></div>
                <div>{t('potentialSavings')}: <span className="font-bold">${Number(optimization.potentialSavings || 0).toFixed(2)}</span></div>
              </div>
            )}
          </section>

          <section className="surface rounded-3xl p-4 md:p-5">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Step 3 · Confirm Payment</div>
            <div>
              {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
              <button aria-label={t('placeOrder')} onClick={placeOrder} className="w-full px-4 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600">{t('placeOrder')}</button>
            </div>
            <div className="mt-3 text-sm text-slate-500">Or pay with</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <button aria-label={t('payWithPayPal')} onClick={() => payWith('paypal')} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white">{t('payWithPayPal')}</button>
              <button aria-label={t('payWithGooglePay')} onClick={() => payWith('googlepay')} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white">{t('payWithGooglePay')}</button>
              <button aria-label={t('payWithApplePay')} onClick={() => payWith('applepay')} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white">{t('payWithApplePay')}</button>
            </div>
          </section>
        </div>

        <aside className="surface-strong rounded-3xl p-4 md:p-5 sticky top-28">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Order Summary</div>
          <div className="mb-3">
            <label className="block text-sm text-slate-700 mb-1" htmlFor="currency">{t('currency')}</label>
            <select id="currency" value={currency} onChange={(e) => { setCurrency(e.target.value); localStorage.setItem('currency', e.target.value) }} className="w-full px-3 py-2.5">
              <option>USD</option>
              <option>EUR</option>
              <option>RWF</option>
            </select>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>{t('items')}</span><span>{items.length}</span></div>
            <div className="flex items-center justify-between"><span>{t('subtotal')}</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span>{t('estTax')}</span><span>${estTax.toFixed(2)}</span></div>
            <div className="flex items-center justify-between text-lg font-extrabold pt-2 border-t border-slate-200"><span>{t('estTotal')}</span><span>${estTotal.toFixed(2)}</span></div>
          </div>

          {result && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {result.simulated && <div className="text-emerald-700 font-semibold">Payment simulated. Order ID: {result.orderId}</div>}
              {result.clientSecret && <div className="text-blue-700 font-semibold">Stripe payment initialized. Order ID: {result.orderId}</div>}
              {typeof result.total !== 'undefined' && (
                <div className="mt-2 text-slate-700">
                  <div>{t('currency')}: {result.currency}</div>
                  <div>{t('estTotal')}: {result.total?.toFixed?.(2)}</div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {showModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="surface-strong rounded-3xl p-6 w-80 text-center">
            <div className="brand-font text-xl font-bold mb-2">{t('paymentConfirmed')}</div>
            <div className="text-sm text-slate-600 mb-4">{t('redirecting')}</div>
            <button onClick={() => { setShowModal(false); navigate('/orders') }} className="border border-slate-200 rounded-xl px-4 py-2">{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
