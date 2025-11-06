import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../i18n.jsx'
import { Link } from 'react-router-dom'

export default function AdminDashboard(){
  const { t } = useI18n()
  const [data, setData] = useState(null)
  const [sellerTrust, setSellerTrust] = useState([])
  useEffect(() => { (async () => {
    try { const { data } = await api.get('/metrics/admin'); setData(data) } catch {}
  })() }, [])
  useEffect(() => { (async () => {
    try { const { data } = await api.get('/metrics/admin/seller-trust'); setSellerTrust(data || []) } catch {}
  })() }, [])
  if (!data) return <div>{t('loading')}</div>
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{t('adminDashboard')}</h1>
      <div className="flex gap-3 mb-4 text-sm">
        <Link className="border rounded px-3 py-2" to="/order-queue">Order Queue</Link>
        <Link className="border rounded px-3 py-2" to="/returns">Returns</Link>
        <Link className="border rounded px-3 py-2" to="/notifications">Notifications</Link>
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
      <div className="bg-white rounded shadow p-4 mt-6">
        <div className="font-semibold mb-3">Seller Trust Leaderboard</div>
        {sellerTrust.length === 0 ? (
          <div className="text-sm text-gray-600">{t('noItemsYet')}</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Seller</th>
                  <th className="p-2">{t('trustScore')}</th>
                  <th className="p-2">{t('rating')}</th>
                  <th className="p-2">{t('fulfillmentRate')}</th>
                  <th className="p-2">{t('stockHealth')}</th>
                </tr>
              </thead>
              <tbody>
                {sellerTrust.slice(0, 8).map((s) => (
                  <tr key={s.sellerId} className="border-b">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 font-semibold">{s.trustScore}</td>
                    <td className="p-2">{s.avgRating}</td>
                    <td className="p-2">{Math.round((s.fulfillmentRate || 0) * 100)}%</td>
                    <td className="p-2">{Math.round((s.stockHealth || 0) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
