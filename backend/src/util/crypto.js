import crypto from 'crypto'

const base64Key = process.env.AES_KEY || ''
const key = base64Key ? Buffer.from(base64Key, 'base64') : null

export function encrypt(text){
  if (!key) return { iv: null, authTag: null, data: text }
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return { iv: iv.toString('base64'), authTag: authTag.toString('base64'), data: enc.toString('base64') }
}

export function decrypt(payload){
  if (!key || !payload?.iv) return payload?.data || ''
  const iv = Buffer.from(payload.iv, 'base64')
  const authTag = Buffer.from(payload.authTag, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const dec = Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()])
  return dec.toString('utf8')
}
