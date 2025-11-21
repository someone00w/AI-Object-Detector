/**
 * Client-side CSRF token helper
 * This utility helps frontend code include CSRF tokens in API requests
 */

let cachedToken = null
let tokenExpiry = null

/**
 * Fetches a fresh CSRF token from the server
 * Tokens are cached for 50 minutes (server tokens expire in 1 hour)
 * Pass forceRefresh=true to bypass cache
 */
export async function getCsrfToken(forceRefresh = false) {
  // Return cached token if still valid and not forcing refresh
  if (!forceRefresh && cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    const response = await fetch('/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'include' // Include cookies
    })

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token')
    }

    const data = await response.json()
    cachedToken = data.csrfToken
    tokenExpiry = Date.now() + (50 * 60 * 1000) // Cache for 50 minutes

    return cachedToken
  } catch (error) {
    console.error('Error fetching CSRF token:', error)
    throw error
  }
}

/**
 * Makes a fetch request with CSRF token automatically included
 * Automatically retries once if CSRF token is invalid/expired
 * Usage: csrfFetch('/api/endpoint', { method: 'POST', body: ... })
 */
export async function csrfFetch(url, options = {}) {
  const token = await getCsrfToken()

  const headers = {
    ...options.headers,
    'X-CSRF-Token': token
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Include cookies
  })
  
  // If CSRF token is invalid/expired, retry once with a fresh token
  if (response.status === 403) {
    try {
      const errorData = await response.clone().json()
      if (errorData.error?.includes('CSRF')) {
        console.log('🔄 CSRF token expired, retrying with fresh token...')
        const freshToken = await getCsrfToken(true)
        
        const retryHeaders = {
          ...options.headers,
          'X-CSRF-Token': freshToken
        }
        
        return fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: 'include'
        })
      }
    } catch (e) {
      // If we can't parse the error, just return the original response
    }
  }

  return response
}

/**
 * Invalidates the cached CSRF token
 * Call this after logout or if you get a 403 CSRF error
 */
export function invalidateCsrfToken() {
  cachedToken = null
  tokenExpiry = null
}
