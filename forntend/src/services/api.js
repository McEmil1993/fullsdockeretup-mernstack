/**
 * API Service Layer
 * Handles all HTTP requests with cookie-based authentication using axios
 * Includes automatic token refresh on 401 errors
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.24.104.200:3000'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Critical: sends cookies with request
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent infinite refresh loops
let isRefreshing = false
let failedQueue = []

const processQueue = (error = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  
  failedQueue = []
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add Content-Type only if body exists and not already set
    if (config.data && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for automatic token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized - try to refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/api/auth/refresh' &&
      originalRequest.url !== '/api/auth/login'
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to refresh the token
        await apiClient.post('/api/auth/refresh')
        
        // Process queued requests - resolve them
        processQueue()
        isRefreshing = false

        // Retry the original request
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed - user needs to log in again
        const logoutError = new Error('Session expired. Please log in again.')
        processQueue(logoutError)
        isRefreshing = false
        
        // Dispatch logout event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
        
        return Promise.reject(logoutError)
      }
    }

    // Handle other errors
    // Don't log 401 errors to console (expected when not logged in)
    if (error.response?.status !== 401) {
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message ||
                           (error.response ? `HTTP ${error.response.status}: ${error.response.statusText}` : 'Network error')
      
      return Promise.reject(new Error(errorMessage))
    }
    
    // For 401 errors, still reject but don't log
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Unauthorized'
    
    return Promise.reject(new Error(errorMessage))
  }
)

/**
 * GET request
 */
export async function get(endpoint) {
  const response = await apiClient.get(endpoint)
  return { data: response.data, response }
}

/**
 * POST request
 */
export async function post(endpoint, body) {
  const response = await apiClient.post(endpoint, body)
  return { data: response.data, response }
}

/**
 * PUT request
 */
export async function put(endpoint, body) {
  const response = await apiClient.put(endpoint, body)
  return { data: response.data, response }
}

/**
 * DELETE request
 */
export async function del(endpoint) {
  const response = await apiClient.delete(endpoint)
  return { data: response.data, response }
}

/**
 * Health check
 */
export async function healthCheck() {
  return get('/health')
}

export default {
  get,
  post,
  put,
  delete: del,
  healthCheck,
}
