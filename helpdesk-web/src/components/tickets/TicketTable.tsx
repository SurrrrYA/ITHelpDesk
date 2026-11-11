import { Link } from 'react-router-dom'
import type { Ticket } from '../../types'
import { formatDate } from '../../lib/format'
import { PriorityBadge, StatusBadge } from './badges'

export function TicketTable({
  tickets,
  showRequester = false,
}: {
  tickets: Ticket[]
  showRequester?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
            <th className="px-5 py-3 font-medium">Tiket</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Prioritas</th>
            {showRequester && <th className="px-5 py-3 font-medium">Pelapor</th>}
            <th className="px-5 py-3 font-medium">Teknisi</th>
            <th className="px-5 py-3 font-medium">Dibuat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="group hover:bg-zinc-50">
              <td className="px-5 py-3">
                <Link to={`/tickets/${ticket.id}`} className="block">
                  <p className="text-xs font-medium text-zinc-500">{ticket.ticket_number}</p>
                  <p className="mt-0.5 font-medium text-zinc-900 group-hover:text-blue-700">
                    {ticket.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{ticket.category?.name ?? 'Tanpa kategori'}</p>
                </Link>
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={ticket.status} label={ticket.status_label} />
              </td>
              <td className="px-5 py-3">
                <PriorityBadge priority={ticket.priority} label={ticket.priority_label} />
              </td>
              {showRequester && (
                <td className="px-5 py-3 text-zinc-600">{ticket.requester?.name ?? '—'}</td>
              )}
              <td className="px-5 py-3 text-zinc-600">{ticket.assignee?.name ?? 'Belum ditugaskan'}</td>
              <td className="whitespace-nowrap px-5 py-3 text-xs text-zinc-500">
                {formatDate(ticket.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
