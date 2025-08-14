import React, { useEffect, useMemo, useState } from 'react'
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

  return (
    <Card className="p-4 relative">
      <button
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={() => onToggleWishlist?.(product._id)}
        className={`absolute top-2 right-2 px-2 py-1 rounded border ${inWishlist ? 'bg-rose-600 text-white' : 'bg-white'} hover:shadow`}
        title={inWishlist ? 'In wishlist' : 'Add to wishlist'}
      >
        {inWishlist ? '♥' : '♡'}
      </button>
      {isFlash && <Badge color="amber" className="absolute top-2 left-2">Flash Sale</Badge>}
      {isFlash && <div className="absolute top-10 left-2 text-xs text-amber-800">Ends in {countdown}</div>}
      {product.images?.[0] ? (
        <img src={product.images[0]} alt={product.title} className="w-full h-32 object-cover rounded mb-2" />
      ) : (
        <img src="/assets/placeholder-product.jpg" alt={product.title} className="w-full h-32 object-cover rounded mb-2" />
      )}
      <div className="font-semibold pr-10 line-clamp-2 min-h-[2.5rem]">{product.title}</div>
      <div className="text-sm text-gray-600">{product.category}</div>
      <div className="mt-2 font-bold">${product.price}</div>
      <div className="mt-2">
        <RatingStars value={product.rating || 0} />
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={() => onAddToCart?.(product)} variant="primary">Add to Cart</Button>
        <Button onClick={() => onCompare?.(product)} variant="outline">Compare</Button>
      </div>
    </Card>
  )
}
