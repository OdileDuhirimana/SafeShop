import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useDispatch } from 'react-redux'
import { addToCart } from '../store'
import { useI18n } from '../i18n.jsx'
import RatingStars from '../components/RatingStars'

export default function Product(){
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 5
  const { t } = useI18n()
  const dispatch = useDispatch()

  useEffect(() => { (async () => {
    try {
      const { data } = await api.get(`/products/${id}`)
      setProduct(data)
      const rv = await api.get(`/reviews/${id}`)
      setReviews(rv.data)
    } catch {}
  })() }, [id])

  async function submitReview(){
    setError('')
    try {
      const { data } = await api.post(`/reviews/${id}`, { rating, comment })
      setReviews([data, ...reviews])
      setComment('')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to submit review')
    }
  }

  const total = reviews.length || 0
  const counts = [1,2,3,4,5].reduce((acc, n) => (acc[n]=reviews.filter(r=>r.rating===n).length, acc), {})
  const avg = total ? (reviews.reduce((s,r)=>s+r.rating,0)/total).toFixed(1) : '0.0'
  const start = (page-1)*pageSize
  const visible = reviews.slice(start, start+pageSize)
  const totalPages = Math.max(1, Math.ceil(total/pageSize))

  if (!product) return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-3">
        <div className="animate-pulse bg-white rounded shadow h-64" />
        <div className="animate-pulse bg-white rounded shadow h-40" />
      </div>
      <div className="animate-pulse bg-white rounded shadow h-48" />
    </div>
  )
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <nav className="text-sm text-gray-600 mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1">
            <li><Link className="text-blue-600" to="/">{t('products')}</Link></li>
            <li aria-hidden>›</li>
            <li>{product.category || t('details')}</li>
          </ol>
        </nav>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="bg-white rounded shadow p-2 flex items-center justify-center h-80">
              {product.images?.[activeImg] ? (
                <img src={product.images[activeImg]} alt={product.title} className="max-h-72 object-contain" />
              ) : (
                <div className="text-gray-400">{t('images')}</div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-auto" role="list">
                {product.images.map((src, idx) => (
                  <button key={idx} role="listitem" aria-label={`Image ${idx+1}`} onClick={()=>setActiveImg(idx)} className={`h-16 w-16 rounded border ${idx===activeImg?'ring-2 ring-blue-600':''}`}>
                    {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                    <img src={src} alt={`Thumbnail ${idx+1}`} className="h-full w-full object-cover rounded" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <div className="text-gray-600">{product.brand} • {product.category}</div>
            <div className="mt-2">
              <RatingStars value={product.rating || 0} />
            </div>
            <div className="mt-4 text-gray-800 leading-relaxed">{product.description}</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded shadow p-4 h-max md:sticky md:top-20">
        <div className="text-2xl font-bold mb-2">${product.price}</div>
        <div className="text-sm text-gray-600 mb-3">{product.stock > 0 ? t('inStock') : t('status')+': out of stock'}</div>
        <button className="focus:outline-none focus:ring-2 focus:ring-blue-600 bg-green-600 text-white px-4 py-2 rounded w-full" aria-label={t('addToCart')} onClick={()=>dispatch(addToCart({ productId: product._id, title: product.title, price: product.price }))}>{t('addToCart')}</button>
      </div>
      <div className="md:col-span-3 mt-8">
        <h2 className="text-xl font-semibold mb-2">{t('reviews')}</h2>
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="text-2xl font-bold mb-2">{avg}<span className="text-sm text-gray-600">/5</span></div>
          <div className="text-sm text-gray-600">{total} ratings</div>
          <div className="mt-2 space-y-1">
            {[5,4,3,2,1].map(n => (
              <div key={n} className="flex items-center gap-2">
                <div className="w-10 text-sm">{n}★</div>
                <div className="flex-1 bg-gray-200 h-2 rounded">
                  <div style={{width: `${total? (counts[n]/total*100):0}%`}} className="h-2 bg-amber-500 rounded"></div>
                </div>
                <div className="w-8 text-right text-xs text-gray-600">{counts[n]||0}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label className="sr-only" htmlFor="ratingSel">{t('rating')}</label>
            <select id="ratingSel" value={rating} onChange={e=>setRating(Number(e.target.value))} className="border px-2 py-1">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input aria-label={t('addReview')} value={comment} onChange={e=>setComment(e.target.value)} placeholder={t('addReview')} className="border px-3 py-2 flex-1" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submitReview}>{t('addReview')}</button>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
        <div className="space-y-3">
          {visible.map(r => (
            <div key={r._id} className="bg-white rounded shadow p-3">
              <div className="text-sm text-gray-600">{t('rating')}: {r.rating} / 5</div>
              <div>{r.comment}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="border rounded px-3 py-2 disabled:opacity-50">Prev</button>
          <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="border rounded px-3 py-2 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )
}
