import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { api } from '../lib/api'

export default function Notifications(){
  const token = useSelector((s) => s.auth.token)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const pageSize = 20

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    load(page, unreadOnly)
  }, [token, page, unreadOnly])

  async function load(nextPage, nextUnreadOnly){
    setLoading(true)
    try {
      const { data } = await api.get('/notifications', { params: { page: nextPage, limit: pageSize, unreadOnly: nextUnreadOnly } })
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id){
    try {
      await api.post(`/notifications/${id}/read`)
      await load(page, unreadOnly)
    } catch {}
  }

  async function markAllRead(){
    try {
      await api.post('/notifications/read-all')
      await load(page, unreadOnly)
    } catch {}
  }

  if (!token) return <div className="surface rounded-2xl p-4 text-sm text-slate-600">Log in to see notifications.</div>

  const pages = Math.max(1, Math.ceil(total / pageSize))
  const unreadCount = items.filter((n) => !n.readAt).length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">Notifications</h1>
          <p className="text-slate-600 mt-1">Stay on top of order and return updates in one place.</p>
        </div>
        <div className="chip">Unread: {unreadCount}</div>
      </div>

      <div className="surface rounded-3xl p-4 flex flex-wrap gap-2 items-center justify-between">
        <label className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white text-sm">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => { setPage(1); setUnreadOnly(e.target.checked) }} />
          Unread only
        </label>
        <button onClick={markAllRead} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm">Mark all read</button>
      </div>

      {loading ? <div className="surface rounded-2xl p-4">Loading...</div> : (
        <div className="space-y-3">
          {items.length === 0 && <div className="surface rounded-2xl p-4 text-sm text-slate-600">No notifications found.</div>}
          {items.map((n) => (
            <div key={n._id} className={`rounded-2xl border p-4 ${n.readAt ? 'surface bg-white' : 'surface bg-orange-50 border-orange-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  <div className="text-sm text-slate-700 mt-1">{n.message}</div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  {n?.data?.orderId && (
                    <Link to="/orders" className="text-sm text-orange-600 inline-block mt-2">Open orders</Link>
                  )}
                </div>
                {!n.readAt && <button onClick={() => markRead(n._id)} className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-sm">Mark read</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="surface rounded-2xl p-3 flex items-center justify-between">
        <button className="px-3 py-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <div className="text-sm text-slate-600">Page {page} of {pages}</div>
        <button className="px-3 py-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  )
}
