import type { Activity, TicketPriority, TicketStatus } from '../../types'
import { formatDate } from '../../lib/format'
import { priorityLabels, statusLabels } from '../../lib/labels'

function statusChange(properties: Record<string, unknown>): string | null {
  const change = properties.status as { old?: string | null; new?: string | null } | undefined

  if (!change) return null

  const oldLabel = change.old ? statusLabels[change.old as TicketStatus] ?? change.old : '—'
  const newLabel = change.new ? statusLabels[change.new as TicketStatus] ?? change.new : '—'

  return `${oldLabel} → ${newLabel}`
}

function priorityChange(properties: Record<string, unknown>): string | null {
  const change = properties.priority as { old?: string | null; new?: string | null } | undefined

  if (!change) return null

  const oldLabel = change.old ? priorityLabels[change.old as TicketPriority] ?? change.old : '—'
  const newLabel = change.new ? priorityLabels[change.new as TicketPriority] ?? change.new : '—'

  return `${oldLabel} → ${newLabel}`
}

function detail(activity: Activity): string | null {
  const status = statusChange(activity.properties)
  const priority = priorityChange(activity.properties)
  const note = activity.properties.note
  const count = activity.properties.count

  if (activity.action === 'status_changed' && status) return status
  if (activity.action === 'priority_changed' && priority) return priority
  if (typeof note === 'string' && note.length > 0) return `Catatan: ${note}`
  if (typeof count === 'number') return `${count} lampiran`

  return null
}

export function TicketTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-zinc-500">Belum ada riwayat aktivitas.</p>
  }

  return (
    <ol className="space-y-0">
      {activities.map((activity, index) => (
        <li key={activity.id} className="relative flex gap-3 pb-4 last:pb-0">
          {index < activities.length - 1 && (
            <span className="absolute left-[5px] top-4 h-full w-px bg-zinc-200" aria-hidden="true" />
          )}
          <span className="mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-white bg-zinc-300 ring-1 ring-zinc-300" />
          <div className="min-w-0">
            <p className="text-sm text-zinc-800">
              <span className="font-medium">{activity.action_label}</span>
              {activity.user && <span className="text-zinc-500"> oleh {activity.user.name}</span>}
            </p>
            {detail(activity) && <p className="mt-0.5 text-xs text-zinc-500">{detail(activity)}</p>}
            <p className="mt-0.5 text-xs text-zinc-400">{formatDate(activity.created_at)}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
