import React, { useState } from 'react'
import { api } from '../lib/api'

export default function TwoFactor(){
  const [email, setEmail] = useState('')
  const [otpauth, setOtpauth] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function setup(){
    setError(''); setMessage(''); setOtpauth('')
    try {
      const { data } = await api.post('/auth/2fa/setup', { email })
      setOtpauth(data.otpauth)
      setMessage('Scan this QR URL in your authenticator app, then enter a code to enable.')
    } catch (e) {
      setError(e?.response?.data?.error || 'Setup failed')
    }
  }

  async function enable(){
    setError(''); setMessage('')
    try {
      await api.post('/auth/2fa/enable', { email, code })
      setMessage('Two-factor authentication enabled.')
    } catch (e) {
      setError(e?.response?.data?.error || 'Enable failed')
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Two-Factor Authentication</h1>
      <div className="bg-white rounded shadow p-4 space-y-3">
        <div>
          <label htmlFor="tf-email" className="block text-sm text-gray-700 mb-1">Account Email</label>
          <input id="tf-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="you@example.com" />
        </div>
        <div className="flex gap-2">
          <button onClick={setup} className="bg-blue-600 text-white px-4 py-2 rounded">Generate Secret</button>
        </div>
        {otpauth && (
          <div className="mt-2 text-sm">
            <div className="text-gray-700 mb-1">OTP Auth URI (paste into authenticator app):</div>
            <textarea readOnly className="border rounded px-3 py-2 w-full" rows={3} value={otpauth} />
          </div>
        )}
        {otpauth && (
          <div>
            <label htmlFor="tf-code" className="block text-sm text-gray-700 mb-1">Enter code from app</label>
            <input id="tf-code" value={code} onChange={e=>setCode(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="123456" />
            <button onClick={enable} className="mt-3 bg-green-600 text-white px-4 py-2 rounded">Enable 2FA</button>
          </div>
        )}
        {message && <div className="text-green-700 text-sm">{message}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  )
}
