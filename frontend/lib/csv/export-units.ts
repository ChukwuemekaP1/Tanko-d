interface Unit {
  id: string
  make: string
  model: string
  year?: number
  plates: string
  isActive: boolean
  specs?: string
  permitNumber?: string
  permitExpiry?: string
  user?: {
    name: string
  }
}

export type { Unit }

export function safeCSVField(value: string | null | undefined): string {
  if (value == null) return ''

  if (/^[=+\-@\t\r]/.test(value.trimStart())) {
    value = "'" + value
  }

  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    value = '"' + value.replace(/"/g, '""') + '"'
  }

  return value
}

function toCSVRow(fields: string[]): string {
  return fields.map(safeCSVField).join(',')
}

export function exportUnitsToCSV(data: Unit[]): void {
  const headers = [
    'ID',
    'Marca',
    'Modelo',
    'Año',
    'Placas',
    'Conductor',
    'No. Permiso',
    'Vencimiento Permiso',
    'Estado',
  ]

  const rows = data.map((unit) =>
    toCSVRow([
      unit.id,
      unit.make,
      unit.model,
      unit.year?.toString() ?? '',
      unit.plates,
      unit.user?.name ?? '',
      unit.permitNumber ?? '',
      unit.permitExpiry ?? '',
      unit.isActive ? 'Activo' : 'Inactivo',
    ]),
  )

  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `flota_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()

  URL.revokeObjectURL(url)
}
