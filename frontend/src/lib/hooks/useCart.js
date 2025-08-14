import { useCallback, useState } from 'react'
import { api } from '../../lib/api'

export function useCart(){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cart, setCart] = useState({ items: [] })

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { data } = await api.get('/cart')
      setCart(data)
    } catch(e){ setError(e?.response?.data?.error || 'Failed to load cart') }
    setLoading(false)
  }, [])

  const add = useCallback(async ({ productId, title, price, quantity = 1 }) => {
    setError('')
    try {
      const { data } = await api.post('/cart/add', { productId, title, price, quantity })
      setCart(data)
    } catch(e){ setError(e?.response?.data?.error || 'Failed to add to cart') }
  }, [])

  const update = useCallback(async ({ productId, quantity }) => {
    setError('')
    try {
      const { data } = await api.post('/cart/update', { productId, quantity })
      setCart(data)
    } catch(e){ setError(e?.response?.data?.error || 'Failed to update cart') }
  }, [])

  const remove = useCallback(async ({ productId }) => {
    setError('')
    try {
      const { data } = await api.post('/cart/remove', { productId })
      setCart(data)
    } catch(e){ setError(e?.response?.data?.error || 'Failed to remove from cart') }
  }, [])

  const clear = useCallback(async () => {
    setError('')
    try {
      const { data } = await api.post('/cart/clear')
      setCart(data)
    } catch(e){ setError(e?.response?.data?.error || 'Failed to clear cart') }
  }, [])

  return { cart, loading, error, load, add, update, remove, clear }
}
