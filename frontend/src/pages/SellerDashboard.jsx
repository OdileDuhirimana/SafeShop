import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useSelector } from 'react-redux'
import { useI18n } from '../i18n.jsx'

export default function SellerDashboard(){
  const { t } = useI18n()
  const [data, setData] = useState(null)
  const [products, setProducts] = useState([])
  const user = useSelector(s => s.auth.user)
  useEffect(() => { (async () => {
    try { const { data } = await api.get('/metrics/seller'); setData(data) } catch {}
  })() }, [])
  useEffect(() => { (async () => {
    try { const { data } = await api.get('/products'); setProducts(data) } catch {}
  })() }, [])
  if (!data) return <div>{t('loading')}</div>
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{t('sellerDashboard') || 'Seller Dashboard'}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4"><div className="text-sm text-gray-600">{t('sales') || 'Total Sales'}</div><div className="text-2xl font-bold">${data.sales?.toFixed(2)}</div></div>
        <div className="bg-white rounded shadow p-4"><div className="text-sm text-gray-600">{t('products')}</div><div className="text-2xl font-bold">{data.productsCount}</div></div>
      </div>
      <div className="mt-6 bg-white rounded shadow">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold">{t('manage') || 'Manage Products'}</div>
          <a href="/seller/new" className="text-blue-600">{t('newProduct') || 'New Product'}</a>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">{t('products')}</th>
                <th className="p-2">{t('price') || 'Price'}</th>
                <th className="p-2">{t('stock') || 'Stock'}</th>
                <th className="p-2">{t('status') || 'Status'}</th>
                <th className="p-2">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {products.filter(p => !user || !p.sellerId || String(p.sellerId) === String(user.id)).map(p => (
                <tr key={p._id} className="border-b">
                  <td className="p-2">{p.title}</td>
                  <td className="p-2">${p.price}</td>
                  <td className="p-2">{p.stock}</td>
                  <td className="p-2">{p.stock > 0 ? t('inStock') : t('status')+': out'}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <a className="border rounded px-2 py-1" href={`/product/${p._id}`}>{t('view') || 'View'}</a>
                      <a className="border rounded px-2 py-1" href={`/seller/edit/${p._id}`}>{t('edit') || 'Edit'}</a>
                      <button className="border rounded px-2 py-1" onClick={async ()=>{ try { await api.delete(`/products/${p._id}`); setProducts(products.filter(x=>x._id!==p._id)) } catch {} }}>{t('delete') || 'Delete'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
