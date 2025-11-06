import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { api } from '../lib/api'
import { useI18n } from '../i18n.jsx'

export default function Alerts(){
  const { t } = useI18n()
  const token = useSelector((s) => s.auth.token)
  const [items, setItems] = useState([])
  const [triggered, setTriggered] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load(){
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const [{ data: all }, { data: trig }] = await Promise.all([
        api.get('/alerts'),
        api.get('/alerts/triggered'),
      ])
      setItems(all || [])
      setTriggered(trig || [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  async function remove(id){
    try {
      await api.delete(`/alerts/${id}`)
      setItems((prev) => prev.filter((a) => a._id !== id))
      setTriggered((prev) => prev.filter((a) => a._id !== id))
    } catch {}
  }

  if (!token) {
    return (
      <div className="surface rounded-3xl p-6">
        <h1 className="brand-font text-2xl font-bold mb-2">{t('priceAlerts')}</h1>
        <p className="text-slate-600">Login to manage alerts and get notified when prices drop.</p>
        <Link className="text-orange-600 mt-3 inline-block" to="/login">{t('login')}</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">{t('priceAlerts')}</h1>
          <p className="text-slate-600 mt-1">Watch target prices and get notified automatically.</p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded-xl border border-slate-200 bg-white">{loading ? t('loading') : 'Refresh'}</button>
      </div>

      {triggered.length > 0 && (
        <div className="surface rounded-2xl p-4 bg-emerald-50 border-emerald-200">
          <div className="font-semibold text-emerald-800 mb-2">{t('triggered')} ({triggered.length})</div>
          <div className="grid gap-2">
            {triggered.map((a) => (
              <div key={a._id} className="text-sm text-emerald-900">
                {a.product?.title || 'Product'} reached ${Number(a.currentPrice || 0).toFixed(2)} (target ${Number(a.targetPrice || 0).toFixed(2)})
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="surface rounded-2xl p-3 text-red-700 bg-red-50 border-red-200 text-sm">{error}</div>}

      {items.length === 0 ? (
        <div className="surface rounded-2xl p-4 text-slate-600">{t('noItemsYet')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((a) => (
            <div key={a._id} className="surface rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <Link to={`/product/${a.product?._id}`} className="font-semibold text-orange-700">
                  {a.product?.title || 'Unknown product'}
                </Link>
                {a.triggered && <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-full">{t('triggered')}</span>}
              </div>
              <div className="text-sm text-slate-600 mt-1">{t('targetPrice')}: ${Number(a.targetPrice || 0).toFixed(2)}</div>
              <div className="text-sm text-slate-600">{t('currentPrice')}: ${Number(a.currentPrice || 0).toFixed(2)}</div>
              <div className="mt-3">
                <button onClick={() => remove(a._id)} className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{t('delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
