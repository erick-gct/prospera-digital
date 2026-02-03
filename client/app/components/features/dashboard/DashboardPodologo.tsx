"use client"

import { useState, useEffect, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Calendar, 
  Clock, 
  Users,
  CheckCircle2,
  XCircle,
  CalendarClock,
  BarChart3,
  Loader2,
  UserCheck,
  UserX,
  ClipboardList,
  CalendarDays,
  FileText,
  Pill
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pie, PieChart, Cell } from "recharts"
import { ApiRoutes } from "@/lib/api-routes"
import { createClient } from "@/lib/supabase/cliente"

import PodologoBI from "./PodologoBI"

interface DashboardData {
  podologo: {
    nombres: string
    apellidos: string
  } | null
  mesSeleccionado: {
    month: number
    year: number
  }
  estadisticas: {
    totalCitas: number
    completadas: number
    reservadas: number
    canceladas: number
  }
  pacientes: {
    total: number
    activos: number
    inactivos: number
  }
  documentosMes: number
  recetasMes: number
  citasHoy: number
  citasHoyDetalles: {
    id: number
    hora: string
    paciente: string
    motivo: string | null
    estadoId: number
  }[]
  ultimaCitaModificada: {
    id: number
    fecha_hora_inicio: string
    fecha_modificacion: string
    motivo_cita: string | null
    paciente_nombre: string | null
    estado_cita: { nombre: string } | null
  } | null
  ultimoPacienteAtendido: {
    nombre: string
    fecha: string
  } | null
  biAnalytics?: {
    topPatologias: { name: string; value: number }[];
    topMedicamentos: { name: string; value: number }[];
    distribucionMotivos: { name: string; value: number }[];
    semanalHeatmap: { day: string; hour: number; value: number }[];
    tasaRetencion: number;
  }
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

// Generar opciones de meses (12 pasados + 6 futuros)
function generateMonthOptions() {
  const options = []
  const now = new Date()
  // 6 meses futuros
  for (let i = 6; i >= 1; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    options.push({
      value: `${date.getMonth() + 1}-${date.getFullYear()}`,
      label: format(date, "MMMM yyyy", { locale: es }),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    })
  }
  // Mes actual + 12 pasados
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: `${date.getMonth() + 1}-${date.getFullYear()}`,
      label: format(date, "MMMM yyyy", { locale: es }),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    })
  }
  return options
}

export function DashboardPodologo() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  const monthOptions = useMemo(() => generateMonthOptions(), [])

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

  // Inicializar mes actual
  useEffect(() => {
    if (monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[0].value)
    }
  }, [monthOptions, selectedMonth])

  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboard = async () => {
      if (!userId || !selectedMonth) return

      const [month, year] = selectedMonth.split('-').map(Number)
      
      setIsLoading(true)
      try {
        const response = await fetch(ApiRoutes.dashboard.podologo(userId, month, year))
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
  }, [userId, selectedMonth])

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const chartData = [
    { name: "Completadas", value: data.estadisticas.completadas, fill: "#22C55E" },
    { name: "Reservadas", value: data.estadisticas.reservadas, fill: "#3B82F6" },
    { name: "Canceladas", value: data.estadisticas.canceladas, fill: "#EF4444" },
  ].filter(item => item.value > 0)

  const nombreCompleto = data.podologo 
    ? `Dr. ${data.podologo.nombres}`
    : 'Especialista'

  const selectedMonthLabel = monthOptions.find(o => o.value === selectedMonth)?.label || ""

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            👋 ¡Hola, {nombreCompleto}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Panel de control del especialista
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">{data.citasHoy} citas hoy</span>
        </div>
      </div>

      {/* BI Analytics Section - Visible si hay datos */}
      {data.biAnalytics && (
        <PodologoBI data={data.biAnalytics} />
      )}

      {/* Grid principal con filtro a la izquierda */}
      <div className="grid gap-6 lg:grid-cols-4">
        
        {/* Columna izquierda: Filtro y resumen */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Filtro de Mes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Resumen del Mes
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-lg">{data.estadisticas.totalCitas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Completadas
                  </span>
                  <span className="font-bold text-green-600">{data.estadisticas.completadas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 flex items-center gap-1">
                    <CalendarClock className="h-4 w-4" /> Reservadas
                  </span>
                  <span className="font-bold text-blue-600">{data.estadisticas.reservadas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Canceladas
                  </span>
                  <span className="font-bold text-red-600">{data.estadisticas.canceladas}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats cards */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{data.estadisticas.totalCitas}</p>
                  <p className="text-xs text-muted-foreground">Total {selectedMonthLabel}</p>
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
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribución de Citas - {selectedMonthLabel}
            </CardTitle>
            <CardDescription>
              Resumen visual de las citas del mes seleccionado
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
                <p>No hay citas en este mes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sección inferior: Pacientes y Actividad Reciente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pacientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Pacientes Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary/5 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary">{data.pacientes.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="flex justify-center mb-1">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{data.pacientes.activos}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="flex justify-center mb-1">
                  <UserX className="h-5 w-5 text-gray-500" />
                </div>
                <p className="text-2xl font-bold text-gray-500">{data.pacientes.inactivos}</p>
                <p className="text-xs text-muted-foreground">Inactivos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Citas de Hoy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Citas de Hoy ({data.citasHoy})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.citasHoyDetalles && data.citasHoyDetalles.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {data.citasHoyDetalles.map(cita => (
                  <div 
                    key={cita.id} 
                    className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                      cita.estadoId === 2 ? 'bg-green-50' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{cita.paciente}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {cita.motivo || 'Sin motivo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${
                        cita.estadoId === 2 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {format(parseISO(cita.hora), "HH:mm")}
                      </span>
                      {cita.estadoId === 2 && (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay citas programadas para hoy
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Última cita modificada */}
            {data.ultimaCitaModificada ? (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Última Cita Modificada
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Paciente:</span> {data.ultimaCitaModificada.paciente_nombre || "N/A"}</p>
                  <p><span className="text-muted-foreground">Fecha cita:</span> {format(parseISO(data.ultimaCitaModificada.fecha_hora_inicio), "d 'de' MMMM, HH:mm", { locale: es })}</p>
                  <p><span className="text-muted-foreground">Estado:</span> {data.ultimaCitaModificada.estado_cita?.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Modificada {format(parseISO(data.ultimaCitaModificada.fecha_modificacion), "d MMM, HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay citas recientes</p>
            )}

            {/* Último paciente atendido */}
            {data.ultimoPacienteAtendido && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  Último Paciente Atendido
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{data.ultimoPacienteAtendido.nombre}</p>
                  <p className="text-muted-foreground">
                    {format(parseISO(data.ultimoPacienteAtendido.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documentos y Recetas del Mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="h-7 w-7 text-purple-600" />
              </div>
              <div>
                <p className="text-4xl font-bold text-purple-600">{data.documentosMes}</p>
                <p className="text-sm text-muted-foreground">Documentos subidos - {selectedMonthLabel}</p>
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
                <p className="text-4xl font-bold text-orange-600">{data.recetasMes}</p>
                <p className="text-sm text-muted-foreground">Recetas emitidas - {selectedMonthLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
