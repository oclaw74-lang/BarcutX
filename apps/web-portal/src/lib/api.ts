import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const AUTH_TOKEN_KEY = 'barcutx_auth_token'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

// --- Request interceptor: attach Bearer token if present ---
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// --- Response interceptor: handle 401 and 5xx ---
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        window.location.href = '/login'
      }
    }

    if (error.response?.status !== undefined && error.response.status >= 500) {
      console.error(
        '[BarcutX API] Server error:',
        error.response.status,
        error.config?.url,
        error.message,
      )
    }

    return Promise.reject(error)
  },
)

export { AUTH_TOKEN_KEY }
