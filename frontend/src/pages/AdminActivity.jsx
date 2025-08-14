import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function AdminActivity(){
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')

  async function load(){
    setLoading(true)
    try {
      const { data } = await api.get('/admin/activity', { params: { page, limit, userId: userId || undefined } })
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [page, limit])

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Admin Activity</h1>
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="user" className="block text-sm text-gray-700 mb-1">Filter by User ID</label>
            <input id="user" value={userId} onChange={e=>setUserId(e.target.value)} placeholder="User ID" className="border rounded px-3 py-2" />
          </div>
          <div>
            <label htmlFor="limit" className="block text-sm text-gray-700 mb-1">Page size</label>
            <select id="limit" value={limit} onChange={e=>setLimit(parseInt(e.target.value,10))} className="border rounded px-2 py-2">
              {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button onClick={()=>{ setPage(1); load() }} className="bg-blue-600 text-white px-4 py-2 rounded">Apply</button>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Time</th>
              <th className="p-2">User</th>
              <th className="p-2">Action</th>
              <th className="p-2">IP</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={5}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-3" colSpan={5}>No activity found.</td></tr>
            ) : items.map((a) => (
              <tr key={a._id} className="border-b hover:bg-gray-50">
                <td className="p-2">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="p-2">{a.userId || '-'}</td>
                <td className="p-2 break-all">{a.action}</td>
                <td className="p-2">{a.ip}</td>
                <td className="p-2">{a.meta?.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Page {page} of {pages} • Total {total}</div>
        <div className="flex gap-2">
          <button aria-label="Previous page" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="border rounded px-3 py-2 disabled:opacity-50">Prev</button>
          <button aria-label="Next page" disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="border rounded px-3 py-2 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )
}
