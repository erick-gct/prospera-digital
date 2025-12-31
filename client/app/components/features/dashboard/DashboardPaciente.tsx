"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  CheckCircle2,
  XCircle,
  CalendarClock,
  BarChart3,
  Loader2,
  CalendarPlus,
  History,
  Footprints
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"
import { ApiRoutes } from "@/lib/api-routes"
import { createClient } from "@/lib/supabase/cliente"
import Link from "next/link"

interface DashboardData {
  paciente: {
    nombres: string
    apellidos: string
  } | null
  proximaCita: {
    id: number
    fecha_hora_inicio: string
    motivo_cita: string | null
    podologo_nombre: string | null
    estado_cita: { id: number; nombre: string } | null
  } | null
  estadisticas: {
    totalCitas: number
    completadas: number
    reservadas: number
    canceladas: number
  }
  documentos: number
  recetas: number
  ortesis: number
  ultimaEvaluacion: {
    pieIzquierdo: { tipo: string | null; notas: string | null }
    pieDerecho: { tipo: string | null; notas: string | null }
  } | null
}

const chartConfig = {
  completadas: {
    label: "Completadas",
    color: "#22C55E",
  },
  reservadas: {
    label: "Reservadas",
    color: "#3B82F6",
  },
  canceladas: {
    label: "Canceladas",
    color: "#EF4444",
  },
} satisfies ChartConfig

export function DashboardPaciente() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Obtener usuario
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [])

  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboard = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        const response = await fetch(ApiRoutes.dashboard.patient(userId))
        if (response.ok) {
          const dashboardData = await response.json()
          setData(dashboardData)
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error cargando dashboard</p>
      </div>
    )
  }

  const chartData = [
    { name: "Completadas", value: data.estadisticas.completadas, fill: "#22C55E" },
    { name: "Reservadas", value: data.estadisticas.reservadas, fill: "#3B82F6" },
    { name: "Canceladas", value: data.estadisticas.canceladas, fill: "#EF4444" },
  ].filter(item => item.value > 0)

  const nombreCompleto = data.paciente 
    ? `${data.paciente.nombres} ${data.paciente.apellidos}`.split(' ')[0]
    : 'Paciente'

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            👋 ¡Hola, {nombreCompleto}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido a tu panel de control
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reserva-cita">
            <Button className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Agendar cita
            </Button>
          </Link>
          <Link href="/mis-citas">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              Ver historial
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Columna izquierda: Próxima cita */}
        <Card className="lg:row-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CalendarClock className="h-5 w-5" />
              Próxima Cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.proximaCita ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {format(parseISO(data.proximaCita.fecha_hora_inicio), "d", { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {format(parseISO(data.proximaCita.fecha_hora_inicio), "MMMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        {format(parseISO(data.proximaCita.fecha_hora_inicio), "HH:mm", { locale: es })}
                      </span>
                    </div>
                    {data.proximaCita.podologo_nombre && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Especialista:</span> {data.proximaCita.podologo_nombre}
                      </p>
                    )}
                    {data.proximaCita.motivo_cita && (
                      <p className="text-muted-foreground line-clamp-2">
                        <span className="font-medium">Motivo:</span> {data.proximaCita.motivo_cita}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {format(parseISO(data.proximaCita.fecha_hora_inicio), "EEEE", { locale: es })}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">No tienes citas próximas</p>
                <Link href="/reserva-cita">
                  <Button size="sm" className="gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    Agendar ahora
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats cards */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{data.estadisticas.totalCitas}</p>
                  <p className="text-xs text-muted-foreground">Total citas</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">{data.estadisticas.completadas}</p>
                  <p className="text-xs text-muted-foreground">Completadas</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{data.estadisticas.reservadas}</p>
                  <p className="text-xs text-muted-foreground">Reservadas</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CalendarClock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-red-600">{data.estadisticas.canceladas}</p>
                  <p className="text-xs text-muted-foreground">Canceladas</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico circular */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribución de Citas
            </CardTitle>
            <CardDescription>
              Resumen visual de tus citas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm">Completadas: {data.estadisticas.completadas}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Reservadas: {data.estadisticas.reservadas}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm">Canceladas: {data.estadisticas.canceladas}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay datos para mostrar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documentos y Recetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="h-7 w-7 text-purple-600" />
              </div>
              <div>
                <p className="text-4xl font-bold text-purple-600">{data.documentos}</p>
                <p className="text-sm text-muted-foreground">Documentos clínicos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-orange-100 flex items-center justify-center">
                <Pill className="h-7 w-7 text-orange-600" />
              </div>
              <div>
                <p className="text-4xl font-bold text-orange-600">{data.recetas}</p>
                <p className="text-sm text-muted-foreground">Recetas emitidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-teal-100 flex items-center justify-center">
                <Footprints className="h-7 w-7 text-teal-600" />
              </div>
              <div>
                <p className="text-4xl font-bold text-teal-600">{data.ortesis}</p>
                <p className="text-sm text-muted-foreground">Órtesis generadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Última Evaluación de Pies */}
      {data.ultimaEvaluacion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Footprints className="h-5 w-5 text-primary" />
              Última Evaluación de Pies
            </CardTitle>
            <CardDescription>
              Información de tu última consulta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pie Izquierdo */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">🦶 Pie Izquierdo</h4>
                {data.ultimaEvaluacion.pieIzquierdo.tipo && (
                  <p className="text-sm">
                    <span className="font-medium">Tipo:</span> {data.ultimaEvaluacion.pieIzquierdo.tipo}
                  </p>
                )}
                {data.ultimaEvaluacion.pieIzquierdo.notas && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.ultimaEvaluacion.pieIzquierdo.notas}
                  </p>
                )}
                {!data.ultimaEvaluacion.pieIzquierdo.tipo && !data.ultimaEvaluacion.pieIzquierdo.notas && (
                  <p className="text-sm text-muted-foreground">Sin información registrada</p>
                )}
              </div>

              {/* Pie Derecho */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">🦶 Pie Derecho</h4>
                {data.ultimaEvaluacion.pieDerecho.tipo && (
                  <p className="text-sm">
                    <span className="font-medium">Tipo:</span> {data.ultimaEvaluacion.pieDerecho.tipo}
                  </p>
                )}
                {data.ultimaEvaluacion.pieDerecho.notas && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.ultimaEvaluacion.pieDerecho.notas}
                  </p>
                )}
                {!data.ultimaEvaluacion.pieDerecho.tipo && !data.ultimaEvaluacion.pieDerecho.notas && (
                  <p className="text-sm text-muted-foreground">Sin información registrada</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

