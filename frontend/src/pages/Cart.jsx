import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateQty, removeFromCart } from '../store'
import { api } from '../lib/api'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'

export default function Cart(){
  const { t } = useI18n()
  const items = useSelector(s => s.cart.items)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{t('yourCart')}</h1>
      <div role="status" aria-live="polite" className="sr-only" id="cart-live" />
      {items.length === 0 ? (
        <p>{t('yourCart')}: 0 — <Link to="/" className="text-blue-600">{t('continueShopping')}</Link></p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {items.map(it => (
              <div key={it.productId} className="bg-white rounded shadow p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{it.title}</div>
                  <div className="text-sm text-gray-600">${it.price}</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`qty-${it.productId}`}>Qty</label>
                  <input id={`qty-${it.productId}`} type="number" min={1} value={it.quantity} onChange={async (e)=>{
                    const q = Number(e.target.value)
                    dispatch(updateQty({ productId: it.productId, quantity: q }))
                    try { await api.post('/cart/update', { productId: it.productId, quantity: q }) } catch {}
                    const live = document.getElementById('cart-live'); if (live) live.textContent = `${it.title} quantity updated to ${q}`
                  }} className="border px-2 py-1 w-20" />
                  <button aria-label={`Remove ${it.title}`} onClick={async ()=>{
                    dispatch(removeFromCart({ productId: it.productId }))
                    try { await api.post('/cart/remove', { productId: it.productId }) } catch {}
                    const live = document.getElementById('cart-live'); if (live) live.textContent = `${it.title} removed from cart`
                  }} className="text-red-600">{t('remove') || 'Remove'}</button>
                </div>
              </div>
            ))}
          </div>
          <aside className="md:sticky md:top-20 h-max bg-white rounded shadow p-4">
            <div className="text-lg font-bold">{t('subtotal')}: ${total.toFixed(2)}</div>
            <button onClick={()=>navigate('/checkout')} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full">{t('checkout')}</button>
            <div className="text-sm text-gray-600 mt-2">{t('continueShopping')}</div>
          </aside>
        </div>
      )}
    </div>
  )
}
