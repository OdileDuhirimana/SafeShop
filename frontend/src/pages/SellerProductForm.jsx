import React, { useState } from 'react'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n.jsx'

export default function SellerProductForm(){
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState(0)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState(0)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e){
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/products', { title, price: Number(price), category, description, stock: Number(stock) })
      navigate(`/product/${data._id}`)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create product')
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">{t('newProduct') || 'New Product'}</h1>
      <form onSubmit={submit} className="bg-white rounded shadow p-4 space-y-3">
        <div>
          <label htmlFor="sp-title" className="block text-sm text-gray-700">{t('title')}</label>
          <input id="sp-title" value={title} onChange={e=>setTitle(e.target.value)} className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label htmlFor="sp-price" className="block text-sm text-gray-700">{t('price')}</label>
          <input id="sp-price" type="number" step="0.01" min={0} value={price} onChange={e=>setPrice(e.target.value)} className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label htmlFor="sp-category" className="block text-sm text-gray-700">{t('category')}</label>
          <input id="sp-category" value={category} onChange={e=>setCategory(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label htmlFor="sp-stock" className="block text-sm text-gray-700">{t('stock')}</label>
          <input id="sp-stock" type="number" min={0} value={stock} onChange={e=>setStock(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label htmlFor="sp-desc" className="block text-sm text-gray-700">{t('details')}</label>
          <textarea id="sp-desc" value={description} onChange={e=>setDescription(e.target.value)} className="border rounded px-3 py-2 w-full" rows={4} />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button aria-label={t('create') || 'Create'} className="bg-amber-600 text-white px-4 py-2 rounded w-full">{t('create') || 'Create'}</button>
      </form>
    </div>
  )
}
