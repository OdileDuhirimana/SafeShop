import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { api } from '../lib/api'
import { addToCart } from '../store'
import { useI18n } from '../i18n.jsx'

export default function Concierge(){
  const { t } = useI18n()
  const dispatch = useDispatch()
  const token = useSelector((s) => s.auth.token)
  const [goal, setGoal] = useState('Build a practical setup for studying and daily productivity')
  const [budget, setBudget] = useState('1200')
  const [category, setCategory] = useState('')
  const [maxItems, setMaxItems] = useState(4)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/products')
        const unique = [...new Set((data || []).map((p) => p.category).filter(Boolean))]
        setCategories(unique)
      } catch {}
    })()
  }, [])

  async function runConcierge(e){
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        goal,
        budget: budget ? Number(budget) : undefined,
        maxItems: Number(maxItems),
        category: category || undefined,
      }
      const { data } = await api.post('/products/concierge', payload)
      setResult(data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to generate plan')
    } finally {
      setLoading(false)
    }
  }

  async function addItem(item){
    dispatch(addToCart({ productId: item._id, title: item.title, price: item.price, quantity: 1 }))
    if (token) {
      try { await api.post('/cart/add', { productId: item._id, title: item.title, price: item.price, quantity: 1 }) } catch {}
    }
  }

  async function addAll(){
    if (!result?.picks?.length) return
    for (const item of result.picks) await addItem(item)
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-3xl p-6">
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">{t('shoppingConcierge')}</h1>
        <p className="text-slate-600">Tell us your goal and budget, and we will build your best shopping plan.</p>
      </section>

      <form onSubmit={runConcierge} className="surface rounded-3xl p-4 md:p-5 space-y-3">
        <div>
          <label htmlFor="goal" className="block text-sm text-slate-700 mb-1">{t('describeGoal')}</label>
          <textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} className="px-3 py-2.5 w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="budget" className="block text-sm text-slate-700 mb-1">{t('budget')}</label>
            <input id="budget" type="number" min={1} value={budget} onChange={(e) => setBudget(e.target.value)} className="px-3 py-2.5 w-full" />
          </div>
          <div>
            <label htmlFor="max-items" className="block text-sm text-slate-700 mb-1">{t('maxItems')}</label>
            <select id="max-items" value={maxItems} onChange={(e) => setMaxItems(e.target.value)} className="px-3 py-2.5 w-full">
              {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm text-slate-700 mb-1">{t('category')}</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2.5 w-full">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold" disabled={loading}>
          {loading ? t('loading') : t('generatePlan')}
        </button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>

      {result?.plan && (
        <div className="surface-strong rounded-3xl p-4 md:p-5">
          <div className="text-sm text-slate-600">{t('estTotal')}</div>
          <div className="text-3xl font-extrabold text-slate-900">${Number(result.plan.total || 0).toFixed(2)}</div>
          <div className="text-sm mt-1 text-slate-600">Confidence: {result.plan.confidence || 0}</div>
          <button onClick={addAll} className="mt-3 bg-slate-900 text-white px-4 py-2.5 rounded-xl">{t('addAllToCart')}</button>
        </div>
      )}

      {result?.picks?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.picks.map((p) => (
            <div key={p._id} className="surface rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{p.title}</h2>
                <div className="text-xs chip">{t('fitScore')}: {p.fitScore}</div>
              </div>
              <div className="text-sm text-slate-600">{p.category}</div>
              <div className="text-xl font-extrabold mt-2 text-slate-900">${p.price}</div>
              <div className="text-sm mt-2">
                <span className="font-semibold">{t('reason')}:</span> {p.reason}
              </div>
              <button onClick={() => addItem(p)} className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl">{t('addToCart')}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
