import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api, apiErrorMessage } from '../lib/api'
import { getEcho } from '../lib/echo'
import { formatDate } from '../lib/format'
import type { Activity, Reply, Ticket } from '../types'
import { AttachmentList } from '../components/tickets/AttachmentList'
import { AssignControl } from '../components/tickets/AssignControl'
import { PriorityBadge, StatusBadge } from '../components/tickets/badges'
import { ReplyForm } from '../components/tickets/ReplyForm'
import { ReplyList } from '../components/tickets/ReplyList'
import { StatusActions } from '../components/tickets/StatusActions'
import { TicketTimeline } from '../components/tickets/TicketTimeline'
import { Badge, Button, Card, CardBody, CardHeader, LoadingState } from '../components/ui'

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-right text-xs font-medium text-zinc-800">{children}</span>
    </div>
  )
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const ticketId = Number(id)

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [taking, setTaking] = useState(false)

  const loadAll = useCallback(async () => {
    if (!Number.isFinite(ticketId)) {
      throw new Error('invalid-id')
    }

    const [ticketResponse, repliesResponse, activitiesResponse] = await Promise.all([
      api.get<{ data: Ticket }>(`/tickets/${ticketId}`),
      api.get<{ data: Reply[] }>(`/tickets/${ticketId}/replies`),
      api.get<{ data: Activity[] }>(`/tickets/${ticketId}/activities`),
    ])

    setTicket(ticketResponse.data.data)
    setReplies(repliesResponse.data.data)
    setActivities(activitiesResponse.data.data)
  }, [ticketId])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    loadAll()
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, 'Tiket tidak ditemukan atau Anda tidak punya akses.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadAll])

  useEffect(() => {
    if (!Number.isFinite(ticketId)) return

    const echo = getEcho()

    if (!echo) return

    const channel = echo.private(`ticket.${ticketId}`)
    const handler = () => {
      void loadAll().catch(() => {})
    }

    channel.listen('.reply.created', handler)
    channel.listen('.status.changed', handler)

    return () => {
      channel.stopListening('.reply.created')
      channel.stopListening('.status.changed')
      echo.leave(`ticket.${ticketId}`)
    }
  }, [ticketId, loadAll])

  async function refresh() {
    await loadAll()
  }

  async function handleTake() {
    setActionError(null)
    setTaking(true)

    try {
      await api.post(`/tickets/${ticketId}/take`)
      await refresh()
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Gagal mengambil tiket.'))
    } finally {
      setTaking(false)
    }
  }

  if (loading) {
    return <LoadingState label="Memuat detail tiket..." />
  }

  if (error || !ticket) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-red-600">{error ?? 'Tiket tidak ditemukan.'}</p>
          <Link
            to="/tickets"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Kembali ke daftar tiket
          </Link>
        </CardBody>
      </Card>
    )
  }

  const hasActions =
    ticket.can.take ||
    ticket.can.assign ||
    (ticket.can.change_status && ticket.allowed_transitions.length > 0)

  return (
    <>
      <Link to="/tickets" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Kembali ke daftar tiket
      </Link>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500">{ticket.ticket_number}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            {ticket.subject}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} label={ticket.status_label} />
            <PriorityBadge priority={ticket.priority} label={ticket.priority_label} />
            {ticket.is_response_overdue && <Badge tone="red">SLA respons terlampaui</Badge>}
            {ticket.is_resolution_overdue && <Badge tone="red">SLA penyelesaian terlampaui</Badge>}
          </div>
        </div>
        <p className="shrink-0 text-xs text-zinc-500">Dibuat {formatDate(ticket.created_at)}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Deskripsi</h2>
            </CardHeader>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {ticket.description}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">
                Lampiran ({ticket.attachments?.length ?? 0})
              </h2>
            </CardHeader>
            <CardBody>
              <AttachmentList attachments={ticket.attachments ?? []} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Balasan ({replies.length})</h2>
            </CardHeader>
            <CardBody className="space-y-5">
              <ReplyList replies={replies} />

              <div className="border-t border-zinc-200 pt-5">
                {ticket.can.reply ? (
                  <ReplyForm
                    ticketId={ticket.id}
                    canInternal={user?.role !== 'employee'}
                    onSubmitted={refresh}
                  />
                ) : (
                  <p className="text-sm text-zinc-500">
                    {ticket.status === 'closed'
                      ? 'Tiket sudah ditutup sehingga tidak bisa dibalas lagi.'
                      : 'Anda tidak dapat membalas tiket ini.'}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Riwayat Aktivitas</h2>
            </CardHeader>
            <CardBody>
              <TicketTimeline activities={activities} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Detail Tiket</h2>
            </CardHeader>
            <CardBody className="divide-y divide-zinc-100 py-1">
              <DetailRow label="Pelapor">{ticket.requester?.name ?? '—'}</DetailRow>
              <DetailRow label="Departemen">{ticket.requester?.department ?? '—'}</DetailRow>
              <DetailRow label="Kategori">{ticket.category?.name ?? '—'}</DetailRow>
              <DetailRow label="Aset">
                {ticket.asset ? (
                  <span>
                    <span className="font-medium text-zinc-900">{ticket.asset.asset_tag}</span>
                    <span className="text-zinc-500"> — {ticket.asset.name}</span>
                  </span>
                ) : (
                  '—'
                )}
              </DetailRow>
              <DetailRow label="Teknisi">{ticket.assignee?.name ?? 'Belum ditugaskan'}</DetailRow>
              <DetailRow label="Batas respons">
                <span className={ticket.is_response_overdue ? 'text-red-600' : undefined}>
                  {formatDate(ticket.sla_response_due_at)}
                </span>
              </DetailRow>
              <DetailRow label="Batas penyelesaian">
                <span className={ticket.is_resolution_overdue ? 'text-red-600' : undefined}>
                  {formatDate(ticket.sla_resolution_due_at)}
                </span>
              </DetailRow>
              <DetailRow label="Respons pertama">{formatDate(ticket.first_response_at)}</DetailRow>
              <DetailRow label="Selesai">{formatDate(ticket.resolved_at)}</DetailRow>
              <DetailRow label="Ditutup">{formatDate(ticket.closed_at)}</DetailRow>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Aksi</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {ticket.can.take && (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  loading={taking}
                  onClick={() => void handleTake()}
                >
                  Ambil Tiket
                </Button>
              )}

              <AssignControl ticket={ticket} onChanged={refresh} />
              <StatusActions ticket={ticket} onChanged={refresh} />

              {!hasActions && (
                <p className="text-sm text-zinc-500">Tidak ada aksi tersedia untuk Anda.</p>
              )}

              {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
