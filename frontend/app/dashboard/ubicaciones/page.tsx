"use client"

import { useState, useEffect } from "react"
import { MapPin, Search, Fuel, AlertCircle, Clock, Plus, Filter, MoreHorizontal, ExternalLink, Map as MapIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/providers/auth-provider"
import { toast } from "sonner"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001"

interface GasStation {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  lat?: number
  lng?: number
  hours?: string
  services: string[]
  status: string
}

export default function LocationsPage() {
  const { role } = useAuth()
  const [stations, setStations] = useState<GasStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const isJefe = role === "JEFE"

  useEffect(() => {
    async function fetchStations() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${BACKEND}/api/v1/stations`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setStations(data.success ? data.data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection Error")
        setStations([])
      } finally {
        setLoading(false)
      }
    }
    fetchStations()
  }, [])

  const filtered = stations.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.state?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const LoadingSkeleton = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden border-border/40 shadow-sm">
          <CardHeader className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
        <MapPin className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">No stations found</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {searchQuery 
          ? "We couldn't find any gas stations matching your search criteria. Try a different term."
          : isJefe 
            ? "Your fleet doesn't have any authorized gas stations yet. Start by adding your first one."
            : "There are currently no authorized gas stations available for your route."}
      </p>
      {isJefe && !searchQuery && (
        <Sheet>
          <SheetTrigger asChild>
            <Button className="mt-6 gap-2" size="lg">
              <Plus className="h-4 w-4" />
              Register First Gas Station
            </Button>
          </SheetTrigger>
          <StationForm />
        </Sheet>
      )}
    </div>
  )

  const StationForm = () => (
    <SheetContent className="sm:max-w-[500px]">
      <SheetHeader className="pb-6">
        <SheetTitle className="text-2xl font-bold">Add New Gas Station</SheetTitle>
        <SheetDescription>
          Register a new authorized fueling location for your fleet.
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-6 py-4">
        {/* Mock form fields for now */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Station Name</label>
          <Input placeholder="e.g. Pemex Santa Fe" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Address</label>
          <Input placeholder="Avenida Siempre Viva 123..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">City</label>
            <Input placeholder="CDMX" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">State</label>
            <Input placeholder="Mexico" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Operating Hours</label>
          <Input placeholder="e.g. 24/7 or 06:00 - 22:00" />
        </div>
        <Button className="w-full mt-4" onClick={() => toast.success("Feature coming soon!")}>
          Register Station
        </Button>
      </div>
    </SheetContent>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">LOCATIONS</h1>
          <p className="text-muted-foreground mt-1">Authorized fueling network for your logistics operations.</p>
        </div>
        {isJefe && (
          <Sheet>
            <SheetTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" size="lg">
                <Plus className="h-5 w-5" />
                Add Station
              </Button>
            </SheetTrigger>
            <StationForm />
          </Sheet>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-card p-4 rounded-xl border border-border/40 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            placeholder="Search by name, address or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-background border-muted"
          />
        </div>
        <Button variant="outline" size="icon" className="h-12 w-12 shrink-0">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {error ? (
        <div className="flex h-[40vh] items-center justify-center rounded-2xl bg-destructive/5 border border-destructive/10 p-8">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-destructive">System Connection Error</h3>
            <p className="text-sm text-muted-foreground">
              We're having trouble reaching the logistics API. Please verify your connection or contact system administration.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </div>
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((station) => (
            <Card
              key={station.id}
              className="group overflow-hidden border-border/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1"
            >
              <CardHeader className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Fuel className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 font-bold uppercase tracking-wider text-[10px]">
                    Active
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                    {station.name}
                  </CardTitle>
                  <CardDescription className="flex items-start gap-1.5 mt-2 line-clamp-2">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    {station.address}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-5">
                <div className="flex items-center justify-between text-xs py-3 border-y border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-medium">{station.hours || "24/7"}</span>
                  </div>
                  {station.lat && (
                    <div className="flex items-center gap-1 font-mono text-muted-foreground/60">
                      <MapIcon className="h-3 w-3" />
                      {station.lat.toFixed(3)}, {station.lng?.toFixed(3)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {station.services.slice(0, 2).map((svc) => (
                      <Badge key={svc} variant="secondary" className="bg-muted/50 text-[10px] font-bold">
                        {svc}
                      </Badge>
                    ))}
                    {station.services.length > 2 && (
                      <Badge variant="secondary" className="bg-muted/50 text-[10px] font-bold">
                        +{station.services.length - 2}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
