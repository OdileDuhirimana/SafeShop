const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000'

export async function getRecommendations(userId=null, history=[]) {
  const res = await fetch(`${AI_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, history })
  })
  if (!res.ok) throw new Error('AI recommend failed')
  return res.json()
}
