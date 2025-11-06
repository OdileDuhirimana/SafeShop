import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateQty, removeFromCart } from '../store'
import { api } from '../lib/api'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'

export default function Cart(){
  const { t } = useI18n()
  const items = useSelector((s) => s.cart.items)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">{t('yourCart')}</h1>
        <p className="text-slate-600 mt-1">Review your items before checkout.</p>
      </div>

      <div role="status" aria-live="polite" className="sr-only" id="cart-live" />
      {items.length === 0 ? (
        <div className="surface rounded-3xl p-6 text-slate-700">
          <p>{t('yourCart')}: 0 · <Link to="/" className="text-orange-600 font-semibold">{t('continueShopping')}</Link></p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-3">
            {items.map((it) => (
              <div key={it.productId} className="surface rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{it.title}</div>
                  <div className="text-sm text-slate-600">${it.price}</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`qty-${it.productId}`}>Qty</label>
                  <input
                    id={`qty-${it.productId}`}
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={async (e) => {
                      const q = Number(e.target.value)
                      dispatch(updateQty({ productId: it.productId, quantity: q }))
                      try { await api.post('/cart/update', { productId: it.productId, quantity: q }) } catch {}
                      const live = document.getElementById('cart-live')
                      if (live) live.textContent = `${it.title} quantity updated to ${q}`
                    }}
                    className="px-2 py-2 w-20"
                  />
                  <button
                    aria-label={`Remove ${it.title}`}
                    onClick={async () => {
                      dispatch(removeFromCart({ productId: it.productId }))
                      try { await api.post('/cart/remove', { productId: it.productId }) } catch {}
                      const live = document.getElementById('cart-live')
                      if (live) live.textContent = `${it.title} removed from cart`
                    }}
                    className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700"
                  >
                    {t('remove') || 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="surface-strong rounded-3xl p-4 md:p-5 sticky top-28">
            <div className="text-sm text-slate-500 uppercase tracking-wide font-bold">Order Summary</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{t('subtotal')}: ${total.toFixed(2)}</div>
            <button onClick={() => navigate('/checkout')} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl w-full font-bold">{t('checkout')}</button>
            <div className="text-sm text-slate-600 mt-2">{t('continueShopping')}</div>
          </aside>
        </div>
      )}
    </div>
  )
}
