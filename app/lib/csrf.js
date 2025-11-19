import crypto from 'crypto'

const csrfTokens = new Map()

export function generateCsrfToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex')
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 3600000 // 1 hour
  })
  
  // Cleanup expired tokens
  for (const [id, data] of csrfTokens.entries()) {
    if (data.expires < Date.now()) {
      csrfTokens.delete(id)
    }
  }
  
  return token
}

export function validateCsrfToken(sessionId, token) {
  const record = csrfTokens.get(sessionId)
  
  if (!record) return false
  if (record.expires < Date.now()) {
    csrfTokens.delete(sessionId)
    return false
  }
  if (record.token !== token) return false
  
  return true
}