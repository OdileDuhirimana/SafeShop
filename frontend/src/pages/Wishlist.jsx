import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useDispatch } from 'react-redux'
import { addToCart } from '../store'
import { useI18n } from '../i18n.jsx'

export default function Wishlist(){
  const { t } = useI18n()
  const [productIds, setProductIds] = useState([])
  const [products, setProducts] = useState([])
  const [usedCache, setUsedCache] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => { (async () => {
    try {
      const { data } = await api.get('/wishlist')
      setProductIds(data.productIds || [])
      try { localStorage.setItem('cache:wishlist', JSON.stringify(data.productIds || [])) } catch {}
    } catch {}
  })() }, [])

  useEffect(() => { (async () => {
    setUsedCache(false)
    try {
      const { data } = await api.get('/products')
      setProducts(data.filter(p => productIds.some(id => id === p._id)))
      try { localStorage.setItem('cache:products', JSON.stringify(data)) } catch {}
    } catch {
      try {
        const cachedIds = JSON.parse(localStorage.getItem('cache:wishlist') || '[]')
        const cachedProducts = JSON.parse(localStorage.getItem('cache:products') || '[]')
        const filtered = Array.isArray(cachedProducts) ? cachedProducts.filter(p => cachedIds.some(id => id === p._id)) : []
        setProducts(filtered)
        setUsedCache(true)
      } catch { setProducts([]) }
    }
  })() }, [productIds])

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{t('wishlist') || 'Wishlist'}</h1>
      {usedCache && (
        <div role="status" aria-live="polite" className="bg-amber-100 text-amber-900 text-sm p-2 rounded mb-3">{t('offline') || 'Offline'}: showing cached wishlist.</div>
      )}
      {products.length === 0 ? <div>{t('noItemsYet') || 'No items yet.'}</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p._id} className="bg-white rounded shadow p-4">
              <div className="font-semibold">{p.title}</div>
              <div className="text-sm text-gray-600">{p.category}</div>
              <div className="mt-2 font-bold">${p.price}</div>
              <button aria-label={t('addToCart')} className="mt-3 bg-green-600 text-white px-3 py-2 rounded" onClick={() => dispatch(addToCart({ productId: p._id, title: p.title, price: p.price }))}>{t('addToCart')}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
