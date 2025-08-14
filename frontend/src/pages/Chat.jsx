import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useI18n } from '../i18n.jsx'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000'

export default function Chat(){
  const { t } = useI18n()
  const [socket, setSocket] = useState(null)
  const [room, setRoom] = useState('global')
  const [name, setName] = useState('Guest')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const s = io(WS_URL)
    setSocket(s)
    s.on('connect', () => {
      s.emit('join', room)
    })
    s.on('message', (msg) => {
      setMessages(prev => [...prev, msg])
    })
    return () => { s.disconnect() }
  }, [])

  function send(){
    if (!text.trim()) return
    socket.emit('message', { room, message: text, user: name })
    setText('')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">{t('chat')}</h1>
      <div className="bg-white rounded shadow p-4">
        <div className="flex gap-2 mb-3">
          <label className="sr-only" htmlFor="chat-room">{t('room')}</label>
          <input id="chat-room" value={room} onChange={e=>setRoom(e.target.value)} className="border px-2 py-1" />
          <label className="sr-only" htmlFor="chat-name">{t('name')}</label>
          <input id="chat-name" value={name} onChange={e=>setName(e.target.value)} className="border px-2 py-1" />
          <button onClick={()=>socket?.emit('join', room)} className="bg-gray-200 px-3 py-1 rounded">{t('join')}</button>
        </div>
        <div className="h-64 overflow-y-auto border rounded p-2 mb-3 bg-gray-50" aria-live="polite">
          {messages.map((m,i)=>(
            <div key={i} className="text-sm"><span className="font-semibold">{m.user}:</span> {m.message}</div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={e=>setText(e.target.value)} className="border px-2 py-2 flex-1" placeholder={t('typeMessage')} aria-label={t('typeMessage')} />
          <button onClick={send} className="bg-blue-600 text-white px-4 py-2 rounded">{t('send')}</button>
        </div>
      </div>
    </div>
  )
}
