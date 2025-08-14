import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../i18n.jsx'
import { Link } from 'react-router-dom'

export default function AdminDashboard(){
  const { t } = useI18n()
  const [data, setData] = useState(null)
  useEffect(() => { (async () => {
    try { const { data } = await api.get('/metrics/admin'); setData(data) } catch {}
  })() }, [])
  if (!data) return <div>{t('loading')}</div>
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{t('adminDashboard')}</h1>
      <div className="flex gap-3 mb-4 text-sm">
        <Link className="border rounded px-3 py-2" to="/admin/activity">{t('activity')}</Link>
        <Link className="border rounded px-3 py-2" to="/admin/discounts">{t('discounts')}</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded shadow p-4"><div className="text-sm text-gray-600">{t('totalRevenue')}</div><div className="text-2xl font-bold">${data.totalRevenue?.toFixed(2)}</div></div>
        <div className="bg-white rounded shadow p-4"><div className="text-sm text-gray-600">{t('ordersCount')}</div><div className="text-2xl font-bold">{data.ordersCount}</div></div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-600 mb-2">{t('topProducts')}</div>
          <ul className="list-disc ml-5 text-sm space-y-1">
            {(data.topProducts||[]).map(p => <li key={p._id}>{p.title} (⭐ {p.rating})</li>)}
          </ul>
        </div>
      </div>
      {/* Simple charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-600 mb-2">{t('metrics')} - {t('totalRevenue')}</div>
          <div className="h-32 bg-gray-100 rounded p-3 flex items-end gap-2" aria-label="Revenue chart">
            <div className="flex-1 bg-blue-500 rounded" style={{height: `${Math.min(100, (data.totalRevenue||0) > 0 ? 80 : 10)}%`}} title={String(data.totalRevenue)} />
          </div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm text-gray-600 mb-2">{t('metrics')} - {t('ordersCount')}</div>
          <div className="h-32 bg-gray-100 rounded p-3 flex items-end gap-2" aria-label="Orders chart">
            <div className="flex-1 bg-emerald-500 rounded" style={{height: `${Math.min(100, (data.ordersCount||0) > 0 ? 70 : 10)}%`}} title={String(data.ordersCount)} />
          </div>
        </div>
      </div>
    </div>
  )
}
