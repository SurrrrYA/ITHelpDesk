import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import { api, apiErrorMessage } from '../lib/api'
import { formatDateOnly, formatRelative } from '../lib/format'
import type { DashboardSummary, TicketPriority, TicketStatus } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { PriorityBadge, StatusBadge } from '../components/tickets/badges'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LinkButton,
  LoadingState,
} from '../components/ui'

const statusColors: Record<TicketStatus, string> = {
  new: '#3b82f6',
  assigned: '#8b5cf6',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  closed: '#a1a1aa',
}

const priorityColors: Record<TicketPriority, string> = {
  low: '#a1a1aa',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
}

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes} menit`

  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const remainder = minutes % 60
  const parts: string[] = []

  if (days > 0) parts.push(`${days} hari`)
  if (hours > 0) parts.push(`${hours} jam`)
  if (remainder > 0) parts.push(`${remainder} menit`)

  return parts.join(' ')
}

function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: number
  hint: string
  tone?: 'default' | 'danger'
}) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
        <p
          className={
            tone === 'danger'
              ? 'mt-2 text-2xl font-semibold tracking-tight text-red-600'
              : 'mt-2 text-2xl font-semibold tracking-tight text-zinc-900'
          }
        >
          {value}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      </CardBody>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { version } = useRealtime()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedOnce = useRef(false)

  useEffect(() => {
    let active = true

    if (!loadedOnce.current) setLoading(true)
    setError(null)

    api
      .get<{ data: DashboardSummary }>('/dashboard/summary')
      .then((response) => {
        if (active) setSummary(response.data.data)
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, 'Gagal memuat dashboard.'))
      })
      .finally(() => {
        if (active) {
          loadedOnce.current = true
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [version])

  const greeting = `Selamat datang, ${user?.name ?? 'Pengguna'}`

  if (loading) {
    return (
      <>
        <PageHeader title={greeting} />
        <LoadingState label="Memuat ringkasan..." />
      </>
    )
  }

  if (error || !summary) {
    return (
      <>
        <PageHeader title={greeting} />
        <Card>
          <CardBody>
            <p className="text-sm text-red-600">{error ?? 'Data dashboard tidak tersedia.'}</p>
          </CardBody>
        </Card>
      </>
    )
  }

  const { cards, sla } = summary
  const isAdmin = user?.role === 'admin'
  const trendData = summary.trend.map((point) => ({
    ...point,
    label: formatDateOnly(point.date),
  }))
  const maxCategory = Math.max(1, ...summary.by_category.map((item) => item.count))
  const hasPriorityData = summary.by_priority.some((item) => item.count > 0)

  return (
    <>
      <PageHeader
        title={greeting}
        description={`Anda masuk sebagai ${user?.role_label ?? ''}. Berikut ringkasan aktivitas helpdesk.`}
        actions={<LinkButton to="/tickets/new">Buat Tiket</LinkButton>}
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total tiket"
            value={cards.total}
            hint={summary.scope === 'employee' ? 'Tiket yang Anda buat' : 'Tiket yang dapat Anda akses'}
          />
          <StatCard label="Sedang berjalan" value={cards.open} hint="Baru, ditugaskan, atau diproses" />
          <StatCard
            label="Belum ditugaskan"
            value={cards.unassigned}
            hint="Menunggu diambil teknisi"
          />
          <StatCard
            label="Melewati SLA"
            value={cards.overdue}
            hint="Perlu perhatian segera"
            tone={cards.overdue > 0 ? 'danger' : 'default'}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Tren tiket 30 hari</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Jumlah tiket baru per hari.</p>
            </CardHeader>
            <CardBody>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e4e4e7' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: '#e4e4e7',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Tiket"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Ringkasan SLA</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Batas waktu respons dan penyelesaian.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-600">Respons terlampaui</span>
                <Badge tone={sla.response_overdue > 0 ? 'red' : 'green'}>
                  {sla.response_overdue}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-600">Penyelesaian terlampaui</span>
                <Badge tone={sla.resolution_overdue > 0 ? 'red' : 'green'}>
                  {sla.resolution_overdue}
                </Badge>
              </div>
              <div className="border-t border-zinc-100 pt-4">
                <p className="text-xs text-zinc-500">Rata-rata respons</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {formatMinutes(sla.avg_response_minutes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Rata-rata penyelesaian</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {formatMinutes(sla.avg_resolution_minutes)}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Tiket per status</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Distribusi tiket berdasarkan status saat ini.</p>
            </CardHeader>
            <CardBody>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.by_status}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e4e4e7' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#fafafa' }}
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: '#e4e4e7',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" name="Tiket" radius={[4, 4, 0, 0]}>
                      {summary.by_status.map((item) => (
                        <Cell key={item.value} fill={statusColors[item.value]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Tiket per prioritas</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Komposisi prioritas seluruh tiket.</p>
            </CardHeader>
            <CardBody>
              {hasPriorityData ? (
                <>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summary.by_priority}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={2}
                        >
                          {summary.by_priority.map((item) => (
                            <Cell key={item.value} fill={priorityColors[item.value]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8,
                            borderColor: '#e4e4e7',
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <ul className="mt-3 space-y-2">
                    {summary.by_priority.map((item) => (
                      <li key={item.value} className="flex items-center gap-2 text-xs">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: priorityColors[item.value] }}
                        />
                        <span className="text-zinc-600">{item.label}</span>
                        <span className="ml-auto font-medium text-zinc-900">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="py-10 text-center text-sm text-zinc-500">Belum ada data tiket.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Tiket per kategori</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Kategori dengan tiket terbanyak.</p>
            </CardHeader>
            <CardBody>
              {summary.by_category.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">Belum ada data kategori.</p>
              ) : (
                <ul className="space-y-3">
                  {summary.by_category.map((item) => (
                    <li key={item.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-zinc-700">{item.name}</span>
                        <span className="font-medium text-zinc-900">{item.count}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${(item.count / maxCategory) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Perlu perhatian</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Tiket aktif dengan batas SLA terdekat.</p>
            </CardHeader>
            <CardBody>
              {summary.attention.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  Tidak ada tiket yang mendesak.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {summary.attention.map((item) => (
                    <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        to={`/tickets/${item.id}`}
                        className="text-sm font-medium text-zinc-900 hover:text-blue-700"
                      >
                        {item.subject}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-zinc-500">{item.ticket_number}</span>
                        <StatusBadge status={item.status} label={item.status_label} />
                        <PriorityBadge priority={item.priority} label={item.priority_label} />
                      </div>
                      <p
                        className={
                          item.is_resolution_overdue
                            ? 'mt-1.5 text-xs text-red-600'
                            : 'mt-1.5 text-xs text-zinc-500'
                        }
                      >
                        {item.is_resolution_overdue ? 'Terlambat ' : 'Tenggat '}
                        {formatRelative(item.sla_resolution_due_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {isAdmin && summary.workload.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-zinc-900">Beban kerja teknisi</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Tiket aktif dan tiket selesai dalam 30 hari terakhir.
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-5 py-3 font-medium">Teknisi</th>
                    <th className="px-5 py-3 font-medium">Tiket aktif</th>
                    <th className="px-5 py-3 font-medium">Selesai (30 hari)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {summary.workload.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 font-medium text-zinc-900">{row.name}</td>
                      <td className="px-5 py-3 text-zinc-600">{row.active}</td>
                      <td className="px-5 py-3 text-zinc-600">{row.resolved_30d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {cards.total === 0 && (
          <Card>
            <EmptyState
              title="Belum ada tiket"
              description="Tiket yang Anda buat atau tangani akan muncul di dashboard ini."
              action={<LinkButton to="/tickets/new">Buat Tiket Pertama</LinkButton>}
            />
          </Card>
        )}
      </div>
    </>
  )
}
