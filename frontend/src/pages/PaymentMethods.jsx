import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { api } from '../lib/api'

const emptyForm = {
  provider: 'card',
  brand: 'visa',
  last4: '',
  expMonth: 1,
  expYear: new Date().getFullYear() + 1,
  billingPostalCode: '',
  isDefault: false,
}

export default function PaymentMethods(){
  const token = useSelector((s) => s.auth.token)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    load()
  }, [token])

  async function load(){
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/payment-methods')
      setItems(data || [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  async function submit(e){
    e.preventDefault()
    setError('')
    try {
      await api.post('/payment-methods', {
        ...form,
        last4: String(form.last4 || '').replace(/\D/g, '').slice(-4),
      })
      setForm(emptyForm)
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save payment method')
    }
  }

  async function setDefault(id){
    try {
      await api.post(`/payment-methods/${id}/default`)
      await load()
    } catch {}
  }

  async function remove(id){
    try {
      await api.delete(`/payment-methods/${id}`)
      await load()
    } catch {}
  }

  if (!token) return <div className="surface rounded-2xl p-4 text-sm text-slate-600">Log in to manage saved payment methods.</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">Saved Payment Methods</h1>
        <p className="text-slate-600 mt-1">Save preferred payment methods for one-click checkout.</p>
      </div>

      {error && <div className="surface rounded-2xl p-3 text-sm text-red-700 bg-red-50 border-red-200">{error}</div>}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          {loading ? <div className="surface rounded-2xl p-4">Loading...</div> : (
            <>
              {items.length === 0 && <div className="surface rounded-2xl p-4 text-sm text-slate-600">No saved methods yet.</div>}
              {items.map((pm) => (
                <div key={pm._id} className="surface rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {pm.provider.toUpperCase()} · {pm.brand.toUpperCase()} ending in {pm.last4}
                      {pm.isDefault ? <span className="ml-2 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">Default</span> : null}
                    </div>
                    <div className="text-sm text-slate-600">Exp {pm.expMonth}/{pm.expYear} · {pm.billingPostalCode || 'No postal code'}</div>
                  </div>
                  <div className="flex gap-2 text-sm">
                    {!pm.isDefault && <button onClick={() => setDefault(pm._id)} className="px-2 py-1 rounded-lg border border-slate-200 bg-white">Set default</button>}
                    <button onClick={() => remove(pm._id)} className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700">Delete</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="lg:col-span-2 surface-strong rounded-3xl p-4 h-max">
          <h2 className="font-bold mb-3 text-slate-900">Add Payment Method</h2>
          <form onSubmit={submit} className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="px-3 py-2.5 w-full">
                <option value="card">Card</option>
                <option value="paypal">PayPal</option>
                <option value="applepay">Apple Pay</option>
                <option value="googlepay">Google Pay</option>
              </select>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand" className="px-3 py-2.5 w-full" />
            </div>
            <input value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, '').slice(-4) })} placeholder="Last 4 digits" className="px-3 py-2.5 w-full" required maxLength={4} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={1} max={12} value={form.expMonth} onChange={(e) => setForm({ ...form, expMonth: Number(e.target.value || 1) })} placeholder="Exp month" className="px-3 py-2.5 w-full" required />
              <input type="number" min={2024} value={form.expYear} onChange={(e) => setForm({ ...form, expYear: Number(e.target.value || new Date().getFullYear() + 1) })} placeholder="Exp year" className="px-3 py-2.5 w-full" required />
            </div>
            <input value={form.billingPostalCode} onChange={(e) => setForm({ ...form, billingPostalCode: e.target.value })} placeholder="Billing postal code" className="px-3 py-2.5 w-full" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              Set as default
            </label>
            <button className="bg-orange-500 text-white rounded-xl px-4 py-2.5 w-full hover:bg-orange-600">Save payment method</button>
          </form>
        </div>
      </div>
    </div>
  )
}
