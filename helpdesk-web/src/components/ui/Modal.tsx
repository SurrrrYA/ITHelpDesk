import type { ReactNode } from 'react'

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'lg',
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
}) {
  if (!open) return null

  const sizes = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-3xl',
  } as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup dialog"
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-[90vh] w-full flex-col rounded-xl border border-zinc-200 bg-white shadow-lg ${sizes[size]}`}
      >
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
        </div>

        <div className="overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
