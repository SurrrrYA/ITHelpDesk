import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api, apiErrorMessage, apiFieldErrors } from '../lib/api'
import type { User } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button, Card, CardBody, CardHeader, Field, Input } from '../components/ui'

export function ProfilePage() {
  const { user, refreshUser } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [department, setDepartment] = useState(user?.department ?? '')
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({})
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({})
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setPhone(user.phone ?? '')
    setDepartment(user.department ?? '')
  }, [user])

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault()
    setProfileErrors({})
    setProfileError(null)
    setProfileSuccess(null)
    setSavingProfile(true)

    try {
      await api.put<{ data: User }>('/auth/profile', {
        name,
        phone: phone || null,
        department: department || null,
      })
      await refreshUser()
      setProfileSuccess('Profil berhasil diperbarui.')
    } catch (err) {
      setProfileErrors(apiFieldErrors(err))
      setProfileError(apiErrorMessage(err, 'Gagal memperbarui profil.'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setPasswordErrors({})
    setPasswordError(null)
    setPasswordSuccess(null)
    setSavingPassword(true)

    try {
      await api.put('/auth/password', {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      })
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setPasswordSuccess('Password berhasil diperbarui.')
    } catch (err) {
      setPasswordErrors(apiFieldErrors(err))
      setPasswordError(apiErrorMessage(err, 'Gagal memperbarui password.'))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <PageHeader title="Profil" description="Kelola informasi akun dan keamanan Anda." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-zinc-900">Informasi Akun</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Email dan role tidak dapat diubah sendiri. Hubungi admin bila perlu.
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={(event) => void handleProfileSubmit(event)} className="space-y-4">
              <Field label="Email" htmlFor="profile-email">
                <Input id="profile-email" value={user?.email ?? ''} disabled />
              </Field>

              <Field label="Role" htmlFor="profile-role">
                <Input id="profile-role" value={user?.role_label ?? ''} disabled />
              </Field>

              <Field label="Nama" htmlFor="profile-name" required error={profileErrors.name?.[0]}>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  required
                />
              </Field>

              <Field label="Telepon" htmlFor="profile-phone" error={profileErrors.phone?.[0]}>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={30}
                  placeholder="08xxxxxxxxxx"
                />
              </Field>

              <Field
                label="Departemen"
                htmlFor="profile-department"
                error={profileErrors.department?.[0]}
              >
                <Input
                  id="profile-department"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  maxLength={100}
                  placeholder="Contoh: Keuangan"
                />
              </Field>

              {profileError && <p className="text-xs text-red-600">{profileError}</p>}
              {profileSuccess && <p className="text-xs text-emerald-600">{profileSuccess}</p>}

              <Button type="submit" loading={savingProfile}>
                Simpan Profil
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-zinc-900">Ubah Password</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Setelah password diubah, sesi lain akan otomatis keluar.
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={(event) => void handlePasswordSubmit(event)} className="space-y-4">
              <Field
                label="Password saat ini"
                htmlFor="current-password"
                required
                error={passwordErrors.current_password?.[0]}
              >
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </Field>

              <Field
                label="Password baru"
                htmlFor="new-password"
                required
                hint="Minimal 8 karakter, mengandung huruf dan angka."
                error={passwordErrors.password?.[0]}
              >
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>

              <Field
                label="Konfirmasi password baru"
                htmlFor="confirm-password"
                required
                error={passwordErrors.password_confirmation?.[0]}
              >
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  required
                />
              </Field>

              {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-emerald-600">{passwordSuccess}</p>}

              <Button type="submit" loading={savingPassword}>
                Ubah Password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
