export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '—'

  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value))
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return '—'

  const date = new Date(value)
  const diff = date.getTime() - Date.now()
  const minutes = Math.round(diff / 60_000)

  const formatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })

  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')

  const hours = Math.round(minutes / 60)

  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')

  return formatter.format(Math.round(hours / 24), 'day')
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
