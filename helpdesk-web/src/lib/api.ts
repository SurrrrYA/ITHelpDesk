import axios, { AxiosError } from 'axios'

export const TOKEN_KEY = 'helpdesk_token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  headers: {
    Accept: 'application/json',
  },
})

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      clearToken()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export function apiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'Tidak dapat terhubung ke server. Pastikan backend berjalan dan alamat API sudah benar.'
    }

    if (error.response.status === 429) {
      return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
    }

    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined

    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined

    return firstError ?? data?.message ?? fallback
  }

  return fallback
}

export function apiFieldErrors(error: unknown): Record<string, string[]> {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { errors?: Record<string, string[]> } | undefined

    return data?.errors ?? {}
  }

  return {}
}

export async function downloadFile(url: string, fileName: string): Promise<void> {
  const response = await api.get(url, { responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')

  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}
