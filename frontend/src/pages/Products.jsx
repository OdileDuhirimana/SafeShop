import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, addToCompare } from '../store'
import { getRecommendations } from '../lib/ai'
import { useI18n } from '../i18n.jsx'
import ProductCard from '../components/ProductCard'
import Pagination from '../components/Pagination'

export default function Products(){
  const { t } = useI18n()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [usedCache, setUsedCache] = useState(false)
  const [q, setQ] = useState('')
  const [recs, setRecs] = useState([])
  const [brand, setBrand] = useState('')
  const [ratingMin, setRatingMin] = useState('')
  const [inStock, setInStock] = useState(false)
  const [flashOnly, setFlashOnly] = useState(false)
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const dispatch = useDispatch()
  const token = useSelector(s => s.auth.token)
  const compareCount = useSelector(s => s.compare.items.length)
  const [page, setPage] = useState(1)
  const pageSize = 9

  useEffect(() => { fetchProducts(); fetchRecs() }, [])
  useEffect(() => { if (token) loadWishlist() }, [token])

  async function fetchProducts(params={}){
    setLoading(true)
    setUsedCache(false)
    try {
      const { data } = await api.get('/products', { params })
      setItems(data)
      try { localStorage.setItem('cache:products', JSON.stringify(data)) } catch {}
    } catch {
      try {
        const cached = JSON.parse(localStorage.getItem('cache:products') || '[]')
        if (Array.isArray(cached) && cached.length) {
          setItems(cached)
          setUsedCache(true)
        } else {
          setItems([])
        }
      } catch { setItems([]) }
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecs(){
    try {
      const { recommendations } = await getRecommendations()
      setRecs(recommendations)
    } catch {}
  }

  async function loadWishlist(){
    try {
      const { data } = await api.get('/wishlist')
      setWishlistIds(new Set(data.productIds || []))
    } catch {}
  }

  async function toggleWishlist(productId){
    try {
      await api.post('/wishlist/toggle', { productId })
      const next = new Set(wishlistIds)
      if (next.has(productId)) next.delete(productId); else next.add(productId)
      setWishlistIds(next)
    } catch {}
  }

  async function handleAddToCart(p){
    dispatch(addToCart({ productId: p._id, title: p.title, price: p.price }))
    if (token) {
      try { await api.post('/cart/add', { productId: p._id, title: p.title, price: p.price, quantity: 1 }) } catch {}
    }
  }

  function handleCompare(p){
    dispatch(addToCompare({ productId: p._id, title: p.title, price: p.price, brand: p.brand, category: p.category }))
  }

  return (
    <div>
      <div className="mb-4">
        <img src="/assets/banner.jpg" alt="Seasonal promotion banner" className="w-full h-40 md:h-56 object-cover rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <input aria-label={t('searchProducts')} value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search')} className="border px-3 py-2 rounded w-full" />
        <input aria-label={t('brand')} value={brand} onChange={e=>setBrand(e.target.value)} placeholder={t('brand')} className="border px-3 py-2 rounded w-full" />
        <select aria-label={t('anyRating')} value={ratingMin} onChange={e=>setRatingMin(e.target.value)} className="border px-3 py-2 rounded w-full">
          <option value="">{t('anyRating')}</option>
          {[1,2,3,4,5].map(n=> <option key={n} value={n}>{n}+</option>)}
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" checked={inStock} onChange={e=>setInStock(e.target.checked)} /> {t('inStock')}</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={flashOnly} onChange={e=>setFlashOnly(e.target.checked)} /> {t('flash')}</label>
        <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
          <button onClick={()=>fetchProducts({ q, brand, ratingMin, inStock, flashOnly })} className="bg-blue-600 text-white px-4 py-2 rounded">{t('apply')}</button>
          <a href="/compare" className="border px-3 py-2 rounded">{t('compare')} ({compareCount})</a>
        </div>
      </div>
      {usedCache && (
        <div role="status" aria-live="polite" className="bg-amber-100 text-amber-900 text-sm p-2 rounded mb-3">{t('offline') || 'Offline'}: showing cached products.</div>
      )}
      {recs.length > 0 && (
        <div className="mb-6">
          <div className="font-semibold mb-2">{t('recommendedForYou')}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.filter(p => recs.some(r => r.title === p.title)).map(p => (
              <ProductCard
                key={p._id}
                product={p}
                onAddToCart={handleAddToCart}
                onToggleWishlist={toggleWishlist}
                inWishlist={wishlistIds.has(p._id)}
                onCompare={handleCompare}
              />
            ))}
          </div>
        </div>
      )}
      {loading ? <p>{t('loading')}</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.slice((page-1)*pageSize, (page-1)*pageSize + pageSize).map(p => (
            <ProductCard
              key={p._id}
              product={p}
              onAddToCart={handleAddToCart}
              onToggleWishlist={toggleWishlist}
              inWishlist={wishlistIds.has(p._id)}
              onCompare={handleCompare}
            />
          ))}
        </div>
      )}
      {!loading && items.length > pageSize && (
        <Pagination page={page} total={items.length} pageSize={pageSize} onPageChange={setPage} />
      )}
    </div>
  )
}
