import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'

export function useProducts(initialParams = {}){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [params, setParams] = useState(initialParams)

  const fetchProducts = useCallback(async (override) => {
    setLoading(true)
    setError('')
    try {
      const p = { ...(override || params) }
      const { data } = await api.get('/products', { params: p })
      setItems(data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchProducts() }, [])

  return { items, loading, error, params, setParams, refetch: fetchProducts }
}
