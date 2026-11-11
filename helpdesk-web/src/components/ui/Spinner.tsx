import { cx } from '../../lib/cx'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600',
        className,
      )}
    />
  )
}

export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-zinc-500">
      <Spinner />
      {label}
    </div>
  )
}
