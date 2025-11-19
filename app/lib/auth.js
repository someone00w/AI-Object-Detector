import bcrypt from 'bcryptjs'

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12) // Increased from 10
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password) {
  if (password.length < 12) { // Increased from 8
    return { valid: false, message: 'Password must be at least 12 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' }
  }
  
  // Check for common passwords
  const commonPasswords = ['password123', 'admin123', '12345678', 'qwerty123']
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return { valid: false, message: 'Password is too common' }
  }
  
  return { valid: true }
}