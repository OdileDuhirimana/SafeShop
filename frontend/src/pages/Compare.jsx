import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { removeFromCompare, clearCompare } from '../store'
import { useI18n } from '../i18n.jsx'

export default function Compare(){
  const { t } = useI18n()
  const items = useSelector((s) => s.compare.items)
  const dispatch = useDispatch()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">{t('compareProducts')}</h1>
        <p className="text-slate-600 mt-1">Review product specs side by side before you buy.</p>
      </div>

      {items.length === 0 ? (
        <div className="surface rounded-3xl p-6 text-slate-600">{t('noItemsToCompare')} <Link to="/" className="text-orange-600 font-semibold">Browse products</Link></div>
      ) : (
        <>
          <div className="flex gap-2">
            <button aria-label={t('clear')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white" onClick={() => dispatch(clearCompare())}>{t('clear')}</button>
          </div>
          <div className="surface rounded-3xl p-3 overflow-auto">
            <table className="min-w-full bg-white rounded-2xl overflow-hidden">
              <thead>
                <tr className="text-left border-b border-slate-200 bg-slate-50">
                  <th className="p-3">{t('title')}</th>
                  <th className="p-3">{t('brandLabel')}</th>
                  <th className="p-3">{t('category')}</th>
                  <th className="p-3">{t('price')}</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.productId} className="border-t border-slate-100">
                    <td className="p-3"><Link className="text-slate-900 hover:text-orange-600 font-semibold" to={`/product/${i.productId}`}>{i.title}</Link></td>
                    <td className="p-3">{i.brand || '-'}</td>
                    <td className="p-3">{i.category || '-'}</td>
                    <td className="p-3 font-semibold">${i.price}</td>
                    <td className="p-3"><button aria-label={t('remove')} className="text-red-600" onClick={() => dispatch(removeFromCompare({ productId: i.productId }))}>{t('remove')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
