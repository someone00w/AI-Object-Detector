import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth(options = {}) {
  const { requireAdmin = false, redirectTo = '/pages/login' } = options
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session')
      
      if (!response.ok) {
        router.push(redirectTo)
        return
      }

      const data = await response.json()
      
      // Check admin access if required
      if (requireAdmin && data.user.role !== 1) {
        alert('Access denied! This page is for admins only.')
        router.push('/pages/menu')
        return
      }

      setUser(data.user)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push(redirectTo)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading }
}