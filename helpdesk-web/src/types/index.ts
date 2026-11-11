export type Role = 'employee' | 'technician' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  department: string | null
  role: Role
  role_label: string
  is_active: boolean
  created_at: string | null
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
  tickets_count?: number
}

export interface SlaPolicy {
  id: number
  name: string
  priority: TicketPriority
  priority_label: string
  response_minutes: number
  resolution_minutes: number
  is_active: boolean
  created_at: string | null
}

export type AssetStatus = 'active' | 'maintenance' | 'retired'

export interface Asset {
  id: number
  asset_tag: string
  name: string
  category: string | null
  brand: string | null
  model: string | null
  serial_number: string | null
  purchased_at: string | null
  status: AssetStatus
  notes: string | null
  assigned_to: User | null
  tickets_count?: number
  tickets?: AssetTicket[]
  created_at: string | null
}

export interface AssetTicket {
  id: number
  ticket_number: string
  subject: string
  status: TicketStatus
  status_label: string
  priority: TicketPriority
  priority_label: string
  requester: string | null
  created_at: string | null
  resolved_at: string | null
}

export interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  body: string
  is_published: boolean
  published_at: string | null
  views: number
  author: User | null
  can: {
    update: boolean
    delete: boolean
  }
  created_at: string | null
  updated_at: string | null
}

export interface Attachment {
  id: number
  file_name: string
  mime_type: string
  file_size: number
  url: string
  created_at: string | null
}

export type TicketStatus = 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: number
  ticket_number: string
  subject: string
  description: string
  status: TicketStatus
  status_label: string
  priority: TicketPriority
  priority_label: string
  category: Category | null
  requester: User | null
  assignee: User | null
  asset: Asset | null
  sla_response_due_at: string | null
  sla_resolution_due_at: string | null
  first_response_at: string | null
  resolved_at: string | null
  closed_at: string | null
  is_response_overdue: boolean
  is_resolution_overdue: boolean
  replies_count: number
  attachments_count: number
  attachments?: Attachment[]
  allowed_transitions: { value: TicketStatus; label: string }[]
  can: {
    update: boolean
    assign: boolean
    take: boolean
    change_status: boolean
    reply: boolean
    add_attachment: boolean
  }
  created_at: string | null
  updated_at: string | null
}

export interface Reply {
  id: number
  body: string
  is_internal: boolean
  user: User | null
  attachments: Attachment[]
  created_at: string | null
}

export interface Activity {
  id: number
  action: string
  action_label: string
  properties: Record<string, unknown>
  user: User | null
  created_at: string | null
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
  links: Record<string, string | null>
}

export interface DashboardSummary {
  scope: Role
  cards: {
    total: number
    open: number
    resolved: number
    closed: number
    unassigned: number
    overdue: number
  }
  by_status: { value: TicketStatus; label: string; count: number }[]
  by_priority: { value: TicketPriority; label: string; count: number }[]
  by_category: { id: number; name: string; count: number }[]
  workload: { id: number; name: string; active: number; resolved_30d: number }[]
  trend: { date: string; count: number }[]
  sla: {
    response_overdue: number
    resolution_overdue: number
    avg_response_minutes: number | null
    avg_resolution_minutes: number | null
  }
  attention: {
    id: number
    ticket_number: string
    subject: string
    status: TicketStatus
    status_label: string
    priority: TicketPriority
    priority_label: string
    sla_resolution_due_at: string | null
    is_resolution_overdue: boolean
  }[]
}
