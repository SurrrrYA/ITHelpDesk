import { Badge } from '../ui'
import type { TicketPriority, TicketStatus } from '../../types'

const statusTones = {
  new: 'blue',
  assigned: 'purple',
  in_progress: 'amber',
  resolved: 'green',
  closed: 'neutral',
} as const

const priorityTones = {
  low: 'neutral',
  medium: 'blue',
  high: 'amber',
  urgent: 'red',
} as const

export function StatusBadge({ status, label }: { status: TicketStatus; label: string }) {
  return <Badge tone={statusTones[status]}>{label}</Badge>
}

export function PriorityBadge({ priority, label }: { priority: TicketPriority; label: string }) {
  return <Badge tone={priorityTones[priority]}>{label}</Badge>
}
