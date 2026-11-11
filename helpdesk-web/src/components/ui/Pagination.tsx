import { Button } from './Button'

export function Pagination({
  currentPage,
  lastPage,
  total,
  onChange,
}: {
  currentPage: number
  lastPage: number
  total: number
  onChange: (page: number) => void
}) {
  if (lastPage <= 1) {
    return <p className="px-5 py-3 text-xs text-zinc-500">Total {total} data</p>
  }

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-zinc-500">
        Halaman {currentPage} dari {lastPage} · Total {total} data
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onChange(currentPage - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= lastPage}
          onClick={() => onChange(currentPage + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  )
}
