import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api, apiErrorMessage, apiFieldErrors } from '../lib/api'
import { formatDateOnly } from '../lib/format'
import type { Article, Paginated, PaginationMeta } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
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
} from '../components/ui'

interface ArticleForm {
  title: string
  excerpt: string
  body: string
  is_published: boolean
}

const emptyForm: ArticleForm = {
  title: '',
  excerpt: '',
  body: '',
  is_published: true,
}

export function ArticlesPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'technician' || user?.role === 'admin'

  const [articles, setArticles] = useState<Article[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailArticle, setDetailArticle] = useState<Article | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params: Record<string, string | number> = { per_page: 10, page }

    if (appliedSearch) params.q = appliedSearch
    if (canManage && statusFilter) params.status = statusFilter

    try {
      const response = await api.get<Paginated<Article>>('/articles', { params })
      setArticles(response.data.data)
      setMeta(response.data.meta)
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat artikel.'))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, statusFilter, page, canManage])

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
    setStatusFilter('')
    setPage(1)
  }

  async function openDetail(article: Article) {
    setDetailOpen(true)
    setDetailArticle(article)

    try {
      const response = await api.get<{ data: Article }>(`/articles/${article.id}`)
      setDetailArticle(response.data.data)
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memuat detail artikel.'))
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(article: Article) {
    setDetailOpen(false)
    setEditing(article)
    setForm({
      title: article.title,
      excerpt: article.excerpt ?? '',
      body: article.body,
      is_published: article.is_published,
    })
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFieldErrors({})
    setFormError(null)

    const payload = {
      title: form.title,
      excerpt: form.excerpt || null,
      body: form.body,
      is_published: form.is_published,
    }

    try {
      if (editing) {
        await api.put(`/articles/${editing.id}`, payload)
      } else {
        await api.post('/articles', payload)
      }

      setFormOpen(false)
      await load()
    } catch (err) {
      setFieldErrors(apiFieldErrors(err))
      setFormError(apiErrorMessage(err, 'Gagal menyimpan artikel.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(article: Article) {
    if (!window.confirm(`Hapus artikel "${article.title}"?`)) return

    setError(null)

    try {
      await api.delete(`/articles/${article.id}`)

      if (detailArticle?.id === article.id) {
        setDetailOpen(false)
        setDetailArticle(null)
      }

      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menghapus artikel.'))
    }
  }

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description="Artikel panduan dan solusi masalah IT yang sering terjadi."
        actions={canManage ? <Button onClick={openCreate}>Tulis Artikel</Button> : undefined}
      />

      <Card className="mb-4">
        <CardBody>
          <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Cari artikel" htmlFor="article-search">
              <Input
                id="article-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Contoh: printer, password, phishing"
              />
            </Field>

            {canManage && (
              <Field label="Status" htmlFor="article-status-filter">
                <Select
                  id="article-status-filter"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">Semua status</option>
                  <option value="published">Terbit</option>
                  <option value="draft">Draf</option>
                </Select>
              </Field>
            )}

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
          <LoadingState label="Memuat artikel..." />
        ) : articles.length === 0 ? (
          <EmptyState
            title="Tidak ada artikel"
            description={
              appliedSearch
                ? 'Coba kata kunci lain atau reset filter pencarian.'
                : 'Belum ada artikel yang cocok dengan filter saat ini.'
            }
            action={canManage ? <Button onClick={openCreate}>Tulis Artikel</Button> : undefined}
          />
        ) : (
          <>
            <div className="divide-y divide-zinc-100">
              {articles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => void openDetail(article)}
                  className="flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{article.title}</p>
                      {article.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{article.excerpt}</p>
                      )}
                      <p className="mt-2 text-xs text-zinc-400">
                        {article.author?.name ?? 'Tim IT'} ·{' '}
                        {formatDateOnly(article.published_at ?? article.created_at)} ·{' '}
                        {article.views} dilihat
                      </p>
                    </div>
                    {!article.is_published && <Badge tone="amber">Draf</Badge>}
                  </div>
                </button>
              ))}
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
        open={detailOpen}
        title={detailArticle?.title ?? 'Detail Artikel'}
        description={
          detailArticle
            ? `${detailArticle.author?.name ?? 'Tim IT'} · ${
                detailArticle.published_at
                  ? formatDateOnly(detailArticle.published_at)
                  : 'Belum diterbitkan'
              } · ${detailArticle.views} dilihat`
            : undefined
        }
        onClose={() => setDetailOpen(false)}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailOpen(false)}>
              Tutup
            </Button>
            {detailArticle?.can.update && (
              <Button onClick={() => openEdit(detailArticle)}>Edit</Button>
            )}
            {detailArticle?.can.delete && (
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => void handleDelete(detailArticle)}
              >
                Hapus
              </Button>
            )}
          </>
        }
      >
        {detailArticle && (
          <div className="space-y-4">
            {!detailArticle.is_published && <Badge tone="amber">Draf — hanya terlihat oleh tim IT</Badge>}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {detailArticle.body}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={formOpen}
        title={editing ? 'Edit Artikel' : 'Tulis Artikel'}
        description="Artikel akan tampil di knowledge base sesuai status terbitnya."
        onClose={() => setFormOpen(false)}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="article-form" loading={saving}>
              Simpan
            </Button>
          </>
        }
      >
        <form id="article-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <Field label="Judul" htmlFor="article-title" required error={fieldErrors.title?.[0]}>
            <Input
              id="article-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              maxLength={200}
              placeholder="Contoh: Cara reset password akun kantor"
              required
            />
          </Field>

          <Field
            label="Ringkasan"
            htmlFor="article-excerpt"
            error={fieldErrors.excerpt?.[0]}
            hint="Tampil di daftar artikel. Maksimal 1000 karakter."
          >
            <Textarea
              id="article-excerpt"
              value={form.excerpt}
              onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
              className="min-h-20"
              maxLength={1000}
            />
          </Field>

          <Field
            label="Isi artikel"
            htmlFor="article-body"
            required
            error={fieldErrors.body?.[0]}
            hint="Gunakan baris baru dan daftar bernomor agar langkah mudah diikuti."
          >
            <Textarea
              id="article-body"
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              className="min-h-64"
              required
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
              className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            Terbitkan artikel
          </label>

          {formError && <p className="text-xs text-red-600">{formError}</p>}
        </form>
      </Modal>
    </>
  )
}
