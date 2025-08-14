import React from 'react'

export default function Footer(){
  return (
    <footer className="mt-10 border-t">
      <div className="max-w-6xl mx-auto p-6 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-2">
        <div>© {new Date().getFullYear()} SafeShop</div>
        <div className="flex items-center gap-4">
          <a className="hover:text-gray-900" href="#">Privacy</a>
          <a className="hover:text-gray-900" href="#">Terms</a>
          <a className="hover:text-gray-900" href="#">Help</a>
        </div>
      </div>
    </footer>
  )
}
