'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WalletButton } from '@/components/wallet/wallet-button'
import { 
  DollarSign, 
  Users, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [balance, setBalance] = useState<string>('45,230.00')
  const [loading, setLoading] = useState(false)

  const refreshBalance = async () => {
    setLoading(true)
    // Simulated refresh - in production, call Trustless Work API
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  const exportData = async (tipo: string) => {
    window.open(`/api/export?tipo=${tipo}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administrador</h1>
          <p className="text-muted-foreground">
            Gestiona solicitudes y monitorea el escrow de tu flota
          </p>
        </div>
        <WalletButton />
      </div>

      {/* Escrow Balance */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Balance del Escrow</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={refreshBalance}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">${balance}</span>
            <span className="text-muted-foreground">USDC</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Contrato: GXYZ...ABC • Red: Testnet
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Solicitudes esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas (Mes)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              Solicitudes aprobadas este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liberado (Mes)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,340</div>
            <p className="text-xs text-muted-foreground">
              Total liberado este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees (Mes)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$37.02</div>
            <p className="text-xs text-muted-foreground">
              Comisiones cobradas (0.3%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/admin/solicitudes">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Ver Solicitudes
          </Button>
        </Link>
        <Link href="/dashboard/admin/flota">
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Gestionar Flota
          </Button>
        </Link>
        <Button variant="outline" onClick={() => exportData('reporte-mensual')}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Solicitudes Pendientes</CardTitle>
              <CardDescription>
                Solicitudes que requieren tu aprobación
              </CardDescription>
            </div>
            <Link href="/dashboard/admin/solicitudes">
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Request 1 */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">Juan Pérez García</p>
                  <p className="text-sm text-muted-foreground">
                    Kenworth T680 • Diesel 180L
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold">$4,500.00</p>
                  <p className="text-xs text-muted-foreground">10:32 AM</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Request 2 */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">María García López</p>
                  <p className="text-sm text-muted-foreground">
                    Freightliner Cascadia • Magna 120L
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold">$3,000.00</p>
                  <p className="text-xs text-muted-foreground">09:15 AM</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Request 3 */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">Carlos López Hernández</p>
                  <p className="text-sm text-muted-foreground">
                    Volvo VNL • Diesel 200L
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold">$5,100.00</p>
                  <p className="text-xs text-muted-foreground">Ayer 06:45 PM</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
