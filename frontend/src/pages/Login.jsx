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
      try { localStorage.setItem('auth_user', JSON.stringify(data.user)) } catch {}
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
    <div className="grid lg:grid-cols-2 gap-6 items-center">
      <section className="surface rounded-3xl p-6 md:p-8">
        <div className="chip mb-3">Secure Account</div>
        <h1 className="brand-font text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
          {mode === 'login' ? 'Welcome back to better shopping.' : 'Create your SafeShop account.'}
        </h1>
        <p className="text-slate-600 mt-3 max-w-lg">
          {mode === 'login'
            ? 'Sign in to access saved carts, price alerts, smart recommendations, and faster checkout.'
            : 'Register once and unlock personalized recommendations, saved addresses, and a smoother order experience.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="chip">Smart checkout</span>
          <span className="chip">Price alerts</span>
          <span className="chip">Order tracking</span>
        </div>
      </section>

      <section className="surface-strong rounded-3xl p-5 md:p-6">
        <h2 className="brand-font text-2xl font-bold text-slate-900 mb-4">{mode === 'login' ? 'Login' : 'Register'}</h2>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="px-3 py-2.5 w-full" />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="px-3 py-2.5 w-full" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="px-3 py-2.5 w-full" />
          {mode === 'login' && requires2FA && (
            <input value={totp} onChange={(e) => setTotp(e.target.value)} placeholder="2FA code" className="px-3 py-2.5 w-full" />
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="w-full bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-orange-600">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <button className="mt-3 text-sm text-slate-600 hover:text-slate-900" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
        {mode === 'login' && (
          <div className="mt-2 text-sm">
            <a className="text-orange-600" href="/security/2fa">Set up 2FA</a>
          </div>
        )}
      </section>
    </div>
  )
}
