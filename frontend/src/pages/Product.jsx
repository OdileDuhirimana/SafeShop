import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../store'
import { useI18n } from '../i18n.jsx'
import RatingStars from '../components/RatingStars'

export default function Product(){
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [questions, setQuestions] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [answerDraft, setAnswerDraft] = useState({})
  const [error, setError] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [page, setPage] = useState(1)
  const [alertTarget, setAlertTarget] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [qaMessage, setQaMessage] = useState('')
  const pageSize = 5
  const { t } = useI18n()
  const dispatch = useDispatch()
  const token = useSelector((s) => s.auth.token)
  const user = useSelector((s) => s.auth.user)

  const canAnswer = user?.role === 'seller' || user?.role === 'admin'

  useEffect(() => {
    ;(async () => {
      try {
        const [{ data: p }, { data: rv }, { data: qna }] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/${id}`),
          api.get(`/questions/${id}`),
        ])
        setProduct(p)
        const current = p.flashEnds && p.flashPrice && new Date(p.flashEnds) > new Date() ? p.flashPrice : p.price
        setAlertTarget(String(current || p.price || ''))
        setReviews(rv)
        setQuestions(qna || [])
        if (token) {
          api.post(`/recently-viewed/${id}`).catch(() => {})
        }
      } catch {}
    })()
  }, [id, token])

  async function reloadQuestions(){
    try {
      const { data } = await api.get(`/questions/${id}`)
      setQuestions(data || [])
    } catch {}
  }

  async function submitReview(){
    setError('')
    try {
      const { data } = await api.post(`/reviews/${id}`, { rating, comment })
      setReviews([data, ...reviews])
      setComment('')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to submit review')
    }
  }

  async function createPriceAlert(){
    if (!token) {
      setAlertMessage('Login required to create alerts')
      return
    }
    try {
      await api.post('/alerts', { productId: id, targetPrice: Number(alertTarget) })
      setAlertMessage('Alert created. We will flag this in your alerts center.')
    } catch (e) {
      setAlertMessage(e?.response?.data?.error || 'Failed to create alert')
    }
  }

  async function submitQuestion(){
    setQaMessage('')
    if (!token) {
      setQaMessage('Login required to ask a question')
      return
    }
    try {
      await api.post(`/questions/${id}`, { question: questionText })
      setQuestionText('')
      setQaMessage('Question submitted')
      await reloadQuestions()
    } catch (e) {
      setQaMessage(e?.response?.data?.error || 'Failed to submit question')
    }
  }

  async function submitAnswer(questionId){
    const answer = String(answerDraft[questionId] || '').trim()
    if (!answer) return
    try {
      await api.post(`/questions/${questionId}/answer`, { answer })
      setAnswerDraft({ ...answerDraft, [questionId]: '' })
      await reloadQuestions()
    } catch {}
  }

  const effectivePrice = product?.flashEnds && product?.flashPrice && new Date(product.flashEnds) > new Date()
    ? product.flashPrice
    : product?.price
  const total = reviews.length || 0
  const counts = [1, 2, 3, 4, 5].reduce((acc, n) => (acc[n] = reviews.filter((r) => r.rating === n).length, acc), {})
  const avg = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0.0'
  const start = (page - 1) * pageSize
  const visible = reviews.slice(start, start + pageSize)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (!product) return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-3">
        <div className="animate-pulse surface rounded-3xl h-72" />
        <div className="animate-pulse surface rounded-3xl h-48" />
      </div>
      <div className="animate-pulse surface rounded-3xl h-56" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 surface rounded-3xl p-4 md:p-5">
          <nav className="text-sm text-slate-500 mb-3" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1">
              <li><Link className="text-orange-600" to="/">{t('products')}</Link></li>
              <li aria-hidden>›</li>
              <li>{product.category || t('details')}</li>
            </ol>
          </nav>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="bg-white rounded-2xl p-3 flex items-center justify-center h-80 border border-slate-100">
                {product.images?.[activeImg] ? (
                  <img src={product.images[activeImg]} alt={product.title} className="max-h-72 object-contain" />
                ) : (
                  <div className="text-slate-400">{t('images')}</div>
                )}
              </div>
              {product.images?.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-auto" role="list">
                  {product.images.map((src, idx) => (
                    <button key={idx} role="listitem" aria-label={`Image ${idx + 1}`} onClick={() => setActiveImg(idx)} className={`h-16 w-16 rounded-xl border ${idx === activeImg ? 'ring-2 ring-orange-500 border-orange-300' : 'border-slate-200'}`}>
                      <img src={src} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover rounded-xl" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h1 className="brand-font text-2xl md:text-3xl font-extrabold text-slate-900">{product.title}</h1>
              <div className="text-slate-600 mt-1">{product.brand} · {product.category}</div>
              <div className="mt-2"><RatingStars value={product.rating || 0} /></div>
              <div className="mt-4 text-slate-700 leading-relaxed">{product.description}</div>
            </div>
          </div>
        </div>

        <div className="surface-strong rounded-3xl p-4 h-max sticky top-28">
          <div className="text-3xl font-extrabold text-slate-900 mb-1">${effectivePrice}</div>
          <div className={`text-sm mb-4 ${product.stock > 0 ? 'text-emerald-700' : 'text-red-700'}`}>{product.stock > 0 ? t('inStock') : `${t('status')}: out of stock`}</div>
          <button className="w-full px-4 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600" aria-label={t('addToCart')} onClick={() => dispatch(addToCart({ productId: product._id, title: product.title, price: effectivePrice }))}>{t('addToCart')}</button>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="text-sm font-semibold mb-2">{t('createAlert')}</div>
            <label className="block text-xs text-slate-600 mb-1" htmlFor="target-price">{t('targetPrice')}</label>
            <input id="target-price" type="number" min={0} step="0.01" value={alertTarget} onChange={(e) => setAlertTarget(e.target.value)} className="w-full px-3 py-2.5" />
            <button onClick={createPriceAlert} className="mt-2 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white">{t('createAlert')}</button>
            {alertMessage && <div className="text-xs text-slate-600 mt-2">{alertMessage}</div>}
            <Link to="/alerts" className="text-orange-600 text-sm inline-block mt-2">{t('manageAlerts')}</Link>
          </div>
        </div>
      </div>

      <div className="surface rounded-3xl p-4 md:p-5">
        <div className="font-bold mb-2">Customer Q&A</div>
        <div className="flex gap-2 mb-3">
          <input value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Ask about size, specs, warranty, shipping..." className="px-3 py-2.5 flex-1" />
          <button onClick={submitQuestion} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white">Ask</button>
        </div>
        {qaMessage && <div className="text-sm text-slate-600 mb-2">{qaMessage}</div>}
        <div className="space-y-3">
          {questions.length === 0 && <div className="text-sm text-slate-600">No questions yet.</div>}
          {questions.map((q) => (
            <div key={q._id} className="border border-slate-200 bg-white rounded-2xl p-3">
              <div className="text-sm font-semibold">Q: {q.question}</div>
              {q.answer ? <div className="text-sm text-slate-700 mt-1">A: {q.answer}</div> : <div className="text-sm text-amber-700 mt-1">Awaiting answer</div>}
              {canAnswer && !q.answer && (
                <div className="mt-2 flex gap-2">
                  <input value={answerDraft[q._id] || ''} onChange={(e) => setAnswerDraft({ ...answerDraft, [q._id]: e.target.value })} placeholder="Write answer" className="px-3 py-2.5 flex-1 text-sm" />
                  <button onClick={() => submitAnswer(q._id)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">Answer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 surface rounded-3xl p-4">
          <h2 className="brand-font text-xl font-bold mb-2">{t('reviews')}</h2>
          <div className="text-3xl font-extrabold mb-2">{avg}<span className="text-sm text-slate-500">/5</span></div>
          <div className="text-sm text-slate-600">{total} ratings</div>
          <div className="mt-3 space-y-1">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div className="w-10 text-sm">{n}★</div>
                <div className="flex-1 bg-slate-200 h-2 rounded-full">
                  <div style={{ width: `${total ? (counts[n] / total * 100) : 0}%` }} className="h-2 bg-orange-500 rounded-full"></div>
                </div>
                <div className="w-8 text-right text-xs text-slate-600">{counts[n] || 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="surface rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="sr-only" htmlFor="ratingSel">{t('rating')}</label>
              <select id="ratingSel" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="px-2 py-2">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <input aria-label={t('addReview')} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('addReview')} className="px-3 py-2.5 flex-1" />
              <button className="px-4 py-2.5 rounded-xl bg-slate-900 text-white" onClick={submitReview}>{t('addReview')}</button>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>

          <div className="space-y-3">
            {visible.map((r) => (
              <div key={r._id} className="surface rounded-2xl p-3">
                <div className="text-sm text-slate-500">{t('rating')}: {r.rating} / 5</div>
                <div>{r.comment}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50">Prev</button>
            <div className="text-sm text-slate-600">Page {page} of {totalPages}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
