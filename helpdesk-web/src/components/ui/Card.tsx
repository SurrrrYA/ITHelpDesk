import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-xl border border-zinc-200 bg-white', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('border-b border-zinc-200 px-5 py-4', className)}>{children}</div>
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('px-5 py-4', className)}>{children}</div>
}
