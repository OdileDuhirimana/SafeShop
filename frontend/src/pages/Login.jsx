import React, { useState } from 'react'
import { api } from '../lib/api'
import { useDispatch } from 'react-redux'
import { setAuth, setCart } from '../store'
import { setAuthToken } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('password')
  const [name, setName] = useState('Demo User')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [totp, setTotp] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()

  async function submit(e){
    e.preventDefault()
    setError('')
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const body = mode === 'login' ? { email, password, totp: requires2FA ? totp : undefined } : { name, email, password }
      const { data } = await api.post(endpoint, body)
      dispatch(setAuth(data))
      setAuthToken(data.token)
      try {
        const cartRes = await api.get('/cart')
        dispatch(setCart(cartRes.data.items))
      } catch {}
      navigate('/')
    } catch (e) {
      const resp = e?.response?.data
      if (resp?.requires2FA) {
        setRequires2FA(true)
        setError('Two-factor code required')
        return
      }
      setError(resp?.error || 'Failed')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow p-6">
      <h1 className="text-xl font-semibold mb-4">{mode === 'login' ? 'Login' : 'Register'}</h1>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'register' && (
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="border rounded px-3 py-2 w-full" />
        )}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="border rounded px-3 py-2 w-full" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="border rounded px-3 py-2 w-full" />
        {mode === 'login' && requires2FA && (
          <input value={totp} onChange={e=>setTotp(e.target.value)} placeholder="2FA code" className="border rounded px-3 py-2 w-full" />
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">{mode === 'login' ? 'Login' : 'Create Account'}</button>
      </form>
      <button className="mt-3 text-sm text-gray-600" onClick={()=>setMode(mode==='login'?'register':'login')}>
        {mode==='login' ? 'Need an account? Register' : 'Have an account? Login'}
      </button>
      {mode==='login' && (
        <div className="mt-3 text-sm">
          <a className="text-blue-600" href="/security/2fa">Set up 2FA</a>
        </div>
      )}
    </div>
  )
}
