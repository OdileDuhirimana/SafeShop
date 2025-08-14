import React from 'react'

export default function Badge({ children, color = 'blue', className = '' }){
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color]||colors.blue} ${className}`}>
      {children}
    </span>
  )
}
