import { useCallback, useState } from 'react'
import { api } from '../../lib/api'

export function useWishlist(){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [productIds, setProductIds] = useState([])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { data } = await api.get('/wishlist')
      setProductIds(data.productIds || [])
    } catch(e){ setError(e?.response?.data?.error || 'Failed to load wishlist') }
    setLoading(false)
  }, [])

  const toggle = useCallback(async ({ productId }) => {
    setError('')
    try {
      await api.post('/wishlist/toggle', { productId })
      setProductIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId])
    } catch(e){ setError(e?.response?.data?.error || 'Failed to update wishlist') }
  }, [])

  return { productIds, loading, error, load, toggle }
}
