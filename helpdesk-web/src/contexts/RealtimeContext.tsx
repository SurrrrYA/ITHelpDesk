import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getEcho } from '../lib/echo'

type NoticeKind = 'created' | 'reply' | 'status'

interface RealtimeNotice {
  id: string
  kind: NoticeKind
  message: string
  ticketId: number
  ticketNumber: string
  createdAt: string
}

interface RealtimeContextValue {
  version: number
  notices: RealtimeNotice[]
  dismiss: (id: string) => void
}

interface RealtimePayload {
  message?: string
  ticket_id?: number
  ticket_number?: string
  created_at?: string
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined)

const noticeTones: Record<NoticeKind, string> = {
  created: 'border-blue-200 bg-blue-50',
  reply: 'border-emerald-200 bg-emerald-50',
  status: 'border-amber-200 bg-amber-50',
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const [notices, setNotices] = useState<RealtimeNotice[]>([])
  const seen = useRef<Set<string>>(new Set())

  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id))
  }, [])

  useEffect(() => {
    if (!user) {
      setNotices([])
      seen.current.clear()
      return
    }

    const echo = getEcho()

    if (!echo) return

    const push = (kind: NoticeKind, payload: RealtimePayload) => {
      if (!payload.ticket_id) return

      const key = `${kind}:${payload.ticket_id}:${payload.created_at ?? ''}`

      if (seen.current.has(key)) return

      seen.current.add(key)
      setVersion((current) => current + 1)

      const id = `${key}:${Date.now()}`
      const notice: RealtimeNotice = {
        id,
        kind,
        message: payload.message ?? 'Ada pembaruan tiket.',
        ticketId: payload.ticket_id,
        ticketNumber: payload.ticket_number ?? '',
        createdAt: payload.created_at ?? new Date().toISOString(),
      }

      setNotices((current) => [notice, ...current].slice(0, 4))

      window.setTimeout(() => {
        setNotices((current) => current.filter((item) => item.id !== id))
      }, 8000)
    }

    const userChannel = echo.private(`user.${user.id}`)
    userChannel.listen('.ticket.created', (payload: RealtimePayload) => push('created', payload))
    userChannel.listen('.reply.created', (payload: RealtimePayload) => push('reply', payload))
    userChannel.listen('.status.changed', (payload: RealtimePayload) => push('status', payload))

    const queueChannel =
      user.role === 'employee' ? null : echo.private('queue')

    queueChannel?.listen('.ticket.created', (payload: RealtimePayload) => push('created', payload))

    return () => {
      userChannel.stopListening('.ticket.created')
      userChannel.stopListening('.reply.created')
      userChannel.stopListening('.status.changed')
      echo.leave(`user.${user.id}`)

      if (queueChannel) {
        queueChannel.stopListening('.ticket.created')
        echo.leave('queue')
      }
    }
  }, [user])

  const value = useMemo(
    () => ({ version, notices, dismiss }),
    [version, notices, dismiss],
  )

  return (
    <RealtimeContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-80">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`pointer-events-auto w-full rounded-xl border p-3 shadow-sm ${noticeTones[notice.kind]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-900">{notice.message}</p>
                {notice.ticketNumber && (
                  <p className="mt-0.5 text-xs text-zinc-500">{notice.ticketNumber}</p>
                )}
                <Link
                  to={`/tickets/${notice.ticketId}`}
                  onClick={() => dismiss(notice.id)}
                  className="mt-1 inline-block text-xs font-medium text-blue-700 hover:text-blue-800"
                >
                  Lihat tiket
                </Link>
              </div>
              <button
                type="button"
                onClick={() => dismiss(notice.id)}
                className="shrink-0 text-xs text-zinc-400 hover:text-zinc-700"
                aria-label="Tutup notifikasi"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </RealtimeContext.Provider>
  )
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext)

  if (!context) {
    throw new Error('useRealtime harus dipakai di dalam RealtimeProvider.')
  }

  return context
}
