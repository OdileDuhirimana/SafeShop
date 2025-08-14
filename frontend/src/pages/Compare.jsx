import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { removeFromCompare, clearCompare } from '../store'
import { useI18n } from '../i18n.jsx'

export default function Compare(){
  const { t } = useI18n()
  const items = useSelector(s => s.compare.items)
  const dispatch = useDispatch()
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{t('compareProducts')}</h1>
      {items.length === 0 ? <div>{t('noItemsToCompare')}</div> : (
        <div>
          <div className="mb-3 flex gap-2">
            <button aria-label={t('clear')} className="border px-3 py-2 rounded" onClick={()=>dispatch(clearCompare())}>{t('clear')}</button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="text-left">
                  <th className="p-2">{t('title')}</th>
                  <th className="p-2">{t('brandLabel')}</th>
                  <th className="p-2">{t('category')}</th>
                  <th className="p-2">{t('price')}</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.productId} className="border-t">
                    <td className="p-2">{i.title}</td>
                    <td className="p-2">{i.brand || '-'}</td>
                    <td className="p-2">{i.category || '-'}</td>
                    <td className="p-2">${i.price}</td>
                    <td className="p-2"><button aria-label={t('remove')} className="text-red-600" onClick={()=>dispatch(removeFromCompare({ productId: i.productId }))}>{t('remove')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
