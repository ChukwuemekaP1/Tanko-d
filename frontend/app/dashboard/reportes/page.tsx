'use client'

import * as React from 'react'
import { format, isValid, parseISO } from 'date-fns'
import {
  AlertCircle,
  Banknote,
  CalendarRange,
  Download,
  Fuel,
  Loader2,
  Users,
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import DateRangePicker, {
  type DateRangeValue,
} from '../../../components/DateRangePicker'
import { Button } from '../../../components/ui/button'

interface NormalizedTransaction {
  id: string
  date?: Date
  driverName: string
  unitLabel: string
  liters: number
  spend: number
  status: string
  notes: string
}

interface NormalizedDriverRow {
  id: string
  name: string
  liters: number
  spend: number
  trips: number
}

interface SummaryCard {
  label: string
  value: string
  helper: string
  icon: React.ComponentType<{ className?: string }>
}

interface ReportViewModel {
  summaryCards: SummaryCard[]
  driverRows: NormalizedDriverRow[]
  transactionRows: NormalizedTransaction[]
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }

  return undefined
}

function toNumber(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return 0
}

function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return isValid(value) ? value : undefined
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = parseISO(value)
    if (isValid(parsed)) {
      return parsed
    }
  }

  return undefined
}

function formatDateTime(value?: Date): string {
  if (!value || !isValid(value)) {
    return '—'
  }

  return format(value, 'dd/MM/yyyy HH:mm')
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-ES', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`
}

function formatLiters(value: number): string {
  return `${value.toLocaleString('es-ES', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })} L`
}

function parseQueryDate(value: string | null): Date | undefined {
  if (!value) {
    return undefined
  }

  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

function parseRange(
  startDateParam: string | null,
  endDateParam: string | null
): { value?: DateRangeValue; error?: string } {
  const startDate = parseQueryDate(startDateParam)
  const endDate = parseQueryDate(endDateParam)

  if (startDateParam && !startDate) {
    return { error: 'Invalid startDate query parameter.' }
  }

  if (endDateParam && !endDate) {
    return { error: 'Invalid endDate query parameter.' }
  }

  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    return {
      error: 'The startDate cannot be later than the endDate.',
    }
  }

  if (!startDate && !endDate) {
    return { value: undefined }
  }

  return {
    value: {
      from: startDate,
      to: endDate,
    },
  }
}

function extractArray(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    for (const key of keys) {
      const value = record[key]
      if (Array.isArray(value)) {
        return value
      }
    }
  }

  return []
}

function normalizeTransaction(
  item: unknown,
  index: number
): NormalizedTransaction {
  const record = item as Record<string, unknown>

  const driverName = pickString(
    record.driverName,
    (record.driver as Record<string, unknown> | undefined)?.name,
    (record.driver as Record<string, unknown> | undefined)?.fullName,
    (record.driver as Record<string, unknown> | undefined)?.displayName,
    (record.user as Record<string, unknown> | undefined)?.name,
    record.userName,
    record.name
  )

  const unitLabel = pickString(
    (record.unit as Record<string, unknown> | undefined)?.plate,
    (record.unit as Record<string, unknown> | undefined)?.name,
    (record.unit as Record<string, unknown> | undefined)?.code,
    (record.vehicle as Record<string, unknown> | undefined)?.plate,
    (record.vehicle as Record<string, unknown> | undefined)?.name,
    record.unitName,
    record.vehicleName
  )

  const liters = toNumber(
    record.liters,
    record.quantity,
    record.amountLiters,
    record.volume,
    record.fuelLiters
  )

  const spend = toNumber(
    record.totalSpend,
    record.amount,
    record.total,
    record.cost,
    record.price,
    record.spent,
    record.releasedAmount
  )

  const status = pickString(record.status, record.state, record.type)
  const notes = pickString(record.notes, record.description, record.reason, record.observation)
  const date = parseDate(
    record.date ?? record.createdAt ?? record.transactionDate ?? record.fuelDate
  )

  return {
    id:
      pickString(record.id, record._id, record.uuid) ?? `transaction-${index}`,
    date,
    driverName: driverName ?? '—',
    unitLabel: unitLabel ?? '—',
    liters,
    spend,
    status: status ?? '—',
    notes: notes ?? '—',
  }
}

function normalizeDriverRow(item: unknown, index: number): NormalizedDriverRow {
  const record = item as Record<string, unknown>

  const name = pickString(
    record.driverName,
    record.name,
    (record.driver as Record<string, unknown> | undefined)?.name,
    (record.driver as Record<string, unknown> | undefined)?.fullName,
    (record.user as Record<string, unknown> | undefined)?.name
  )

  const liters = toNumber(
    record.liters,
    record.totalLiters,
    record.fuelLiters,
    record.volume
  )

  const spend = toNumber(
    record.totalSpend,
    record.amount,
    record.total,
    record.cost,
    record.price,
    record.spent,
    record.releasedAmount
  )

  const trips = Math.trunc(
    toNumber(record.trips, record.count, record.totalTrips, record.transactions)
  )

  return {
    id: pickString(record.id, record._id, record.uuid) ?? `driver-${index}`,
    name: name ?? '—',
    liters,
    spend,
    trips,
  }
}

function extractPayload<T = unknown>(result: PromiseSettledResult<T>): T | undefined {
  return result.status === 'fulfilled' ? result.value : undefined
}

function sumTransactions(transactions: NormalizedTransaction[]) {
  return transactions.reduce(
    (accumulator, transaction) => {
      accumulator.liters += transaction.liters
      accumulator.spend += transaction.spend
      accumulator.trips += 1
      return accumulator
    },
    { liters: 0, spend: 0, trips: 0 }
  )
}

function buildSummaryCards(
  reportsPayload: unknown,
  dashboardPayload: unknown,
  transactionRows: NormalizedTransaction[],
  driverRows: NormalizedDriverRow[]
): SummaryCard[] {
  const reportRecord =
    reportsPayload && typeof reportsPayload === 'object'
      ? (reportsPayload as Record<string, unknown>)
      : undefined

  const dashboardRecord =
    dashboardPayload && typeof dashboardPayload === 'object'
      ? (dashboardPayload as Record<string, unknown>)
      : undefined

  const transactionTotals = sumTransactions(transactionRows)

  const totalTransactions = Math.trunc(
    toNumber(
      reportRecord?.totalTransactions,
      reportRecord?.transactionsCount,
      reportRecord?.count,
      dashboardRecord?.totalTransactions,
      dashboardRecord?.transactionsCount,
      transactionTotals.trips
    )
  )

  const totalLiters = toNumber(
    reportRecord?.totalLiters,
    reportRecord?.liters,
    dashboardRecord?.totalLiters,
    dashboardRecord?.fuelLiters,
    transactionTotals.liters
  )

  const totalSpend = toNumber(
    reportRecord?.totalSpend,
    reportRecord?.totalFuelSpend,
    reportRecord?.totalReleased,
    dashboardRecord?.totalSpend,
    dashboardRecord?.totalFuelSpend,
    transactionTotals.spend
  )

  const activeDrivers = Math.trunc(
    toNumber(
      reportRecord?.totalDrivers,
      reportRecord?.driversCount,
      dashboardRecord?.totalDrivers,
      dashboardRecord?.driversCount,
      driverRows.length
    )
  )

  const averageSpend = totalTransactions ? totalSpend / totalTransactions : 0

  return [
    {
      label: 'Transactions',
      value: totalTransactions.toLocaleString('es-ES'),
      helper: 'Filtered by the active date range.',
      icon: CalendarRange,
    },
    {
      label: 'Total liters',
      value: formatLiters(totalLiters),
      helper: 'Fuel consumed across the selected window.',
      icon: Fuel,
    },
    {
      label: 'Total spend',
      value: formatCurrency(totalSpend),
      helper: `Average spend per transaction: ${formatCurrency(averageSpend)}`,
      icon: Banknote,
    },
    {
      label: 'Active drivers',
      value: activeDrivers.toLocaleString('es-ES'),
      helper: 'Unique drivers represented in the report.',
      icon: Users,
    },
  ]
}

function buildDateRangeQuery(value?: DateRangeValue) {
  const params = new URLSearchParams()

  if (value?.from) {
    params.set('startDate', format(value.from, 'yyyy-MM-dd'))
  }

  if (value?.to) {
    params.set('endDate', format(value.to, 'yyyy-MM-dd'))
  }

  return params
}

function buildApiUrl(path: string, value?: DateRangeValue, extra?: Record<string, string>) {
  const params = buildDateRangeQuery(value)

  if (extra) {
    for (const [key, item] of Object.entries(extra)) {
      params.set(key, item)
    }
  }

  const query = params.toString()
  return query ? `${path}?${query}` : path
}

function getRangeLabel(value?: DateRangeValue): string {
  if (!value?.from && !value?.to) {
    return 'Showing the backend default last 30 days.'
  }

  if (value.from && value.to) {
    return `Showing results from ${format(value.from, 'dd/MM/yyyy')} to ${format(
      value.to,
      'dd/MM/yyyy'
    )}.`
  }

  if (value.from) {
    return `Showing results from ${format(value.from, 'dd/MM/yyyy')}.`
  }

  return 'Showing the selected range.'
}

function getDriverSharePercent(driver: NormalizedDriverRow, maxValue: number): number {
  if (!maxValue) {
    return 0
  }

  return Math.max(0, Math.min(100, (driver.spend / maxValue) * 100))
}

export default function ReportesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()

  const parsedRange = React.useMemo(() => {
    const params = new URLSearchParams(searchParamsString)
    return parseRange(params.get('startDate'), params.get('endDate'))
  }, [searchParamsString])

  const hasDateQuery = React.useMemo(() => {
    const params = new URLSearchParams(searchParamsString)
    return params.has('startDate') || params.has('endDate')
  }, [searchParamsString])

  const selectedRange = parsedRange.value
  const dateRangePlaceholder = hasDateQuery
    ? 'Seleccionar rango'
    : 'Últimos 30 días'

  const [viewModel, setViewModel] = React.useState<ReportViewModel>({
    summaryCards: [],
    driverRows: [],
    transactionRows: [],
  })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (parsedRange.error) {
      setViewModel({
        summaryCards: [],
        driverRows: [],
        transactionRows: [],
      })
      setError(parsedRange.error)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    const loadReports = async () => {
      setLoading(true)
      setError(null)

      try {
        const query = buildDateRangeQuery(selectedRange)

        const [reportsResult, dashboardResult, driversResult, transactionsResult] =
          await Promise.allSettled([
            fetch(buildApiUrl('/api/v1/stats/reports', selectedRange), {
              signal: controller.signal,
            }).then(async (response) => {
              const payload = await response.json().catch(() => null)

              if (!response.ok) {
                const message =
                  payload &&
                  typeof payload === 'object' &&
                  'message' in payload &&
                  typeof payload.message === 'string'
                    ? payload.message
                    : 'No se pudieron cargar los reportes.'
                throw new Error(message)
              }

              return payload
            }),
            fetch(buildApiUrl('/api/v1/stats/dashboard', selectedRange), {
              signal: controller.signal,
            }).then(async (response) => {
              const payload = await response.json().catch(() => null)

              if (!response.ok) {
                const message =
                  payload &&
                  typeof payload === 'object' &&
                  'message' in payload &&
                  typeof payload.message === 'string'
                    ? payload.message
                    : 'No se pudieron cargar las estadísticas.'
                throw new Error(message)
              }

              return payload
            }),
            fetch(buildApiUrl('/api/v1/stats/consumption-by-driver', selectedRange), {
              signal: controller.signal,
            }).then(async (response) => {
              const payload = await response.json().catch(() => null)

              if (!response.ok) {
                const message =
                  payload &&
                  typeof payload === 'object' &&
                  'message' in payload &&
                  typeof payload.message === 'string'
                    ? payload.message
                    : 'No se pudieron cargar los conductores.'
                throw new Error(message)
              }

              return payload
            }),
            fetch(
              buildApiUrl('/api/v1/stats/recent-transactions', selectedRange, {
                limit: '10',
              }),
              {
                signal: controller.signal,
              }
            ).then(async (response) => {
              const payload = await response.json().catch(() => null)

              if (!response.ok) {
                const message =
                  payload &&
                  typeof payload === 'object' &&
                  'message' in payload &&
                  typeof payload.message === 'string'
                    ? payload.message
                    : 'No se pudieron cargar las transacciones recientes.'
                throw new Error(message)
              }

              return payload
            }),
          ])

        const reportPayload = extractPayload(reportsResult)
        const dashboardPayload = extractPayload(dashboardResult)
        const driversPayload = extractPayload(driversResult)
        const transactionsPayload = extractPayload(transactionsResult)

        const reportRecord =
          reportPayload && typeof reportPayload === 'object'
            ? (reportPayload as Record<string, unknown>)
            : undefined

        const driverRowsSource =
          extractArray(reportRecord?.driverBreakdown, ['items']) ||
          extractArray(reportRecord?.drivers, ['items']) ||
          extractArray(reportRecord?.byDriver, ['items']) ||
          extractArray(driversPayload, ['data', 'drivers', 'items', 'results'])

        const transactionRowsSource =
          extractArray(reportRecord?.recentTransactions, ['items']) ||
          extractArray(reportRecord?.transactions, ['items']) ||
          extractArray(reportRecord?.logs, ['items']) ||
          extractArray(transactionsPayload, ['data', 'transactions', 'items', 'results'])

        const driverRows = driverRowsSource.map((item, index) =>
          normalizeDriverRow(item, index)
        )

        const transactionRows = transactionRowsSource.map((item, index) =>
          normalizeTransaction(item, index)
        )

        const summaryCards = buildSummaryCards(
          reportPayload,
          dashboardPayload,
          transactionRows,
          driverRows
        )

        setViewModel({
          summaryCards,
          driverRows,
          transactionRows,
        })
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return
        }

        const message =
          fetchError instanceof Error
            ? fetchError.message
            : 'No se pudieron cargar los reportes.'
        setError(message)
        setViewModel({
          summaryCards: [],
          driverRows: [],
          transactionRows: [],
        })
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadReports()

    return () => {
      controller.abort()
    }
  }, [parsedRange.error, selectedRange?.from, selectedRange?.to])

  const totalDriverSpend = React.useMemo(
    () => viewModel.driverRows.reduce((sum, driver) => sum + driver.spend, 0),
    [viewModel.driverRows]
  )

  const topDriverSpend = React.useMemo(
    () =>
      viewModel.driverRows.reduce(
        (max, driver) => Math.max(max, driver.spend),
        0
      ),
    [viewModel.driverRows]
  )

  const hasNoData =
    !loading &&
    !error &&
    viewModel.summaryCards.length > 0 &&
    viewModel.summaryCards.every((card) => card.value === '0' || card.value === '$0') &&
    viewModel.driverRows.length === 0 &&
    viewModel.transactionRows.length === 0

  const rangeLabel = getRangeLabel(selectedRange)

  const handleDateRangeChange = React.useCallback(
    (value: DateRangeValue) => {
      const params = new URLSearchParams(searchParamsString)

      if (value?.from) {
        params.set('startDate', format(value.from, 'yyyy-MM-dd'))
      } else {
        params.delete('startDate')
      }

      if (value?.to) {
        params.set('endDate', format(value.to, 'yyyy-MM-dd'))
      } else {
        params.delete('endDate')
      }

      const nextQuery = params.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParamsString]
  )

  const buildExportUrl = React.useCallback(
    (formatName: 'pdf' | 'xlsx') =>
      buildApiUrl('/api/v1/stats/reports/export', selectedRange, {
        format: formatName,
      }),
    [selectedRange]
  )

  const openExport = React.useCallback(
    (formatName: 'pdf' | 'xlsx') => {
      window.open(buildExportUrl(formatName), '_blank', 'noopener,noreferrer')
    },
    [buildExportUrl]
  )

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Reportes
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Fleet reporting overview
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Review the report summary, driver breakdown, and latest activity
              for a shareable time window.
            </p>
            <p className="text-xs text-muted-foreground">{rangeLabel}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DateRangePicker
              value={selectedRange}
              onChange={handleDateRangeChange}
              placeholder={dateRangePlaceholder}
              className="w-full sm:w-auto"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openExport('pdf')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openExport('xlsx')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Unable to load report data.</p>
              <p>{error}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border bg-background p-4 shadow-sm"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-8 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-3 w-40 animate-pulse rounded bg-muted" />
              </div>
            ))
          : viewModel.summaryCards.map((card) => {
              const Icon = card.icon

              return (
                <div
                  key={card.label}
                  className="rounded-xl border bg-background p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">
                        {card.value}
                      </p>
                    </div>
                    <div className="rounded-full bg-muted p-2 text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{card.helper}</p>
                </div>
              )
            })}
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-xl border bg-background shadow-sm xl:col-span-2">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Driver breakdown</h2>
            <p className="text-sm text-muted-foreground">
              Ranked by spend for the selected date range.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading drivers...
              </div>
            </div>
          ) : viewModel.driverRows.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="rounded-full bg-muted p-3 text-muted-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-medium">No drivers found</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {hasDateQuery
                    ? 'There are no driver records for the selected range.'
                    : 'There are no driver records available.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {viewModel.driverRows
                .slice()
                .sort((left, right) => right.spend - left.spend)
                .map((driver) => (
                  <div key={driver.id} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {driver.trips.toLocaleString('es-ES')} trips ·{' '}
                          {formatLiters(driver.liters)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(driver.spend)}</p>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{
                          width: `${getDriverSharePercent(driver, topDriverSpend)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              <p className="text-xs text-muted-foreground">
                Total spend represented: {formatCurrency(totalDriverSpend)}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-background shadow-sm xl:col-span-3">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Recent transactions</h2>
            <p className="text-sm text-muted-foreground">
              Latest fuel log activity within the selected date range.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading recent transactions...
              </div>
            </div>
          ) : viewModel.transactionRows.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="rounded-full bg-muted p-3 text-muted-foreground">
                <CalendarRange className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-medium">No transactions found</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {hasDateQuery
                    ? 'There are no recent transactions for the selected range.'
                    : 'There are no recent transactions available.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Liters</th>
                    <th className="px-4 py-3">Spend</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {viewModel.transactionRows.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateTime(transaction.date)}
                      </td>
                      <td className="px-4 py-3">{transaction.driverName}</td>
                      <td className="px-4 py-3">{transaction.unitLabel}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatLiters(transaction.liters)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatCurrency(transaction.spend)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {transaction.status}
                      </td>
                      <td className="px-4 py-3">{transaction.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {!loading && !error && hasNoData ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <div className="rounded-full bg-background p-3 text-muted-foreground">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium">No data for this range</h3>
              <p className="text-sm text-muted-foreground">
                Try a different date range or clear the filter to return to the
                default window.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDateRangeChange(undefined)}
            >
              Clear date filter
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}