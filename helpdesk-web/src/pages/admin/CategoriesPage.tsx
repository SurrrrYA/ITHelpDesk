import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, apiErrorMessage, apiFieldErrors } from '../../lib/api'
import type { Category } from '../../types'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingState,
  Modal,
  Textarea,
} from '../../components/ui'

interface CategoryForm {
  name: string
  description: string
  is_active: boolean
}

const emptyForm: CategoryForm = { name: '', description: '', is_active: true }

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<{ data: Category[] }>('/categories')
      setItems(response.data.data)
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat kategori.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setForm({
      name: category.name,
      description: category.description ?? '',
      is_active: category.is_active,
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
        description: form.description || null,
        is_active: form.is_active,
      }

      if (editing) {
        await api.put(`/categories/${editing.id}`, payload)
      } else {
        await api.post('/categories', payload)
      }

      setModalOpen(false)
      await load()
    } catch (err) {
      setFieldErrors(apiFieldErrors(err))
      setFormError(apiErrorMessage(err, 'Gagal menyimpan kategori.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`Hapus kategori "${category.name}"?`)) return

    setError(null)

    try {
      await api.delete(`/categories/${category.id}`)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menghapus kategori.'))
    }
  }

  return (
    <>
      <PageHeader
        title="Kategori"
        description="Kelola kategori tiket yang dapat dipilih karyawan."
        actions={<Button onClick={openCreate}>Tambah Kategori</Button>}
      />

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
            title="Belum ada kategori"
            description="Tambahkan kategori agar karyawan dapat mengelompokkan tiket."
            action={<Button onClick={openCreate}>Tambah Kategori</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Deskripsi</th>
                  <th className="px-5 py-3 font-medium">Tiket</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((category) => (
                  <tr key={category.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{category.name}</td>
                    <td className="max-w-md px-5 py-3 text-zinc-600">
                      {category.description || '—'}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{category.tickets_count ?? 0}</td>
                    <td className="px-5 py-3">
                      <Badge tone={category.is_active ? 'green' : 'neutral'}>
                        {category.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(category)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void handleDelete(category)}
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
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Kategori' : 'Tambah Kategori'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="category-form" loading={saving}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <Field label="Nama" htmlFor="category-name" required error={fieldErrors.name?.[0]}>
            <Input
              id="category-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              maxLength={100}
              required
            />
          </Field>

          <Field label="Deskripsi" htmlFor="category-description" error={fieldErrors.description?.[0]}>
            <Textarea
              id="category-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="min-h-24"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            Kategori aktif
          </label>

          {formError && <p className="text-xs text-red-600">{formError}</p>}
        </form>
      </Modal>
    </>
  )
}
