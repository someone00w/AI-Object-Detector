import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long')
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at
    },
    JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'diddywatch',
      audience: 'diddywatch-users'
    }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'diddywatch',
      audience: 'diddywatch-users'
    })
  } catch (error) {
    console.error('Token verification failed:', error.message)
    return null
  }
}