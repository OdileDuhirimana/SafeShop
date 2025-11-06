import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useDispatch } from 'react-redux'
import { addToCart } from '../store'
import { useI18n } from '../i18n.jsx'
import { Link } from 'react-router-dom'

export default function Wishlist(){
  const { t } = useI18n()
  const [productIds, setProductIds] = useState([])
  const [products, setProducts] = useState([])
  const [usedCache, setUsedCache] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/wishlist')
        setProductIds(data.productIds || [])
        try { localStorage.setItem('cache:wishlist', JSON.stringify(data.productIds || [])) } catch {}
      } catch {}
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      setUsedCache(false)
      try {
        const { data } = await api.get('/products')
        setProducts(data.filter((p) => productIds.some((id) => id === p._id)))
        try { localStorage.setItem('cache:products', JSON.stringify(data)) } catch {}
      } catch {
        try {
          const cachedIds = JSON.parse(localStorage.getItem('cache:wishlist') || '[]')
          const cachedProducts = JSON.parse(localStorage.getItem('cache:products') || '[]')
          const filtered = Array.isArray(cachedProducts) ? cachedProducts.filter((p) => cachedIds.some((id) => id === p._id)) : []
          setProducts(filtered)
          setUsedCache(true)
        } catch {
          setProducts([])
        }
      }
    })()
  }, [productIds])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">{t('wishlist') || 'Wishlist'}</h1>
        <p className="text-slate-600 mt-1">Keep your favorites ready for your next purchase.</p>
      </div>

      {usedCache && (
        <div role="status" aria-live="polite" className="surface rounded-2xl p-3 text-sm text-amber-900 bg-amber-50 border-amber-200">
          {t('offline') || 'Offline'}: showing cached wishlist.
        </div>
      )}

      {products.length === 0 ? (
        <div className="surface rounded-3xl p-6 text-slate-600">
          {t('noItemsYet') || 'No items yet.'} <Link to="/" className="text-orange-600 font-semibold">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p._id} className="surface rounded-2xl p-4">
              <Link to={`/product/${p._id}`} className="font-semibold text-slate-900 hover:text-orange-600">{p.title}</Link>
              <div className="text-sm text-slate-600">{p.category}</div>
              <div className="mt-2 font-extrabold text-slate-900">${p.price}</div>
              <button aria-label={t('addToCart')} className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl" onClick={() => dispatch(addToCart({ productId: p._id, title: p.title, price: p.price }))}>{t('addToCart')}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
