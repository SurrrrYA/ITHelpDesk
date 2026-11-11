import { useEffect, useState } from 'react'
import { api, apiErrorMessage } from '../../lib/api'
import type { Ticket } from '../../types'
import { Button, Field, Select, Textarea } from '../ui'

export function StatusActions({
  ticket,
  onChanged,
}: {
  ticket: Ticket
  onChanged: () => Promise<void> | void
}) {
  const transitions = ticket.allowed_transitions
  const [target, setTarget] = useState(transitions[0]?.value ?? '')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTarget(transitions[0]?.value ?? '')
    setNote('')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id, ticket.status])

  if (!ticket.can.change_status || transitions.length === 0) {
    return null
  }

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)

    try {
      await api.post(`/tickets/${ticket.id}/status`, {
        status: target,
        note: note || null,
      })

      setNote('')
      await onChanged()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal mengubah status tiket.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Ubah status" htmlFor="status-target">
        <Select
          id="status-target"
          value={target}
          onChange={(event) => setTarget(event.target.value as Ticket['status'])}
        >
          {transitions.map((transition) => (
            <option key={transition.value} value={transition.value}>
              {transition.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Catatan (opsional)" htmlFor="status-note">
        <Textarea
          id="status-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-20"
          placeholder="Tambahkan catatan perubahan status..."
        />
      </Field>

      <Button
        type="button"
        size="sm"
        loading={submitting}
        onClick={() => void handleSubmit()}
        className="w-full"
      >
        Simpan Status
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
