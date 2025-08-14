import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const api = axios.create({ baseURL: API_URL + '/api' })

export function setAuthToken(token){
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    try { localStorage.setItem('auth_token', token) } catch {}
  } else {
    delete api.defaults.headers.common['Authorization']
    try { localStorage.removeItem('auth_token') } catch {}
  }
}
