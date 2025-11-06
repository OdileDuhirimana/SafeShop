import React from 'react'

export default function Badge({ children, color = 'blue', className = '' }){
  const colors = {
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colors[color] || colors.blue} ${className}`}>
      {children}
    </span>
  )
}
