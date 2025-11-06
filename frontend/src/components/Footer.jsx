import React from 'react'

export default function Footer(){
  return (
    <footer className="mt-14 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="surface rounded-3xl p-6 md:p-7">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="brand-font text-lg font-bold text-slate-900">SafeShop</div>
              <div className="text-sm text-slate-600 mt-1">Buyer-first ecommerce with smarter checkout, trust, and speed.</div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <a className="hover:text-slate-900" href="#">Privacy</a>
              <a className="hover:text-slate-900" href="#">Terms</a>
              <a className="hover:text-slate-900" href="#">Support</a>
            </div>
          </div>
          <div className="mt-5 text-xs text-slate-500">© {new Date().getFullYear()} SafeShop. Crafted for premium portfolio UX.</div>
        </div>
      </div>
    </footer>
  )
}
