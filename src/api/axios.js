import axios from 'axios'
import { attachMocks } from './mock'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api',
})

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth')
  if (raw) {
    try {
      const { token } = JSON.parse(raw)
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {}
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('auth')
    }
    return Promise.reject(err)
  }
)

if (import.meta.env.VITE_USE_MOCKS === 'true') {
  try { attachMocks(api) } catch {}
}

export default api
