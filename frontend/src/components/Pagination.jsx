import React from 'react'

export default function Pagination({ page, total, pageSize, onPageChange }){
  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="surface rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 p-3">
      <div className="text-sm text-slate-600">Page {page} of {pages} · {total} products</div>
      <div className="flex gap-2">
        <button aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50">Prev</button>
        <button aria-label="Next page" disabled={page >= pages} onClick={() => onPageChange(Math.min(pages, page + 1))} className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}
