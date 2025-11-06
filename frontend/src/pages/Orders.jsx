import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../i18n.jsx'

const cancelable = new Set(['pending', 'paid', 'processing'])
const returnable = new Set(['paid', 'delivered'])

function statusClass(status){
  if (status === 'delivered' || status === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'pending' || status === 'processing' || status === 'shipped') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (status === 'canceled' || status === 'failed') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

export default function Orders(){
  const { t } = useI18n()
  const [orders, setOrders] = useState([])
  const [returnsMap, setReturnsMap] = useState({})
  const [timelineMap, setTimelineMap] = useState({})
  const [cancelReason, setCancelReason] = useState({})
  const [returnReason, setReturnReason] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll(){
    setLoading(true)
    setError('')
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/returns/mine').catch(() => ({ data: [] })),
      ])
      setOrders(ordersRes.data || [])
      const mapped = {}
      for (const r of returnsRes.data || []) mapped[String(r.orderId)] = r
      setReturnsMap(mapped)
    } catch {
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  async function downloadInvoice(id){
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${apiBase}/api/orders/${id}/invoice`, {
        credentials: 'include',
        headers: { Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '' },
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${id}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {}
  }

  async function openTimeline(id){
    try {
      const { data } = await api.get(`/orders/${id}/timeline`)
      setTimelineMap((prev) => ({ ...prev, [id]: data }))
    } catch {}
  }

  async function cancelOrder(id){
    try {
      await api.post(`/orders/${id}/cancel`, { reason: cancelReason[id] || 'Canceled by customer' })
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to cancel order')
    }
  }

  async function requestReturn(order){
    try {
      const reason = returnReason[order._id] || 'Customer requested return'
      const items = (order.items || []).map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity || 1),
        reason,
      }))
      if (items.length === 0) return
      await api.post('/returns', { orderId: order._id, items })
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create return request')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">{t('yourOrders') || 'Your Orders'}</h1>
          <p className="text-slate-600 mt-1">Track orders, request returns, and download invoices.</p>
        </div>
        <button onClick={loadAll} className="px-3 py-2 rounded-xl border border-slate-200 bg-white">Refresh</button>
      </div>

      {error && <div className="surface rounded-2xl p-3 text-red-700 bg-red-50 border-red-200 text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse surface rounded-2xl p-4 h-24" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="surface rounded-3xl p-6 text-slate-600">{t('noOrdersYet') || 'No orders yet.'}</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const r = returnsMap[String(o._id)]
            const timeline = timelineMap[o._id]
            return (
              <div key={o._id} className="surface rounded-3xl p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{t('order') || 'Order'} #{o._id}</div>
                    <div className="text-sm text-slate-600 mt-1">{t('estTotal') || 'Total'}: ${Number(o.total || 0).toFixed(2)}</div>
                    {o.trackingNumber && <div className="text-sm text-slate-600">Tracking: {o.trackingNumber}</div>}
                    {o.cancellationReason && <div className="text-sm text-red-700">Cancellation: {o.cancellationReason}</div>}
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end items-center">
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${statusClass(o.status)}`}>{o.status}</span>
                    {(o.status === 'paid' || o.status === 'delivered' || o.status === 'refunded') && (
                      <button aria-label={t('downloadInvoice') || 'Download Invoice'} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm" onClick={() => downloadInvoice(o._id)}>{t('downloadInvoice') || 'Download Invoice'}</button>
                    )}
                    <button className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm" onClick={() => openTimeline(o._id)}>Timeline</button>
                  </div>
                </div>

                <div className="mt-3 text-sm space-y-1 text-slate-700">
                  {(o.items || []).map((it, idx) => (
                    <div key={idx}>{it.title || it.productId} · Qty {it.quantity} · ${it.price}</div>
                  ))}
                </div>

                <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                  {cancelable.has(o.status) && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="font-semibold mb-1">Cancel order</div>
                      <input value={cancelReason[o._id] || ''} onChange={(e) => setCancelReason({ ...cancelReason, [o._id]: e.target.value })} placeholder="Reason" className="px-3 py-2.5 w-full mb-2" />
                      <button className="px-3 py-2 rounded-xl border border-slate-200 bg-white" onClick={() => cancelOrder(o._id)}>Cancel order</button>
                    </div>
                  )}

                  {returnable.has(o.status) && !r && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="font-semibold mb-1">Request return</div>
                      <input value={returnReason[o._id] || ''} onChange={(e) => setReturnReason({ ...returnReason, [o._id]: e.target.value })} placeholder="Return reason" className="px-3 py-2.5 w-full mb-2" />
                      <button className="px-3 py-2 rounded-xl border border-slate-200 bg-white" onClick={() => requestReturn(o)}>Submit return request</button>
                    </div>
                  )}

                  {r && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="font-semibold">Return request #{r._id}</div>
                      <div className="text-slate-700">Status: {r.status}</div>
                      {r.resolutionNote && <div className="text-slate-700">Note: {r.resolutionNote}</div>}
                    </div>
                  )}
                </div>

                {timeline && (
                  <div className="mt-3 bg-white rounded-2xl border border-slate-200 p-3">
                    <div className="font-semibold text-sm mb-1">Timeline ({timeline.status})</div>
                    <div className="space-y-2">
                      {(timeline.events || []).map((evt) => (
                        <div key={evt._id} className="text-sm border border-slate-200 rounded-xl p-2 bg-slate-50">
                          <div className="font-semibold">{evt.type}</div>
                          <div className="text-slate-600">{evt.note || 'No note'}</div>
                          <div className="text-xs text-slate-500">{new Date(evt.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                      {(timeline.events || []).length === 0 && <div className="text-sm text-slate-600">No events yet.</div>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
