'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Loader2, User, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001'

interface Driver {
  id: string
  name: string
  email?: string
}

interface AssignDriverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unitId: string
  unitName: string
  currentDriverId?: string | null
  onAssigned: (unitId: string, driver: Driver | null) => void
}

export function AssignDriverModal({
  open,
  onOpenChange,
  unitId,
  unitName,
  currentDriverId,
  onAssigned,
}: AssignDriverModalProps) {
  const t = useTranslations('unidades')

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [driverError, setDriverError] = useState<string | null>(null)

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return

    setSelectedDriverId(currentDriverId ?? null)
    setSearch('')
    setSubmitError(null)

    async function fetchDrivers() {
      setLoadingDrivers(true)
      setDriverError(null)
      try {
        const res = await fetch(`${BACKEND}/api/v1/users?role=CONDUCTOR`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setDrivers(json.success && json.data ? json.data : [])
      } catch (err) {
        setDriverError(err instanceof Error ? err.message : 'Error loading drivers')
        setDrivers([])
      } finally {
        setLoadingDrivers(false)
      }
    }

    fetchDrivers()
  }, [open, currentDriverId])

  const filteredDrivers = useMemo(() => {
    if (!search.trim()) return drivers
    const q = search.toLowerCase()
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q),
    )
  }, [drivers, search])

  const hasChanged = selectedDriverId !== (currentDriverId ?? null)

  async function handleConfirm() {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`${BACKEND}/api/v1/units/${unitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedDriverId }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      const selected = selectedDriverId
        ? drivers.find((d) => d.id === selectedDriverId) ?? null
        : null

      onAssigned(unitId, selected)
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('assignError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {currentDriverId ? t('changeDriver') : t('assignDriver')}
          </DialogTitle>
          <DialogDescription>{unitName}</DialogDescription>
        </DialogHeader>

        {loadingDrivers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : driverError ? (
          <div className="py-6 text-center text-sm text-destructive">
            {driverError}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchDriver')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
              {/* Detach option */}
              <button
                type="button"
                onClick={() => setSelectedDriverId(null)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedDriverId === null
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <UserX className="h-4 w-4 shrink-0" />
                <span>{t('noDriver')}</span>
              </button>

              {filteredDrivers.map((driver) => (
                <button
                  key={driver.id}
                  type="button"
                  onClick={() => setSelectedDriverId(driver.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedDriverId === driver.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <User className="h-4 w-4 shrink-0 text-primary/70" />
                  <div className="min-w-0">
                    <p className="truncate">{driver.name}</p>
                    {driver.email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {driver.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}

              {filteredDrivers.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t('noDrivers')}
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || loadingDrivers || !hasChanged}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('confirm')}
              </>
            ) : (
              t('confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
