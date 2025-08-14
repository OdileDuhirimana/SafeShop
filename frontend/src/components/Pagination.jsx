import React from 'react'

export default function Pagination({ page, total, pageSize, onPageChange }){
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">Page {page} of {pages} • Total {total}</div>
      <div className="flex gap-2">
        <button aria-label="Previous page" disabled={page<=1} onClick={()=>onPageChange(Math.max(1, page-1))} className="border rounded px-3 py-2 disabled:opacity-50">Prev</button>
        <button aria-label="Next page" disabled={page>=pages} onClick={()=>onPageChange(Math.min(pages, page+1))} className="border rounded px-3 py-2 disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}
