import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'
import Card from './Card'
import Badge from './Badge'
import RatingStars from './RatingStars'

export default function ProductCard({ product, onAddToCart, onToggleWishlist, inWishlist, onCompare }){
  const [now, setNow] = useState(Date.now())
  const flashEndsAt = product?.flashEnds ? new Date(product.flashEnds).getTime() : null
  const isFlash = flashEndsAt && flashEndsAt > now

  useEffect(() => {
    if (!isFlash) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isFlash])

  const countdown = useMemo(() => {
    if (!isFlash) return null
    const diff = flashEndsAt - now
    const s = Math.max(0, Math.floor(diff / 1000))
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${d}d ${h}h ${m}m ${sec}s`
  }, [isFlash, flashEndsAt, now])

  const effectivePrice = isFlash && typeof product?.flashPrice === 'number' ? product.flashPrice : product.price
  const hasDeal = isFlash && typeof product?.flashPrice === 'number' && product.flashPrice < product.price

  return (
    <Card className="p-3 relative group overflow-hidden hover:-translate-y-1 transition-transform duration-200">
      <button
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={() => onToggleWishlist?.(product._id)}
        className={`absolute top-3 right-3 z-10 h-9 w-9 rounded-full border text-lg ${inWishlist ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/90 border-slate-200 text-slate-700'} hover:shadow`}
        title={inWishlist ? 'In wishlist' : 'Add to wishlist'}
      >
        {inWishlist ? '♥' : '♡'}
      </button>

      <div className="relative rounded-2xl overflow-hidden mb-3 bg-slate-100">
        {isFlash && <Badge color="amber" className="absolute top-2 left-2 z-10">Flash</Badge>}
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.title} className="w-full h-44 object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        ) : (
          <img src="/assets/placeholder-product.jpg" alt={product.title} className="w-full h-44 object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        )}
        {isFlash && <div className="absolute bottom-2 left-2 chip bg-white/95">Ends in {countdown}</div>}
      </div>

      <div className="space-y-1">
        <Link to={`/product/${product._id}`} className="font-semibold text-slate-900 line-clamp-2 min-h-[2.8rem] hover:text-orange-600">{product.title}</Link>
        <div className="text-xs text-slate-500">{product.category || 'General'}</div>
      </div>

      <div className="mt-2">
        {hasDeal ? (
          <div className="flex items-center gap-2">
            <div className="text-lg font-extrabold text-slate-900">${effectivePrice}</div>
            <div className="text-sm text-slate-400 line-through">${product.price}</div>
          </div>
        ) : (
          <div className="text-lg font-extrabold text-slate-900">${effectivePrice}</div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <RatingStars value={product.rating || 0} />
        <span className={`text-xs font-semibold ${product.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {product.stock > 0 ? 'In stock' : 'Out of stock'}
        </span>
      </div>

      <div className="flex gap-2 mt-3">
        <Button onClick={() => onAddToCart?.(product)} variant="primary" className="flex-1">Add to Cart</Button>
        <Button onClick={() => onCompare?.(product)} variant="outline" className="px-3">Compare</Button>
      </div>
    </Card>
  )
}
