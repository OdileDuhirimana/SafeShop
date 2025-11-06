import React from 'react'

export default function Card({ className = '', children, ...props }){
  return (
    <div className={`surface rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  )
}
