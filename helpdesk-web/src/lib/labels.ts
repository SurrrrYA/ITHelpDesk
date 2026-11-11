import type { TicketPriority, TicketStatus } from '../types'

export const statusLabels: Record<TicketStatus, string> = {
  new: 'Baru',
  assigned: 'Ditugaskan',
  in_progress: 'Diproses',
  resolved: 'Selesai',
  closed: 'Ditutup',
}

export const priorityLabels: Record<TicketPriority, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  urgent: 'Urgent',
}
