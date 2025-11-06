import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { api } from '../lib/api'

const queueStatuses = ['pending', 'approved', 'rejected', 'received', 'refunded']

export default function Returns(){
  const token = useSelector((s) => s.auth.token)
  const user = useSelector((s) => s.auth.user)
  const isOperator = user?.role === 'seller' || user?.role === 'admin'
  const [mine, setMine] = useState([])
  const [queue, setQueue] = useState([])
  const [queueFilter, setQueueFilter] = useState('')
  const [resolutionNote, setResolutionNote] = useState({})
  const [nextStatus, setNextStatus] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    loadMine()
    if (isOperator) loadQueue(queueFilter)
  }, [token, isOperator, queueFilter])

  async function loadMine(){
    try {
      const { data } = await api.get('/returns/mine')
      setMine(data || [])
    } catch {
      setMine([])
    } finally {
      setLoading(false)
    }
  }

  async function loadQueue(status){
    try {
      const { data } = await api.get('/returns', { params: status ? { status } : {} })
      setQueue(data || [])
    } catch {
      setQueue([])
    }
  }

  async function updateStatus(id){
    const status = nextStatus[id]
    if (!status) return
    try {
      await api.post(`/returns/${id}/status`, {
        status,
        resolutionNote: resolutionNote[id] || '',
      })
      await loadQueue(queueFilter)
      await loadMine()
    } catch {}
  }

  if (!token) return <div className="surface rounded-2xl p-4 text-sm text-slate-600">Log in to view return requests.</div>

  return (
    <div className="space-y-8">
      <section>
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">My Return Requests</h1>
        <p className="text-slate-600 mb-4">Track each return from request to refund.</p>
        {loading ? <div className="surface rounded-2xl p-4">Loading...</div> : mine.length === 0 ? (
          <div className="surface rounded-2xl p-4 text-sm text-slate-600">No return requests yet.</div>
        ) : (
          <div className="space-y-3">
            {mine.map((r) => (
              <div key={r._id} className="surface rounded-2xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">Return #{r._id}</div>
                    <div className="text-sm text-slate-600">Order #{r.orderId}</div>
                    <div className="text-sm mt-1">Status: <span className="font-semibold">{r.status}</span></div>
                    {r.resolutionNote && <div className="text-sm text-slate-700 mt-1">Note: {r.resolutionNote}</div>}
                  </div>
                  <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-3 text-sm text-slate-700">
                  {(r.items || []).map((it, idx) => (
                    <div key={idx}>Product {it.productId} · Qty {it.quantity} {it.reason ? `· ${it.reason}` : ''}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isOperator && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="brand-font text-2xl font-bold text-slate-900">Returns Queue</h2>
            <select className="px-3 py-2.5" value={queueFilter} onChange={(e) => setQueueFilter(e.target.value)}>
              <option value="">All statuses</option>
              {queueStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {queue.length === 0 && <div className="surface rounded-2xl p-4 text-sm text-slate-600">No queue items.</div>}
            {queue.map((r) => (
              <div key={r._id} className="surface rounded-2xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">Return #{r._id}</div>
                    <div className="text-sm text-slate-600">Order #{r.orderId} · Current: {r.status}</div>
                  </div>
                  <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-3 grid md:grid-cols-4 gap-2 text-sm">
                  <select value={nextStatus[r._id] || ''} onChange={(e) => setNextStatus({ ...nextStatus, [r._id]: e.target.value })} className="px-3 py-2.5">
                    <option value="">Select status</option>
                    {['approved', 'rejected', 'received', 'refunded'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input value={resolutionNote[r._id] || ''} onChange={(e) => setResolutionNote({ ...resolutionNote, [r._id]: e.target.value })} placeholder="Resolution note" className="px-3 py-2.5 md:col-span-2" />
                  <button onClick={() => updateStatus(r._id)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white">Update</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
