import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api, apiErrorMessage, apiFieldErrors } from '../../lib/api'
import { formatDateOnly } from '../../lib/format'
import type { Paginated, PaginationMeta, Role, User } from '../../types'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  LoadingState,
  Modal,
  Pagination,
  Select,
} from '../../components/ui'

const roleOptions: { value: Role; label: string }[] = [
  { value: 'employee', label: 'Karyawan' },
  { value: 'technician', label: 'Teknisi IT' },
  { value: 'admin', label: 'Admin' },
]

const roleLabels: Record<Role, string> = {
  employee: 'Karyawan',
  technician: 'Teknisi IT',
  admin: 'Admin',
}

interface UserForm {
  name: string
  email: string
  phone: string
  department: string
  role: Role
  is_active: boolean
  password: string
}

const emptyForm: UserForm = {
  name: '',
  email: '',
  phone: '',
  department: '',
  role: 'employee',
  is_active: true,
  password: '',
}

export function UsersPage() {
  const { user: currentUser } = useAuth()

  const [items, setItems] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params: Record<string, string | number> = { per_page: 10, page }

    if (appliedSearch) params.q = appliedSearch
    if (roleFilter) params.role = roleFilter
    if (statusFilter) params.status = statusFilter

    try {
      const response = await api.get<Paginated<User>>('/users', { params })
      setItems(response.data.data)
      setMeta(response.data.meta)
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat daftar pengguna.'))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, roleFilter, statusFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(search.trim())
  }

  function handleReset() {
    setSearch('')
    setAppliedSearch('')
    setRoleFilter('')
    setStatusFilter('')
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      department: user.department ?? '',
      role: user.role,
      is_active: user.is_active,
      password: '',
    })
    setFieldErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFieldErrors({})
    setFormError(null)

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        department: form.department || null,
        role: form.role,
        is_active: form.is_active,
        ...(form.password ? { password: form.password } : {}),
      }

      if (editing) {
        await api.put(`/users/${editing.id}`, payload)
      } else {
        await api.post('/users', payload)
      }

      setModalOpen(false)
      await load()
    } catch (err) {
      setFieldErrors(apiFieldErrors(err))
      setFormError(apiErrorMessage(err, 'Gagal menyimpan pengguna.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user: User) {
    if (!window.confirm(`Hapus pengguna "${user.name}"?`)) return

    setError(null)

    try {
      await api.delete(`/users/${user.id}`)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menghapus pengguna.'))
    }
  }

  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Kelola akun karyawan, teknisi, dan admin."
        actions={<Button onClick={openCreate}>Tambah Pengguna</Button>}
      />

      <Card className="mb-4">
        <CardBody>
          <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Cari" htmlFor="user-search">
              <Input
                id="user-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nama atau email"
              />
            </Field>

            <Field label="Role" htmlFor="user-role">
              <Select
                id="user-role"
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Semua role</option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Status" htmlFor="user-status">
              <Select
                id="user-status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </Select>
            </Field>

            <div className="flex items-end gap-2">
              <Button type="submit" variant="secondary">
                Terapkan
              </Button>
              <Button type="button" variant="ghost" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="Tidak ada pengguna"
            description="Belum ada pengguna yang cocok dengan filter saat ini."
            action={<Button onClick={openCreate}>Tambah Pengguna</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-5 py-3 font-medium">Nama</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Departemen</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Dibuat</th>
                    <th className="px-5 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-zinc-900">
                          {user.name}
                          {currentUser?.id === user.id && (
                            <span className="ml-2 text-xs font-normal text-zinc-400">(Anda)</span>
                          )}
                        </p>
                        {user.phone && <p className="text-xs text-zinc-500">{user.phone}</p>}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{user.email}</td>
                      <td className="px-5 py-3">
                        <Badge tone={user.role === 'admin' ? 'purple' : user.role === 'technician' ? 'blue' : 'neutral'}>
                          {roleLabels[user.role]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{user.department || '—'}</td>
                      <td className="px-5 py-3">
                        <Badge tone={user.is_active ? 'green' : 'neutral'}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{formatDateOnly(user.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(user)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => void handleDelete(user)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                total={meta.total}
                onChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Pengguna' : 'Tambah Pengguna'}
        description={editing ? 'Kosongkan password bila tidak ingin mengubahnya.' : undefined}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="user-form" loading={saving}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <Field label="Nama" htmlFor="user-name" required error={fieldErrors.name?.[0]}>
            <Input
              id="user-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              maxLength={100}
              required
            />
          </Field>

          <Field label="Email" htmlFor="user-email" required error={fieldErrors.email?.[0]}>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telepon" htmlFor="user-phone" error={fieldErrors.phone?.[0]}>
              <Input
                id="user-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={30}
                placeholder="08xxxxxxxxxx"
              />
            </Field>

            <Field label="Departemen" htmlFor="user-department" error={fieldErrors.department?.[0]}>
              <Input
                id="user-department"
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
                maxLength={100}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" htmlFor="user-role-field" required error={fieldErrors.role?.[0]}>
              <Select
                id="user-role-field"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label={editing ? 'Password baru (opsional)' : 'Password'}
              htmlFor="user-password"
              required={!editing}
              hint="Minimal 8 karakter, mengandung huruf dan angka."
              error={fieldErrors.password?.[0]}
            >
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required={!editing}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            Akun aktif
          </label>

          {formError && <p className="text-xs text-red-600">{formError}</p>}
        </form>
      </Modal>
    </>
  )
}
