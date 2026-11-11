import type { Reply } from '../../types'
import { formatDate, initials } from '../../lib/format'
import { Badge } from '../ui'
import { AttachmentList } from './AttachmentList'

export function ReplyList({ replies }: { replies: Reply[] }) {
  if (replies.length === 0) {
    return <p className="text-sm text-zinc-500">Belum ada balasan.</p>
  }

  return (
    <ul className="space-y-4">
      {replies.map((reply) => (
        <li
          key={reply.id}
          className={
            reply.is_internal
              ? 'rounded-lg border border-amber-200 bg-amber-50/50 p-4'
              : 'rounded-lg border border-zinc-200 p-4'
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">
              {initials(reply.user?.name ?? '?')}
            </span>
            <span className="text-sm font-medium text-zinc-900">
              {reply.user?.name ?? 'Pengguna'}
            </span>
            <span className="text-xs text-zinc-500">{reply.user?.role_label}</span>
            {reply.is_internal && <Badge tone="amber">Catatan internal</Badge>}
            <span className="ml-auto text-xs text-zinc-500">{formatDate(reply.created_at)}</span>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {reply.body}
          </p>

          {reply.attachments.length > 0 && (
            <div className="mt-3">
              <AttachmentList attachments={reply.attachments} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
