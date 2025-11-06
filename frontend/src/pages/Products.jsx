import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, addToCompare } from '../store'
import { getRecommendations } from '../lib/ai'
import { useI18n } from '../i18n.jsx'
import ProductCard from '../components/ProductCard'
import Pagination from '../components/Pagination'

export default function Products(){
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [usedCache, setUsedCache] = useState(false)
  const [q, setQ] = useState('')
  const [recs, setRecs] = useState([])
  const [trending, setTrending] = useState([])
  const [brand, setBrand] = useState('')
  const [ratingMin, setRatingMin] = useState('')
  const [inStock, setInStock] = useState(false)
  const [flashOnly, setFlashOnly] = useState(false)
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const dispatch = useDispatch()
  const token = useSelector((s) => s.auth.token)
  const compareCount = useSelector((s) => s.compare.items.length)
  const [page, setPage] = useState(1)
  const pageSize = 9

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('q') || ''
    setQ(query)
    fetchProducts({ q: query, brand, ratingMin, inStock, flashOnly })
  }, [location.search])

  useEffect(() => {
    fetchRecs()
    fetchTrending()
  }, [])

  useEffect(() => {
    if (token) loadWishlist()
  }, [token])

  async function fetchProducts(params = {}){
    setLoading(true)
    setUsedCache(false)
    setPage(1)
    try {
      const query = {
        ...(params.q ? { q: params.q } : {}),
        ...(params.brand ? { brand: params.brand } : {}),
        ...(params.ratingMin ? { ratingMin: params.ratingMin } : {}),
        ...(params.inStock ? { inStock: true } : {}),
        ...(params.flashOnly ? { flashOnly: true } : {}),
      }
      const { data } = await api.get('/products', { params: query })
      const products = Array.isArray(data) ? data : (data?.items || [])
      setItems(products)
      try { localStorage.setItem('cache:products', JSON.stringify(products)) } catch {}

      if (params.q && String(params.q).trim().length >= 2) {
        api.post('/search/track', { query: params.q }).catch(() => {})
      }
    } catch {
      try {
        const cached = JSON.parse(localStorage.getItem('cache:products') || '[]')
        if (Array.isArray(cached) && cached.length) {
          setItems(cached)
          setUsedCache(true)
        } else {
          setItems([])
        }
      } catch {
        setItems([])
      }
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

  async function fetchTrending(){
    try {
      const { data } = await api.get('/search/trending')
      setTrending((data || []).slice(0, 8))
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
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
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

  function applyFilters(nextQ){
    const query = typeof nextQ === 'string' ? nextQ : q
    const params = new URLSearchParams(location.search)
    if (query) params.set('q', query)
    else params.delete('q')
    navigate('/?' + params.toString())
    fetchProducts({ q: query, brand, ratingMin, inStock, flashOnly })
  }

  return (
    <div className="space-y-6">
      <section className="surface rounded-3xl p-4 md:p-6 overflow-hidden relative">
        <div className="absolute -top-20 -right-16 h-52 w-52 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-teal-200/50 blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-5 items-center">
          <div>
            <h1 className="brand-font text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              Discover smarter shopping with live deals, trusted sellers, and effortless checkout.
            </h1>
            <p className="text-slate-600 mt-3 max-w-xl">
              Browse curated picks, compare products quickly, and unlock the best savings before you pay.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="chip">Verified inventory</span>
              <span className="chip">Live price alerts</span>
              <span className="chip">AI concierge</span>
            </div>
          </div>
          <div>
            <img src="/assets/banner.jpg" alt="Seasonal promotion banner" className="w-full h-56 md:h-64 object-cover rounded-2xl shadow-lg" />
          </div>
        </div>
      </section>

      <section className="surface rounded-3xl p-4 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
          <input aria-label={t('searchProducts')} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className="px-3 py-2.5 w-full" />
          <input aria-label={t('brand')} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={t('brand')} className="px-3 py-2.5 w-full" />
          <select aria-label={t('anyRating')} value={ratingMin} onChange={(e) => setRatingMin(e.target.value)} className="px-3 py-2.5 w-full">
            <option value="">{t('anyRating')}</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
          </select>
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> {t('inStock')}</label>
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white"><input type="checkbox" checked={flashOnly} onChange={(e) => setFlashOnly(e.target.checked)} /> {t('flash')}</label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => applyFilters()} className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600">{t('apply')}</button>
          <a href="/compare" className="px-4 py-2 rounded-xl border border-slate-200 bg-white">{t('compare')} ({compareCount})</a>
          <a href="/concierge" className="px-4 py-2 rounded-xl border border-slate-200 bg-white">{t('shoppingConcierge')}</a>
        </div>

        {trending.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Trending searches</div>
            <div className="flex flex-wrap gap-2">
              {trending.map((item) => (
                <button key={item._id} onClick={() => { setQ(item.query); applyFilters(item.query) }} className="chip hover:border-orange-300 hover:text-orange-700">
                  {item.query}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {usedCache && (
        <div role="status" aria-live="polite" className="surface rounded-2xl p-3 text-sm text-amber-900 bg-amber-50 border-amber-200">
          {t('offline') || 'Offline'}: showing cached products.
        </div>
      )}

      {recs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="brand-font text-xl font-bold text-slate-900">{t('recommendedForYou')}</h2>
            <a href="/concierge" className="text-sm text-orange-600 font-semibold">See your full plan</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.filter((p) => recs.some((r) => r.title === p.title)).slice(0, 3).map((p, idx) => (
              <div key={p._id} style={{ animation: `fadeUp 320ms ease-out ${idx * 80}ms both` }}>
                <ProductCard
                  product={p}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={toggleWishlist}
                  inWishlist={wishlistIds.has(p._id)}
                  onCompare={handleCompare}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="brand-font text-xl font-bold text-slate-900">Shop All Products</h2>
          {!loading && <div className="text-sm text-slate-500">{items.length} items</div>}
        </div>
        {loading ? <p>{t('loading')}</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map((p, idx) => (
              <div key={p._id} style={{ animation: `fadeUp 320ms ease-out ${Math.min(idx, 6) * 60}ms both` }}>
                <ProductCard
                  product={p}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={toggleWishlist}
                  inWishlist={wishlistIds.has(p._id)}
                  onCompare={handleCompare}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {!loading && items.length > pageSize && (
        <Pagination page={page} total={items.length} pageSize={pageSize} onPageChange={setPage} />
      )}
    </div>
  )
}
