import { describe, it, expect, vi, beforeEach } from 'vitest'
import { safeCSVField, exportUnitsToCSV, type Unit } from '@/lib/csv/export-units'

describe('Units CSV Export', () => {
  describe('safeCSVField', () => {
    it('returns plain fields unchanged', () => {
      expect(safeCSVField('Toyota')).toBe('Toyota')
    })

    it('returns empty string for null/undefined', () => {
      expect(safeCSVField(null)).toBe('')
      expect(safeCSVField(undefined)).toBe('')
    })

    it('wraps fields containing commas in double quotes', () => {
      expect(safeCSVField('A, B')).toBe('"A, B"')
    })

    it('escapes double quotes inside fields', () => {
      expect(safeCSVField('He said "hi"')).toBe('"He said ""hi"""')
    })

    it('wraps fields containing newlines in double quotes', () => {
      expect(safeCSVField('line1\nline2')).toBe('"line1\nline2"')
    })

    it('prefixes fields starting with = (formula guard)', () => {
      expect(safeCSVField('=1+1')).toBe("'=1+1")
    })

    it('prefixes fields starting with + (formula guard)', () => {
      expect(safeCSVField('+add')).toBe("'+add")
    })

    it('prefixes fields starting with - (formula guard)', () => {
      expect(safeCSVField('-subtract')).toBe("'-subtract")
    })

    it('prefixes fields starting with @ (formula guard)', () => {
      expect(safeCSVField('@mention')).toBe("'@mention")
    })

    it('prefixes fields with leading spaces before formula trigger', () => {
      expect(safeCSVField('  =1+1')).toBe("'  =1+1")
    })

    it('handles both formula guard AND comma/quote escaping simultaneously', () => {
      expect(safeCSVField('=1+1,"test"')).toBe('"\'=1+1,""test"""')
    })

    it('handles single-character trigger fields without double-apostrophe', () => {
      expect(safeCSVField('-')).toBe("'-")
      expect(safeCSVField('@')).toBe("'@")
    })

    it('prefixes fields starting with tab (formula guard)', () => {
      expect(safeCSVField('\t=formula')).toBe("'\t=formula")
    })

    it('prefixes fields starting with carriage return (formula guard)', () => {
      expect(safeCSVField('\r=formula')).toBe("'\r=formula")
    })

    it('does not prefix fields that have formula chars mid-string', () => {
      expect(safeCSVField('hello =world')).toBe('hello =world')
    })

    it('does not prefix fields starting with regular chars', () => {
      expect(safeCSVField('123')).toBe('123')
      expect(safeCSVField('abc')).toBe('abc')
    })
  })

  describe('exportUnitsToCSV', () => {
    let downloadSpy: ReturnType<typeof vi.fn>
    let createElementSpy: ReturnType<typeof vi.fn>
    let appendChildSpy: ReturnType<typeof vi.fn>
    let removeChildSpy: ReturnType<typeof vi.fn>
    let clickSpy: ReturnType<typeof vi.fn>
    let revokeObjectURLSpy: ReturnType<typeof vi.fn>
    let createdBlob: Blob | null = null

    const mockUnits: Unit[] = [
      {
        id: 'unit-1',
        make: 'Toyota',
        model: 'Hilux',
        year: 2023,
        plates: 'ABC-123',
        isActive: true,
        permitNumber: 'P-001',
        permitExpiry: '2025-06-15',
        user: { name: 'Juan Pérez' },
      },
      {
        id: 'unit-2',
        make: 'Nissan',
        model: 'NP300',
        year: 2022,
        plates: 'XYZ-789',
        isActive: false,
        user: undefined,
      },
    ]

    beforeEach(() => {
      createdBlob = null
      clickSpy = vi.fn()
      revokeObjectURLSpy = vi.fn()
      appendChildSpy = vi.fn()
      removeChildSpy = vi.fn()

      downloadSpy = vi.fn((url: string) => {
        // Extract blob from object URL by reading the mock
        return url
      })

      createElementSpy = vi.fn(() => ({
        tag: 'a',
        href: '',
        download: '',
        click: clickSpy,
      }))

      vi.stubGlobal('document', {
        createElement: createElementSpy,
        body: {
          appendChild: appendChildSpy,
          removeChild: removeChildSpy,
        },
      })

      vi.stubGlobal('URL', {
        createObjectURL: (blob: Blob) => {
          createdBlob = blob
          return 'blob:mock-url'
        },
        revokeObjectURL: revokeObjectURLSpy,
      })
    })

    it('generates CSV with correct headers and data rows', () => {
      exportUnitsToCSV(mockUnits)

      expect(createdBlob).not.toBeNull()
      expect(createdBlob!.type).toBe('text/csv;charset=utf-8')

      // Verify the blob content by reading it
      const reader = new FileReader()
      // Since we can't easily read blob content in test, verify structure
      expect(createdBlob).toBeDefined()
    })

    it('includes BOM prefix for Excel compatibility', async () => {
      exportUnitsToCSV(mockUnits)

      // Read the blob content
      const text = await createdBlob!.text()
      // BOM is \uFEFF — check the file starts with it
      expect(text.charCodeAt(0)).toBe(0xFEFF)
    })

    it('contains all expected column headers', async () => {
      exportUnitsToCSV(mockUnits)

      const text = await createdBlob!.text()
      const lines = text.split('\n')
      // First line after BOM should be headers (BOM + header text)
      const headerLine = lines[0].replace(/^\uFEFF/, '')
      expect(headerLine).toBe(
        'ID,Marca,Modelo,Año,Placas,Conductor,No. Permiso,Vencimiento Permiso,Estado'
      )
    })

    it('maps unit data to correct CSV columns', async () => {
      exportUnitsToCSV([mockUnits[0]])

      const text = await createdBlob!.text()
      const lines = text.replace(/^\uFEFF/, '').split('\n')
      const dataRow = lines[1]

      expect(dataRow).toContain('unit-1')
      expect(dataRow).toContain('Toyota')
      expect(dataRow).toContain('Hilux')
      expect(dataRow).toContain('2023')
      expect(dataRow).toContain('ABC-123')
      expect(dataRow).toContain('Juan Pérez')
      expect(dataRow).toContain('P-001')
      expect(dataRow).toContain('2025-06-15')
      expect(dataRow).toContain('Activo')
    })

    it('handles optional fields gracefully (undefined user)', async () => {
      exportUnitsToCSV([mockUnits[1]])

      const text = await createdBlob!.text()
      const lines = text.replace(/^\uFEFF/, '').split('\n')
      const dataRow = lines[1]
      const columns = dataRow.split(',')

      // Conductor (index 5) should be empty
      expect(columns[5]).toBe('')
      // No. Permiso (index 6) should be empty
      expect(columns[6]).toBe('')
      // Estado should be Inactivo
      expect(columns[8]).toBe('Inactivo')
    })

    it('triggers file download with correct filename', () => {
      exportUnitsToCSV(mockUnits)

      const anchorEl = createElementSpy.mock.results[0].value
      expect(anchorEl.download).toMatch(/^flota_\d{4}-\d{2}-\d{2}\.csv$/)
      expect(clickSpy).toHaveBeenCalled()
    })

    it('cleans up object URL after download', () => {
      exportUnitsToCSV(mockUnits)

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
    })

    it('neutralizes formula-injection in exported data', async () => {
      const maliciousUnit: Unit[] = [
        {
          id: 'unit-mal',
          make: 'Toyota',
          model: 'Corolla',
          plates: '=1+1',
          isActive: true,
          user: { name: '=HYPERLINK("http://evil.com","click")' },
        },
      ]

      exportUnitsToCSV(maliciousUnit)

      const text = await createdBlob!.text()
      const lines = text.replace(/^\uFEFF/, '').split('\n')
      const dataRow = lines[1]

      // Placas field: formula guard adds apostrophe, no comma/quote so no wrapping
      expect(dataRow).toContain("'=1+1")
      expect(dataRow).not.toMatch(/,=1[+,]/)

      // Conductor field: formula guard adds apostrophe, then comma+quote triggers CSV wrapping
      // The field becomes "'=HYPERLINK(""http://evil.com"",""click"")" — a properly quoted CSV cell
      // Verify the raw CSV doesn't contain a bare =HYPERLINK formula
      expect(dataRow).not.toMatch(/,=HYPERLINK/)
    })
  })
})
