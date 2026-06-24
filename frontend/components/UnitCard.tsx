import { Car, User, Calendar, MoreHorizontal, Eye, PowerOff, Edit } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export interface Unit {
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

interface UnitCardProps {
  unit: Unit
  onAction?: (action: string, unit: Unit) => void
}

/**
 * A visual card representing a fleet unit.
 * Implements color-coded status logic:
 * - Green: Active & Assigned
 * - Yellow: Active & Unassigned
 * - Red: Inactive
 */
export function UnitCard({ unit, onAction }: UnitCardProps) {
  const isAssigned = !!unit.user
  const isActive = unit.isActive

  let statusColor = "bg-muted"
  let statusText = "Inactivo"
  let dotColor = "bg-gray-400"

  if (isActive) {
    if (isAssigned) {
      statusColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      statusText = "Activo / Asignado"
      dotColor = "bg-emerald-500"
    } else {
      statusColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      statusText = "Activo / Sin Chófer"
      dotColor = "bg-amber-500"
    }
  } else {
    statusColor = "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive-foreground"
    statusText = "Fuera de Servicio"
    dotColor = "bg-destructive"
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg dark:hover:bg-accent/5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background ${dotColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground leading-tight">
              {unit.make} {unit.model}
            </h3>
            {unit.year && (
              <p className="text-xs text-muted-foreground">{unit.year}</p>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction?.('view', unit)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction?.('edit', unit)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Unidad
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={isActive ? "text-destructive" : "text-emerald-600"}
              onClick={() => onAction?.('toggle', unit)}
            >
              <PowerOff className="mr-2 h-4 w-4" />
              {isActive ? 'Desactivar' : 'Activar'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 border border-border/50">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placas</span>
          <span className="text-sm font-bold text-foreground font-mono">{unit.plates}</span>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary/70" />
            <span className={isAssigned ? "text-foreground font-medium" : "text-muted-foreground italic text-xs"}>
              {unit.user?.name || "Sin chófer asignado"}
            </span>
          </div>

          {unit.permitNumber && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 opacity-70" />
              <span>Permiso: <span className="text-foreground/80">{unit.permitNumber}</span></span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
            {statusText}
          </span>
          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
             <div 
               className={`h-full ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} 
               style={{ width: isActive ? '100%' : '0%' }}
             />
          </div>
        </div>
      </div>
    </div>
  )
}
