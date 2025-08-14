import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function SellerProductEdit(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState(0)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState(0)

  useEffect(()=>{ (async ()=>{
    setLoading(true); setError('')
    try {
      const { data } = await api.get(`/products/${id}`)
      setTitle(data.title||''); setPrice(data.price||0); setCategory(data.category||''); setDescription(data.description||''); setStock(data.stock||0)
    } catch(e){ setError(e?.response?.data?.error || 'Failed to load product') }
    setLoading(false)
  })() }, [id])

  async function submit(e){
    e.preventDefault()
    setError('')
    try {
      await api.put(`/products/${id}`, { title, price: Number(price), category, description, stock: Number(stock) })
      navigate(`/product/${id}`)
    } catch(e){ setError(e?.response?.data?.error || 'Failed to update product') }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Edit Product</h1>
      <form onSubmit={submit} className="bg-white rounded shadow p-4 space-y-3">
        <div>
          <label htmlFor="sp-title" className="block text-sm text-gray-700">Title</label>
          <input id="sp-title" value={title} onChange={e=>setTitle(e.target.value)} className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label htmlFor="sp-price" className="block text-sm text-gray-700">Price</label>
          <input id="sp-price" type="number" step="0.01" min={0} value={price} onChange={e=>setPrice(e.target.value)} className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label htmlFor="sp-category" className="block text-sm text-gray-700">Category</label>
          <input id="sp-category" value={category} onChange={e=>setCategory(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label htmlFor="sp-stock" className="block text-sm text-gray-700">Stock</label>
          <input id="sp-stock" type="number" min={0} value={stock} onChange={e=>setStock(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label htmlFor="sp-desc" className="block text-sm text-gray-700">Details</label>
          <textarea id="sp-desc" value={description} onChange={e=>setDescription(e.target.value)} className="border rounded px-3 py-2 w-full" rows={4} />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button aria-label="Save" className="bg-blue-600 text-white px-4 py-2 rounded w-full">Save</button>
      </form>
    </div>
  )
}
