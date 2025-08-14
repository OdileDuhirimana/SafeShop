import React from 'react'

export default function Button({ as: Comp = 'button', variant = 'primary', className = '', children, ...props }){
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50',
  }
  return (
    <Comp className={`inline-flex items-center justify-center px-4 py-2 rounded transition ${variants[variant]||variants.primary} ${className}`} {...props}>
      {children}
    </Comp>
  )
}
