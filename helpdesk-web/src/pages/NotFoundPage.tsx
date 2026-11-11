import { Link } from 'react-router-dom'
import { Card, CardBody } from '../components/ui'

export function NotFoundPage() {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm font-semibold text-blue-600">404</p>
          <p className="text-lg font-semibold text-zinc-900">Halaman tidak ditemukan</p>
          <p className="max-w-sm text-sm text-zinc-500">
            Halaman yang Anda cari mungkin sudah dipindahkan atau tidak tersedia.
          </p>
          <Link
            to="/"
            className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
