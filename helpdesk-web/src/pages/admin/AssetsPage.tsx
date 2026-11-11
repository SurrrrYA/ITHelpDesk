import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, apiErrorMessage, apiFieldErrors } from '../../lib/api'
import { formatDateOnly } from '../../lib/format'
import type { Asset, AssetStatus, Paginated, PaginationMeta, User } from '../../types'
import { StatusBadge } from '../../components/tickets/badges'
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
  Textarea,
} from '../../components/ui'

const statusOptions: { value: AssetStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'maintenance', label: 'Perbaikan' },
  { value: 'retired', label: 'Tidak Dipakai' },
]

const statusLabels: Record<AssetStatus, string> = {
  active: 'Aktif',
  maintenance: 'Perbaikan',
  retired: 'Tidak Dipakai',
}

const statusTones = {
  active: 'green',
  maintenance: 'amber',
  retired: 'neutral',
} as const

interface AssetForm {
  asset_tag: string
  name: string
  category: string
  brand: string
  model: string
  serial_number: string
  purchased_at: string
  assigned_to: string
  status: AssetStatus
  notes: string
}

const emptyForm: AssetForm = {
  asset_tag: '',
  name: '',
  category: '',
  brand: '',
  model: '',
  serial_number: '',
  purchased_at: '',
  assigned_to: '',
  status: 'active',
  notes: '',
}

export function AssetsPage() {
  const [items, setItems] = useState<Asset[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [form, setForm] = useState<AssetForm>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyAsset, setHistoryAsset] = useState<Asset | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params: Record<string, string | number> = { per_page: 10, page }

    if (appliedSearch) params.q = appliedSearch
    if (statusFilter) params.status = statusFilter

    try {
      const response = await api.get<Paginated<Asset>>('/assets', { params })
      setItems(response.data.data)
      setMeta(response.data.meta)
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat daftar aset.'))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, statusFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let active = true

    api
      .get<Paginated<User>>('/users', { params: { per_page: 100 } })
      .then((response) => {
        if (active) setUsers(response.data.data)
      })
      .catch(() => {
        if (active) setUsers([])
      })

    return () => {
      active = false
    }
  }, [])

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(search.trim())
  }

  function handleReset() {
    setSearch('')
    setAppliedSearch('')
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

  function openEdit(asset: Asset) {
    setEditing(asset)
    setForm({
      asset_tag: asset.asset_tag,
      name: asset.name,
      category: asset.category ?? '',
      brand: asset.brand ?? '',
      model: asset.model ?? '',
      serial_number: asset.serial_number ?? '',
      purchased_at: asset.purchased_at ?? '',
      assigned_to: asset.assigned_to ? String(asset.assigned_to.id) : '',
      status: asset.status,
      notes: asset.notes ?? '',
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
        asset_tag: form.asset_tag,
        name: form.name,
        category: form.category || null,
        brand: form.brand || null,
        model: form.model || null,
        serial_number: form.serial_number || null,
        purchased_at: form.purchased_at || null,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
        status: form.status,
        notes: form.notes || null,
      }

      if (editing) {
        await api.put(`/assets/${editing.id}`, payload)
      } else {
        await api.post('/assets', payload)
      }

      setModalOpen(false)
      await load()
    } catch (err) {
      setFieldErrors(apiFieldErrors(err))
      setFormError(apiErrorMessage(err, 'Gagal menyimpan aset.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(asset: Asset) {
    if (!window.confirm(`Hapus aset "${asset.asset_tag} — ${asset.name}"?`)) return

    setError(null)

    try {
      await api.delete(`/assets/${asset.id}`)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menghapus aset.'))
    }
  }

  async function openHistory(asset: Asset) {
    setHistoryOpen(true)
    setHistoryAsset(null)
    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const response = await api.get<{ data: Asset }>(`/assets/${asset.id}`)
      setHistoryAsset(response.data.data)
    } catch (err) {
      setHistoryError(apiErrorMessage(err, 'Gagal memuat riwayat tiket aset.'))
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Aset"
        description="Kelola inventaris perangkat IT dan penanggung jawabnya."
        actions={<Button onClick={openCreate}>Tambah Aset</Button>}
      />

      <Card className="mb-4">
        <CardBody>
          <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Cari" htmlFor="asset-search">
              <Input
                id="asset-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Kode, nama, atau serial number"
              />
            </Field>

            <Field label="Status" htmlFor="asset-status-filter">
              <Select
                id="asset-status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Semua status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex items-end gap-2 xl:col-span-2">
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
            title="Tidak ada aset"
            description="Belum ada aset yang cocok dengan filter saat ini."
            action={<Button onClick={openCreate}>Tambah Aset</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-5 py-3 font-medium">Kode</th>
                    <th className="px-5 py-3 font-medium">Nama</th>
                    <th className="px-5 py-3 font-medium">Kategori</th>
                    <th className="px-5 py-3 font-medium">Penanggung Jawab</th>
                    <th className="px-5 py-3 font-medium">Tiket</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((asset) => (
                    <tr key={asset.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900">{asset.asset_tag}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-zinc-900">{asset.name}</p>
                        <p className="text-xs text-zinc-500">
                          {[asset.brand, asset.model].filter(Boolean).join(' ') || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{asset.category || '—'}</td>
                      <td className="px-5 py-3 text-zinc-600">
                        {asset.assigned_to?.name ?? 'Belum ditetapkan'}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{asset.tickets_count ?? 0}</td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTones[asset.status]}>{statusLabels[asset.status]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => void openHistory(asset)}>
                            Riwayat
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => openEdit(asset)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => void handleDelete(asset)}
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
        title={editing ? 'Edit Aset' : 'Tambah Aset'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="asset-form" loading={saving}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="asset-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Kode aset"
              htmlFor="asset-tag"
              required
              error={fieldErrors.asset_tag?.[0]}
            >
              <Input
                id="asset-tag"
                value={form.asset_tag}
                onChange={(event) => setForm({ ...form, asset_tag: event.target.value })}
                maxLength={50}
                placeholder="AST-0001"
                required
              />
            </Field>

            <Field label="Nama" htmlFor="asset-name" required error={fieldErrors.name?.[0]}>
              <Input
                id="asset-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={150}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori" htmlFor="asset-category" error={fieldErrors.category?.[0]}>
              <Input
                id="asset-category"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                maxLength={100}
                placeholder="Komputer, Printer, Jaringan"
              />
            </Field>

            <Field label="Serial number" htmlFor="asset-serial" error={fieldErrors.serial_number?.[0]}>
              <Input
                id="asset-serial"
                value={form.serial_number}
                onChange={(event) => setForm({ ...form, serial_number: event.target.value })}
                maxLength={100}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Merek" htmlFor="asset-brand" error={fieldErrors.brand?.[0]}>
              <Input
                id="asset-brand"
                value={form.brand}
                onChange={(event) => setForm({ ...form, brand: event.target.value })}
                maxLength={100}
              />
            </Field>

            <Field label="Model" htmlFor="asset-model" error={fieldErrors.model?.[0]}>
              <Input
                id="asset-model"
                value={form.model}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
                maxLength={100}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal pembelian" htmlFor="asset-purchased" error={fieldErrors.purchased_at?.[0]}>
              <Input
                id="asset-purchased"
                type="date"
                value={form.purchased_at}
                onChange={(event) => setForm({ ...form, purchased_at: event.target.value })}
              />
            </Field>

            <Field label="Status" htmlFor="asset-status" required error={fieldErrors.status?.[0]}>
              <Select
                id="asset-status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as AssetStatus })}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Penanggung jawab"
            htmlFor="asset-assignee"
            error={fieldErrors.assigned_to?.[0]}
          >
            <Select
              id="asset-assignee"
              value={form.assigned_to}
              onChange={(event) => setForm({ ...form, assigned_to: event.target.value })}
            >
              <option value="">Belum ditetapkan</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.role_label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Catatan" htmlFor="asset-notes" error={fieldErrors.notes?.[0]}>
            <Textarea
              id="asset-notes"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              className="min-h-20"
            />
          </Field>

          {editing?.created_at && (
            <p className="text-xs text-zinc-400">Dibuat {formatDateOnly(editing.created_at)}</p>
          )}

          {formError && <p className="text-xs text-red-600">{formError}</p>}
        </form>
      </Modal>

      <Modal
        open={historyOpen}
        title={historyAsset ? `Riwayat Tiket — ${historyAsset.asset_tag}` : 'Riwayat Tiket Aset'}
        description={historyAsset?.name}
        onClose={() => setHistoryOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setHistoryOpen(false)}>
            Tutup
          </Button>
        }
      >
        {historyLoading ? (
          <LoadingState label="Memuat riwayat tiket..." />
        ) : historyError ? (
          <p className="text-sm text-red-600">{historyError}</p>
        ) : (historyAsset?.tickets?.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            Belum ada tiket yang terkait dengan aset ini.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {historyAsset?.tickets?.map((ticket) => (
              <li key={ticket.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">{ticket.ticket_number}</p>
                    <p className="truncate text-sm font-medium text-zinc-900">{ticket.subject}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {ticket.requester ?? '—'} · {formatDateOnly(ticket.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={ticket.status} label={ticket.status_label} />
                    <span className="text-xs text-zinc-500">{ticket.priority_label}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  )
}
