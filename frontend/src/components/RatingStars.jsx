import React from 'react'

export default function RatingStars({ value = 0, outOf = 5, className = '' }){
  const v = Math.round(value || 0)
  return (
    <div className={`inline-flex items-center ${className}`} aria-label={`Rating: ${value || 0}`}>
      {Array.from({ length: outOf }).map((_,i)=> (
        <span key={i} aria-hidden className={i < v ? 'text-yellow-500' : 'text-gray-300'}>★</span>
      ))}
      <span className="ml-2 text-sm text-gray-600">{Number(value || 0).toFixed(1)} / {outOf}</span>
    </div>
  )
}
