import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { api } from '../lib/api'

const queueStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'returned', 'failed', 'canceled', 'refunded']

export default function OrderQueue(){
  const token = useSelector((s) => s.auth.token)
  const user = useSelector((s) => s.auth.user)
  const [items, setItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [nextStatus, setNextStatus] = useState({})
  const [tracking, setTracking] = useState({})
  const [note, setNote] = useState({})
  const [force, setForce] = useState({})
  const [timeline, setTimeline] = useState({ orderId: null, status: '', events: [] })
  const [loading, setLoading] = useState(true)

  const allowed = user?.role === 'seller' || user?.role === 'admin'

  useEffect(() => {
    if (!token || !allowed) {
      setLoading(false)
      return
    }
    load(statusFilter)
  }, [token, allowed, statusFilter])

  async function load(status){
    setLoading(true)
    try {
      const { data } = await api.get('/orders/queue', { params: status ? { status } : {} })
      setItems(data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(orderId){
    const status = nextStatus[orderId]
    if (!status) return
    try {
      await api.post(`/orders/${orderId}/status`, {
        status,
        trackingNumber: tracking[orderId] || undefined,
        note: note[orderId] || '',
        force: Boolean(force[orderId]),
      })
      await load(statusFilter)
    } catch {}
  }

  async function openTimeline(orderId){
    try {
      const { data } = await api.get(`/orders/${orderId}/timeline`)
      setTimeline(data)
    } catch {
      setTimeline({ orderId, status: '', events: [] })
    }
  }

  if (!token) return <div className="text-sm text-gray-600">Log in to access order queue.</div>
  if (!allowed) return <div className="text-sm text-gray-600">Only seller/admin roles can access this page.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Order Queue</h1>
        <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {queueStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {items.length === 0 && <div className="text-sm text-gray-600">No orders in queue.</div>}
          {items.map((o) => (
            <div key={o._id} className="bg-white rounded shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Order #{o._id}</div>
                  <div className="text-sm text-gray-600">Status: {o.status} · Total: {o.total}</div>
                </div>
                <button onClick={() => openTimeline(o._id)} className="border rounded px-3 py-2 text-sm">Timeline</button>
              </div>

              <div className="grid lg:grid-cols-5 gap-2 mt-3 text-sm">
                <select value={nextStatus[o._id] || ''} onChange={(e) => setNextStatus({ ...nextStatus, [o._id]: e.target.value })} className="border rounded px-3 py-2">
                  <option value="">Next status</option>
                  {queueStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={tracking[o._id] || ''} onChange={(e) => setTracking({ ...tracking, [o._id]: e.target.value })} placeholder="Tracking number" className="border rounded px-3 py-2" />
                <input value={note[o._id] || ''} onChange={(e) => setNote({ ...note, [o._id]: e.target.value })} placeholder="Event note" className="border rounded px-3 py-2 lg:col-span-2" />
                <button onClick={() => updateStatus(o._id)} className="border rounded px-3 py-2">Update</button>
              </div>

              {user?.role === 'admin' && (
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={Boolean(force[o._id])} onChange={(e) => setForce({ ...force, [o._id]: e.target.checked })} />
                  Force transition (admin only)
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      {timeline.orderId && (
        <div className="bg-white rounded shadow p-4">
          <div className="font-semibold mb-1">Timeline for order #{timeline.orderId}</div>
          <div className="text-sm text-gray-600 mb-3">Current status: {timeline.status}</div>
          <div className="space-y-2">
            {(timeline.events || []).map((evt) => (
              <div key={evt._id} className="border rounded p-3 text-sm">
                <div className="font-medium">{evt.type}</div>
                <div className="text-gray-600">{evt.note || 'No note'}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(evt.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {(timeline.events || []).length === 0 && <div className="text-sm text-gray-600">No events yet.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
