import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, apiErrorMessage } from '../../lib/api'
import { Button, Field, Textarea } from '../ui'

export function ReplyForm({
  ticketId,
  canInternal,
  onSubmitted,
}: {
  ticketId: number
  canInternal: boolean
  onSubmitted: () => Promise<void> | void
}) {
  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('body', body)

      if (isInternal) {
        formData.append('is_internal', '1')
      }

      files.forEach((file) => formData.append('attachments[]', file))

      await api.post(`/tickets/${ticketId}/replies`, formData)

      setBody('')
      setIsInternal(false)
      setFiles([])
      await onSubmitted()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal mengirim balasan.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      <Field label={isInternal ? 'Catatan internal' : 'Balasan'} htmlFor="reply-body">
        <Textarea
          id="reply-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={
            isInternal
              ? 'Tulis catatan yang hanya terlihat oleh tim IT...'
              : 'Tulis balasan untuk tiket ini...'
          }
          required
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        {canInternal && (
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(event) => setIsInternal(event.target.checked)}
              className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            Catatan internal (tidak terlihat karyawan)
          </label>
        )}

        <label className="text-sm text-zinc-600">
          <span className="mr-2">Lampiran</span>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="text-xs text-zinc-500 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-zinc-700"
          />
        </label>

        <Button type="submit" size="sm" loading={submitting} className="ml-auto">
          Kirim
        </Button>
      </div>

      {files.length > 0 && (
        <p className="text-xs text-zinc-500">
          {files.length} file dipilih: {files.map((file) => file.name).join(', ')}
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
