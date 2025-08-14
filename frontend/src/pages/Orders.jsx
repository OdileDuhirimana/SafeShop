import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../i18n.jsx'

export default function Orders(){
  const { t } = useI18n()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ (async ()=>{
    try { const { data } = await api.get('/orders'); setOrders(data) } catch(e){ setError('Failed to load orders') } finally { setLoading(false) }
  })() }, [])

  async function downloadInvoice(id){
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/invoice`, { credentials: 'include', headers: { 'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '' } })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${id}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{t('yourOrders') || 'Your Orders'}</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_,i)=> (
            <div key={i} className="animate-pulse bg-white rounded shadow p-4 h-20" />
          ))}
        </div>
      ) : orders.length === 0 ? <div>{t('noOrdersYet') || 'No orders yet.'}</div> : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o._id} className="bg-white rounded shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('order') || 'Order'} #{o._id}</div>
                  <div className="text-sm text-gray-600">{t('status') || 'Status'}: {o.status} • {t('estTotal') || 'Total'}: {o.total}</div>
                </div>
                <div className="flex gap-2">
                  {o.status === 'paid' && (
                    <button aria-label={t('downloadInvoice') || 'Download Invoice'} className="border rounded px-3 py-2" onClick={()=>downloadInvoice(o._id)}>{t('downloadInvoice') || 'Download Invoice'}</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
