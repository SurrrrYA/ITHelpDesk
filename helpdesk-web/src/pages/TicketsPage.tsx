import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import { api, apiErrorMessage } from '../lib/api'
import type { Category, Paginated, PaginationMeta, Ticket } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { TicketTable } from '../components/tickets/TicketTable'
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  LinkButton,
  LoadingState,
  Pagination,
  Select,
} from '../components/ui'

const statusOptions = [
  { value: 'new', label: 'Baru' },
  { value: 'assigned', label: 'Ditugaskan' },
  { value: 'in_progress', label: 'Diproses' },
  { value: 'resolved', label: 'Selesai' },
  { value: 'closed', label: 'Ditutup' },
]

const priorityOptions = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
  { value: 'urgent', label: 'Urgent' },
]

export function TicketsPage() {
  const { user } = useAuth()
  const { version } = useRealtime()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedOnce = useRef(false)

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [scope, setScope] = useState('')
  const [page, setPage] = useState(1)

  const isEmployee = user?.role === 'employee'

  useEffect(() => {
    let active = true

    api
      .get<{ data: Category[] }>('/categories')
      .then((response) => {
        if (active) setCategories(response.data.data)
      })
      .catch(() => {
        if (active) setCategories([])
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!loadedOnce.current) setLoading(true)
    setError(null)

    const params: Record<string, string | number> = { per_page: 10, page }

    if (appliedSearch) params.q = appliedSearch
    if (status) params.status = status
    if (priority) params.priority = priority
    if (categoryId) params.category_id = Number(categoryId)
    if (scope === 'queue') params.unassigned = 1
    if (scope === 'mine') params.assigned_to_me = 1

    api
      .get<Paginated<Ticket>>('/tickets', { params })
      .then((response) => {
        if (!active) return
        setTickets(response.data.data)
        setMeta(response.data.meta)
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, 'Gagal memuat daftar tiket.'))
      })
      .finally(() => {
        if (active) {
          loadedOnce.current = true
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [appliedSearch, status, priority, categoryId, scope, page, version])

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(search.trim())
  }

  function handleReset() {
    setSearch('')
    setAppliedSearch('')
    setStatus('')
    setPriority('')
    setCategoryId('')
    setScope('')
    setPage(1)
  }

  const title = isEmployee ? 'Tiket Saya' : user?.role === 'technician' ? 'Tiket' : 'Semua Tiket'
  const description = isEmployee
    ? 'Daftar tiket bantuan IT yang Anda buat.'
    : 'Antrean dan tiket yang ditangani tim IT.'

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={<LinkButton to="/tickets/new">Buat Tiket</LinkButton>}
      />

      <Card className="mb-4">
        <CardBody>
          <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="md:col-span-2">
              <Field label="Cari" htmlFor="ticket-search">
                <Input
                  id="ticket-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Judul atau nomor tiket"
                />
              </Field>
            </div>

            <Field label="Status" htmlFor="filter-status">
              <Select
                id="filter-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value)
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

            <Field label="Prioritas" htmlFor="filter-priority">
              <Select
                id="filter-priority"
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Semua prioritas</option>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Kategori" htmlFor="filter-category">
              <Select
                id="filter-category"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Semua kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            {!isEmployee && (
              <Field label="Tampilkan" htmlFor="filter-scope">
                <Select
                  id="filter-scope"
                  value={scope}
                  onChange={(event) => {
                    setScope(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">Semua tiket</option>
                  <option value="queue">Antrean</option>
                  <option value="mine">Ditugaskan ke saya</option>
                </Select>
              </Field>
            )}

            <div className="flex items-end gap-2 md:col-span-2 xl:col-span-6">
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

      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <CardBody>
            <p className="text-sm text-red-600">{error}</p>
          </CardBody>
        ) : tickets.length === 0 ? (
          <EmptyState
            title="Tidak ada tiket"
            description="Belum ada tiket yang cocok dengan filter saat ini."
            action={<LinkButton to="/tickets/new">Buat Tiket</LinkButton>}
          />
        ) : (
          <>
            <TicketTable tickets={tickets} showRequester={!isEmployee} />
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
    </>
  )
}
