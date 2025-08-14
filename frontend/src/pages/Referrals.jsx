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
    } catch (e) {
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
    } catch (e) {
      setError('Failed to create referral')
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [])

  const shareUrl = ref ? `${window.location.origin}/?ref=${ref.code}` : ''

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Referrals</h1>
      <div className="bg-white rounded shadow p-4">
        {loading ? <div>Loading...</div> : ref ? (
          <div>
            <div className="text-sm text-gray-600 mb-1">Your referral code</div>
            <div className="text-2xl font-bold">{ref.code}</div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-1">Share link</div>
              <div className="flex gap-2">
                <input readOnly value={shareUrl} className="border rounded px-3 py-2 flex-1" />
                <button className="border rounded px-3 py-2" onClick={()=>{ navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(()=>setCopied(false),1500) }}>{copied ? 'Copied!' : 'Copy'}</button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-gray-600 mb-3">You don't have a referral code yet.</div>
            <button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded">Generate my code</button>
          </div>
        )}
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>
    </div>
  )
}
