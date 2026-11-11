import { useEffect, useState } from 'react'
import { api, apiErrorMessage } from '../../lib/api'
import type { Paginated, Ticket, User } from '../../types'
import { Button, Field, Select } from '../ui'

export function AssignControl({
  ticket,
  onChanged,
}: {
  ticket: Ticket
  onChanged: () => Promise<void> | void
}) {
  const [users, setUsers] = useState<User[]>([])
  const [assignee, setAssignee] = useState(String(ticket.assignee?.id ?? ''))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    api
      .get<Paginated<User>>('/users', { params: { role: 'technician', per_page: 100 } })
      .then((response) => {
        if (active) setUsers(response.data.data)
      })
      .catch(() => {
        if (active) setError('Gagal memuat daftar teknisi.')
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setAssignee(String(ticket.assignee?.id ?? ''))
  }, [ticket.assignee?.id])

  if (!ticket.can.assign) {
    return null
  }

  async function handleSubmit() {
    if (!assignee) {
      setError('Pilih teknisi terlebih dahulu.')
      return
    }

    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      await api.post(`/tickets/${ticket.id}/assign`, {
        assignee_id: Number(assignee),
      })
      setSuccess('Tiket berhasil ditugaskan.')
      await onChanged()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menugaskan tiket.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Tugaskan ke teknisi" htmlFor="assignee">
        <Select id="assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
          <option value="">Pilih teknisi</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </Field>

      <Button
        type="button"
        size="sm"
        loading={submitting}
        onClick={() => void handleSubmit()}
        className="w-full"
      >
        Tugaskan
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-emerald-600">{success}</p>}
    </div>
  )
}
