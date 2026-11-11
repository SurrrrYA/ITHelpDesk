import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, apiErrorMessage, apiFieldErrors } from '../../lib/api'
import type { SlaPolicy, TicketPriority } from '../../types'
import { PageHeader } from '../../components/layout/PageHeader'
import { PriorityBadge } from '../../components/tickets/badges'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingState,
  Modal,
  Select,
} from '../../components/ui'

interface SlaForm {
  name: string
  priority: TicketPriority
  response_minutes: string
  resolution_minutes: string
  is_active: boolean
}

const emptyForm: SlaForm = {
  name: '',
  priority: 'medium',
  response_minutes: '240',
  resolution_minutes: '1440',
  is_active: true,
}

const priorityOptions: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
  { value: 'urgent', label: 'Urgent' },
]

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`

  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const remainder = minutes % 60
  const parts: string[] = []

  if (days > 0) parts.push(`${days} hari`)
  if (hours > 0) parts.push(`${hours} jam`)
  if (remainder > 0) parts.push(`${remainder} menit`)

  return parts.join(' ')
}

export function SlaPoliciesPage() {
  const [items, setItems] = useState<SlaPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SlaPolicy | null>(null)
  const [form, setForm] = useState<SlaForm>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<{ data: SlaPolicy[] }>('/sla-policies')
      setItems(response.data.data)
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat kebijakan SLA.'))
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

  function openEdit(policy: SlaPolicy) {
    setEditing(policy)
    setForm({
      name: policy.name,
      priority: policy.priority,
      response_minutes: String(policy.response_minutes),
      resolution_minutes: String(policy.resolution_minutes),
      is_active: policy.is_active,
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
        priority: form.priority,
        response_minutes: Number(form.response_minutes),
        resolution_minutes: Number(form.resolution_minutes),
        is_active: form.is_active,
      }

      if (editing) {
        await api.put(`/sla-policies/${editing.id}`, payload)
      } else {
        await api.post('/sla-policies', payload)
      }

      setModalOpen(false)
      await load()
    } catch (err) {
      setFieldErrors(apiFieldErrors(err))
      setFormError(apiErrorMessage(err, 'Gagal menyimpan kebijakan SLA.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(policy: SlaPolicy) {
    if (!window.confirm(`Hapus kebijakan SLA "${policy.name}"?`)) return

    setError(null)

    try {
      await api.delete(`/sla-policies/${policy.id}`)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menghapus kebijakan SLA.'))
    }
  }

  return (
    <>
      <PageHeader
        title="Kebijakan SLA"
        description="Atur batas waktu respons dan penyelesaian untuk setiap prioritas."
        actions={<Button onClick={openCreate}>Tambah Kebijakan</Button>}
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
            title="Belum ada kebijakan SLA"
            description="Setiap prioritas sebaiknya memiliki satu kebijakan SLA."
            action={<Button onClick={openCreate}>Tambah Kebijakan</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Prioritas</th>
                  <th className="px-5 py-3 font-medium">Batas Respons</th>
                  <th className="px-5 py-3 font-medium">Batas Penyelesaian</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((policy) => (
                  <tr key={policy.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{policy.name}</td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={policy.priority} label={policy.priority_label} />
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {formatMinutes(policy.response_minutes)}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {formatMinutes(policy.resolution_minutes)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={policy.is_active ? 'green' : 'neutral'}>
                        {policy.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(policy)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void handleDelete(policy)}
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
        title={editing ? 'Edit Kebijakan SLA' : 'Tambah Kebijakan SLA'}
        description="Satu prioritas hanya boleh memiliki satu kebijakan."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="sla-form" loading={saving}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="sla-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <Field label="Nama" htmlFor="sla-name" required error={fieldErrors.name?.[0]}>
            <Input
              id="sla-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              maxLength={100}
              required
            />
          </Field>

          <Field label="Prioritas" htmlFor="sla-priority" required error={fieldErrors.priority?.[0]}>
            <Select
              id="sla-priority"
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value as TicketPriority })
              }
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Batas respons (menit)"
              htmlFor="sla-response"
              required
              error={fieldErrors.response_minutes?.[0]}
            >
              <Input
                id="sla-response"
                type="number"
                min={1}
                value={form.response_minutes}
                onChange={(event) => setForm({ ...form, response_minutes: event.target.value })}
                required
              />
            </Field>

            <Field
              label="Batas penyelesaian (menit)"
              htmlFor="sla-resolution"
              required
              error={fieldErrors.resolution_minutes?.[0]}
            >
              <Input
                id="sla-resolution"
                type="number"
                min={1}
                value={form.resolution_minutes}
                onChange={(event) => setForm({ ...form, resolution_minutes: event.target.value })}
                required
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
            Kebijakan aktif
          </label>

          {formError && <p className="text-xs text-red-600">{formError}</p>}
        </form>
      </Modal>
    </>
  )
}
