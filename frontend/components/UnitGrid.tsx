import { Unit, UnitCard } from "./UnitCard"

interface UnitGridProps {
  units: Unit[]
  onUnitAction?: (action: string, unit: Unit) => void
}

/**
 * A responsive grid container for UnitCard components.
 * Implements the requested responsive breakpoints:
 * - 1 column on mobile
 * - 2 columns on tablet (md)
 * - 3 columns on desktop (lg)
 */
export function UnitGrid({ units, onUnitAction }: UnitGridProps) {
  if (units.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl">
        <div className="bg-muted p-4 rounded-full mb-4">
           {/* Fallback icon if needed */}
        </div>
        <h3 className="text-lg font-semibold">No se encontraron unidades</h3>
        <p className="text-muted-foreground max-w-xs mt-1">
          No hay vehículos que coincidan con los criterios de búsqueda o no hay unidades registradas.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {units.map((unit) => (
        <UnitCard 
          key={unit.id} 
          unit={unit} 
          onAction={onUnitAction}
        />
      ))}
    </div>
  )
}
