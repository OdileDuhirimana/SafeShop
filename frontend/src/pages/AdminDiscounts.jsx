import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../i18n.jsx'

export default function AdminDiscounts(){
  const { t } = useI18n()
  const [items, setItems] = useState([])
  const [code, setCode] = useState('')
  const [percent, setPercent] = useState(10)

  async function load(){
    try { const { data } = await api.get('/discounts'); setItems(data) } catch {}
  }
  useEffect(() => { load() }, [])

  async function create(){
    try { await api.post('/discounts', { code, percent: Number(percent), active: true }); setCode(''); setPercent(10); load() } catch {}
  }
  async function toggle(id, active){
    try { await api.put(`/discounts/${id}`, { active: !active }); load() } catch {}
  }
  async function remove(id){
    try { await api.delete(`/discounts/${id}`); load() } catch {}
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{t('discounts')}</h1>
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="flex gap-2 items-end">
          <div>
            <label htmlFor="disc-code" className="block text-sm text-gray-700">{t('discountCode')}</label>
            <input id="disc-code" value={code} onChange={e=>setCode(e.target.value)} className="border rounded px-3 py-2" />
          </div>
          <div>
            <label htmlFor="disc-percent" className="block text-sm text-gray-700">% {t('discounts')}</label>
            <input id="disc-percent" type="number" min={0} max={100} value={percent} onChange={e=>setPercent(e.target.value)} className="border rounded px-3 py-2 w-24" />
          </div>
          <button aria-label={t('discounts')} onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded">{t('create') || 'Create'}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map(d => (
          <div key={d._id} className="bg-white rounded shadow p-3">
            <div className="font-semibold">{d.code}</div>
            <div className="text-sm text-gray-600">{d.percent}%</div>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>toggle(d._id, d.active)} className="border rounded px-3 py-1">{d.active ? (t('disable') || 'Disable') : (t('enable') || 'Enable')}</button>
              <button onClick={()=>remove(d._id)} className="text-red-600">{t('delete') || 'Delete'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
