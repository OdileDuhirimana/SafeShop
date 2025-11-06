import React from 'react'

export default function Button({ as: Comp = 'button', variant = 'primary', className = '', children, ...props }){
  const variants = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md border border-orange-500',
    secondary: 'bg-slate-900 text-white hover:bg-black border border-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
    outline: 'bg-white/90 text-slate-800 hover:bg-slate-50 border border-slate-200',
    soft: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200',
  }

  return (
    <Comp
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition duration-200 focus-ring ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  )
}
