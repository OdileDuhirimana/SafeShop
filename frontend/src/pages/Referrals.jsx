import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Referrals(){
  const [ref, setRef] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function load(){
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/referrals/mine')
      setRef(data)
    } catch {
      setError('Failed to load referral')
    } finally {
      setLoading(false)
    }
  }

  async function create(){
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/referrals')
      setRef(data)
    } catch {
      setError('Failed to create referral')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const shareUrl = ref ? `${window.location.origin}/?ref=${ref.code}` : ''

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">Referrals</h1>
        <p className="text-slate-600 mt-1">Share your code and invite friends to SafeShop.</p>
      </div>

      <div className="surface rounded-3xl p-5">
        {loading ? <div>Loading...</div> : ref ? (
          <div>
            <div className="text-sm text-slate-600 mb-1">Your referral code</div>
            <div className="text-3xl font-extrabold text-slate-900">{ref.code}</div>
            <div className="mt-4">
              <div className="text-sm text-slate-600 mb-1">Share link</div>
              <div className="flex gap-2">
                <input readOnly value={shareUrl} className="px-3 py-2.5 flex-1" />
                <button className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white" onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>{copied ? 'Copied!' : 'Copy'}</button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-slate-600 mb-3">You don't have a referral code yet.</div>
            <button onClick={create} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl">Generate my code</button>
          </div>
        )}
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>
    </div>
  )
}
