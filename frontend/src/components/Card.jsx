import React from 'react'

export default function Card({ className = '', children, ...props }){
  return (
    <div className={`bg-white rounded shadow ${className}`} {...props}>
      {children}
    </div>
  )
}
