import React from 'react'

export default function Modal({ open, title, children, onClose, actions }){
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow p-6 w-96 max-w-[90vw]">
        {title && <div className="text-lg font-semibold mb-3">{title}</div>}
        <div>{children}</div>
        {actions && <div className="mt-4 flex justify-end gap-2">{actions}</div>}
        {!actions && (
          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="border rounded px-4 py-2">Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
