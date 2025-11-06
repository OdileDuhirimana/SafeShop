import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../store'
import { api } from '../lib/api'

export default function RecentlyViewed(){
  const token = useSelector((s) => s.auth.token)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    load()
  }, [token])

  async function load(){
    setLoading(true)
    try {
      const { data } = await api.get('/recently-viewed')
      setItems(data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  if (!token) return <div className="surface rounded-2xl p-4 text-sm text-slate-600">Log in to see your recently viewed products.</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">Recently Viewed</h1>
        <p className="text-slate-600 mt-1">Pick up where you left off and add favorites quickly.</p>
      </div>

      {loading ? <div className="surface rounded-2xl p-4">Loading...</div> : items.length === 0 ? (
        <div className="surface rounded-2xl p-4 text-sm text-slate-600">No recently viewed products yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p._id} className="surface rounded-2xl p-4">
              <Link to={`/product/${p._id}`} className="font-semibold text-slate-900 hover:text-orange-600">{p.title}</Link>
              <div className="text-sm text-slate-600 mt-1">{p.category || 'General'}</div>
              <div className="font-extrabold mt-2 text-slate-900">${p.price}</div>
              <div className="mt-3 flex gap-2">
                <Link to={`/product/${p._id}`} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm">View product</Link>
                <button onClick={() => dispatch(addToCart({ productId: p._id, title: p.title, price: p.price }))} className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm">Add to cart</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
