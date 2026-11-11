import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiErrorMessage } from '../lib/api'
import { Button, Field, Input } from '../components/ui'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
      const state = location.state as LocationState | null
      navigate(state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Email atau password salah.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-blue-600 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-white/15 text-sm font-semibold">
            IT
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">IT Helpdesk</p>
            <p className="text-xs text-blue-100">Support Ticketing</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Kelola permintaan bantuan IT dalam satu tempat.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-blue-100">
            Buat tiket, pantau status penanganan, dan berkomunikasi dengan tim IT. Tim teknisi
            menangani antrean dengan batas waktu SLA yang jelas.
          </p>
        </div>

        <p className="text-xs text-blue-100">IT Helpdesk · Sistem internal perusahaan</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
              IT
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-zinc-900">IT Helpdesk</p>
              <p className="text-xs text-zinc-500">Support Ticketing</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Masuk ke akun</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Gunakan email kantor dan password Anda untuk melanjutkan.
          </p>

          <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@perusahaan.com"
                required
              />
            </Field>

            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" loading={submitting} className="w-full">
              Masuk
            </Button>
          </form>

          <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-medium text-zinc-700">Akun demo</p>
            <ul className="mt-2 space-y-1 text-xs text-zinc-500">
              <li>Admin: admin@helpdesk.test / Admin#12345</li>
              <li>Teknisi: teknisi1@helpdesk.test / Teknisi#12345</li>
              <li>Karyawan: karyawan1@helpdesk.test / Karyawan#12345</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
