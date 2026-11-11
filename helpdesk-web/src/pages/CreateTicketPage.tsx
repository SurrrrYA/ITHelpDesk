import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, apiErrorMessage, apiFieldErrors } from '../lib/api'
import type { Asset, Category, Paginated, Ticket, TicketPriority } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button, Card, CardBody, Field, Input, Select, Textarea } from '../components/ui'

const priorityOptions: { value: TicketPriority; label: string; hint: string }[] = [
  { value: 'low', label: 'Rendah', hint: 'Tidak menghambat pekerjaan' },
  { value: 'medium', label: 'Sedang', hint: 'Mengganggu sebagian pekerjaan' },
  { value: 'high', label: 'Tinggi', hint: 'Menghambat pekerjaan utama' },
  { value: 'urgent', label: 'Urgent', hint: 'Pekerjaan berhenti total' },
]

export function CreateTicketPage() {
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [assetId, setAssetId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    api
      .get<{ data: Category[] }>('/categories')
      .then((response) => {
        if (!active) return
        setCategories(response.data.data)

        if (response.data.data.length > 0) {
          setCategoryId((current) => current || String(response.data.data[0].id))
        }
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, 'Gagal memuat kategori.'))
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    api
      .get<Paginated<Asset>>('/assets', { params: { per_page: 100, status: 'active' } })
      .then((response) => {
        if (active) setAssets(response.data.data)
      })
      .catch(() => {
        if (active) setAssets([])
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setError(null)
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('subject', subject)
      formData.append('description', description)
      formData.append('category_id', categoryId)
      formData.append('priority', priority)
      if (assetId) formData.append('asset_id', assetId)
      files.forEach((file) => formData.append('attachments[]', file))

      const response = await api.post<{ data: Ticket }>('/tickets', formData)
      navigate(`/tickets/${response.data.data.id}`)
    } catch (err) {
      setErrors(apiFieldErrors(err))
      setError(apiErrorMessage(err, 'Gagal membuat tiket.'))
    } finally {
      setSubmitting(false)
    }
  }

  const attachmentError = Object.entries(errors).find(([key]) =>
    key.startsWith('attachments'),
  )?.[1]?.[0]

  return (
    <>
      <PageHeader
        title="Buat Tiket"
        description="Jelaskan masalah atau permintaan bantuan IT Anda sedetail mungkin."
      />

      <Card className="max-w-3xl">
        <CardBody>
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
            <Field label="Judul tiket" htmlFor="subject" required error={errors.subject?.[0]}>
              <Input
                id="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Contoh: Laptop tidak bisa terhubung ke Wi-Fi kantor"
                maxLength={200}
                required
              />
            </Field>

            <Field
              label="Deskripsi"
              htmlFor="description"
              required
              error={errors.description?.[0]}
              hint="Sertakan langkah yang sudah dicoba, pesan error, dan waktu kejadian."
            >
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Jelaskan masalah yang Anda alami..."
                className="min-h-40"
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kategori" htmlFor="category" required error={errors.category_id?.[0]}>
                <Select
                  id="category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Pilih kategori
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Prioritas" htmlFor="priority" required error={errors.priority?.[0]}>
                <Select
                  id="priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as TicketPriority)}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.hint}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Aset terkait"
              htmlFor="asset"
              error={errors.asset_id?.[0]}
              hint="Opsional. Pilih perangkat kantor yang bermasalah agar riwayat tiketnya tercatat."
            >
              <Select
                id="asset"
                value={assetId}
                onChange={(event) => setAssetId(event.target.value)}
              >
                <option value="">Tidak ada aset terkait</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_tag} — {asset.name}
                    {asset.assigned_to ? ` (${asset.assigned_to.name})` : ''}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Lampiran"
              htmlFor="attachments"
              error={attachmentError}
              hint="Maksimal 5 file. Format jpg, jpeg, png, webp, atau pdf. Maksimal 5 MB per file."
            >
              <input
                id="attachments"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700"
              />
            </Field>

            {files.length > 0 && (
              <ul className="space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`}>{file.name}</li>
                ))}
              </ul>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 border-t border-zinc-200 pt-5">
              <Button type="submit" loading={submitting}>
                Kirim Tiket
              </Button>
              <Link
                to="/tickets"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
              >
                Batal
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  )
}
