import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { api } from '../lib/api'

const emptyForm = {
  label: 'Home',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  isDefault: false,
}

export default function Addresses(){
  const token = useSelector((s) => s.auth.token)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')

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
      const { data } = await api.get('/addresses')
      setItems(data || [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  async function submit(e){
    e.preventDefault()
    setError('')
    try {
      if (editingId) await api.put(`/addresses/${editingId}`, form)
      else await api.post('/addresses', form)
      setForm(emptyForm)
      setEditingId('')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save address')
    }
  }

  function startEdit(item){
    setEditingId(item._id)
    setForm({
      label: item.label || 'Home',
      fullName: item.fullName || '',
      phone: item.phone || '',
      line1: item.line1 || '',
      line2: item.line2 || '',
      city: item.city || '',
      state: item.state || '',
      postalCode: item.postalCode || '',
      country: item.country || 'US',
      isDefault: Boolean(item.isDefault),
    })
  }

  async function setDefault(id){
    try {
      await api.post(`/addresses/${id}/default`)
      await load()
    } catch {}
  }

  async function remove(id){
    try {
      await api.delete(`/addresses/${id}`)
      await load()
    } catch {}
  }

  if (!token) return <div className="surface rounded-2xl p-4 text-sm text-slate-600">Log in to manage your addresses.</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">Shipping Addresses</h1>
        <p className="text-slate-600 mt-1">Save addresses for faster and safer checkout.</p>
      </div>

      {error && <div className="surface rounded-2xl p-3 text-sm text-red-700 bg-red-50 border-red-200">{error}</div>}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          {loading ? <div className="surface rounded-2xl p-4">Loading...</div> : (
            <>
              {items.length === 0 && <div className="surface rounded-2xl p-4 text-sm text-slate-600">No saved addresses yet.</div>}
              {items.map((a) => (
                <div key={a._id} className="surface rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-900">
                      {a.label}
                      {a.isDefault ? <span className="ml-2 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">Default</span> : null}
                    </div>
                    <div className="flex gap-2 text-sm">
                      {!a.isDefault && <button onClick={() => setDefault(a._id)} className="px-2 py-1 rounded-lg border border-slate-200 bg-white">Set default</button>}
                      <button onClick={() => startEdit(a)} className="px-2 py-1 rounded-lg border border-slate-200 bg-white">Edit</button>
                      <button onClick={() => remove(a._id)} className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700">Delete</button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-700 mt-2">
                    <div>{a.fullName} · {a.phone}</div>
                    <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                    <div>{a.city}, {a.state} {a.postalCode}, {a.country}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="lg:col-span-2 surface-strong rounded-3xl p-4 h-max">
          <h2 className="font-bold mb-3 text-slate-900">{editingId ? 'Edit Address' : 'Add Address'}</h2>
          <form onSubmit={submit} className="space-y-2 text-sm">
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Label" className="px-3 py-2.5 w-full" />
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" className="px-3 py-2.5 w-full" required />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="px-3 py-2.5 w-full" required />
            <input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="Address line 1" className="px-3 py-2.5 w-full" required />
            <input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} placeholder="Address line 2" className="px-3 py-2.5 w-full" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="px-3 py-2.5 w-full" required />
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" className="px-3 py-2.5 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="Postal code" className="px-3 py-2.5 w-full" required />
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" className="px-3 py-2.5 w-full" required />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              Set as default
            </label>
            <button className="bg-orange-500 text-white rounded-xl px-4 py-2.5 w-full hover:bg-orange-600">{editingId ? 'Update address' : 'Save address'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm) }} className="border border-slate-200 rounded-xl px-4 py-2.5 w-full">Cancel edit</button>}
          </form>
        </div>
      </div>
    </div>
  )
}
