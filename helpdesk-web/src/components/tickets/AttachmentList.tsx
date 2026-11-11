import { useState } from 'react'
import type { Attachment } from '../../types'
import { downloadFile, apiErrorMessage } from '../../lib/api'
import { formatFileSize } from '../../lib/format'

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  const [downloading, setDownloading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (attachments.length === 0) {
    return <p className="text-sm text-zinc-500">Tidak ada lampiran.</p>
  }

  async function handleDownload(attachment: Attachment) {
    setDownloading(attachment.id)
    setError(null)

    try {
      await downloadFile(attachment.url, attachment.file_name)
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal mengunduh lampiran.'))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <button
          key={attachment.id}
          type="button"
          onClick={() => void handleDownload(attachment)}
          disabled={downloading === attachment.id}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50 disabled:opacity-60"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-zinc-800">
              {attachment.file_name}
            </span>
            <span className="block text-xs text-zinc-500">{formatFileSize(attachment.file_size)}</span>
          </span>
          <span className="shrink-0 text-xs font-medium text-blue-600">
            {downloading === attachment.id ? 'Mengunduh...' : 'Unduh'}
          </span>
        </button>
      ))}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
