import validator from 'validator'
import xss from 'xss'

export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return null
  const normalized = validator.normalizeEmail(email)
  return validator.isEmail(normalized) ? normalized : null
}

export function sanitizeUsername(username) {
  if (!username || typeof username !== 'string') return null
  
  const cleaned = xss(username.trim())
  
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleaned)) return null
  
  return cleaned
}

export function sanitizeText(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return ''
  
  const cleaned = xss(text.trim())
  
  return cleaned.slice(0, maxLength)
}

export function sanitizeVideoName(name) {
  if (!name || typeof name !== 'string') return 'Untitled Video'
  
  const cleaned = xss(name.trim())
  
  const safe = cleaned.replace(/[^a-zA-Z0-9\s_-]/g, '')
  
  return safe.slice(0, 100) || 'Untitled Video'
}

export function validateFileUpload(file, allowedTypes, maxSizeMB = 50) {
  const errors = []
  
  if (!file) {
    errors.push('No file provided')
    return { valid: false, errors }
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    errors.push(`File too large. Maximum size: ${maxSizeMB}MB`)
  }

  return { 
    valid: errors.length === 0, 
    errors 
  }
}