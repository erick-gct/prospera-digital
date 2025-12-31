"use client"

import { useState, useEffect, useCallback } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Calendar, 
  FileText, 
  Pill, 
  Clock, 
  Loader2,
  ClipboardList,
  Eye
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiRoutes } from "@/lib/api-routes"
import { createClient } from "@/lib/supabase/cliente"
import { PatientAppointmentDetailModal } from "@/app/components/features/mis-citas/PatientAppointmentDetailModal"

interface CitaHistorial {
  id: number
  fecha_hora_inicio: string
  motivo_cita: string | null
  estado_id: number
  estado_cita: { id: number; nombre: string } | null
  observaciones_podologo: string | null
  procedimientos_realizados: string | null
  tiene_documentos: boolean
  tiene_recetas: boolean
  documentos_count: number
  recetas_count: number
}

export default function MisCitasPage() {
  const [citas, setCitas] = useState<CitaHistorial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedCitaId, setSelectedCitaId] = useState<number | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [filtroTiempo, setFiltroTiempo] = useState<string>("all")
  const [filtroEstado, setFiltroEstado] = useState<string>("all")

  // Obtener usuario logueado
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

  // Cargar citas del paciente
  const loadCitas = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(ApiRoutes.misCitas.myHistory(userId, filtroTiempo, filtroEstado))
      if (response.ok) {
        const data = await response.json()
        setCitas(data)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, filtroTiempo, filtroEstado])

  useEffect(() => {
    if (userId) {
      loadCitas()
    }
  }, [userId, filtroTiempo, filtroEstado, loadCitas])

  const handleViewDetail = (citaId: number) => {
    setSelectedCitaId(citaId)
    setIsDetailOpen(true)
  }

  // Helper para color del estado
  const getEstadoColor = (estadoId: number) => {
    switch (estadoId) {
      case 1: return "bg-blue-100 text-blue-800 border-blue-200" // Reservada
      case 2: return "bg-green-100 text-green-800 border-green-200" // Completada
      case 3: return "bg-red-100 text-red-800 border-red-200" // Cancelada
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          Mis Citas
        </h1>
        <p className="text-muted-foreground mt-1">
          Historial completo de tus citas médicas
        </p>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : citas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">No tienes citas registradas</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Cuando agendes una cita, aparecerá aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Tu Historial de Citas
                </CardTitle>
                <CardDescription>
                  {citas.length} cita{citas.length !== 1 ? 's' : ''} encontrada{citas.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="1">Reservada</SelectItem>
                    <SelectItem value="2">Completada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroTiempo} onValueChange={setFiltroTiempo}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por tiempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 meses hacia adelante</SelectItem>
                    <SelectItem value="6">6 meses hacia adelante</SelectItem>
                    <SelectItem value="all">Todo el historial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Timeline de citas */}
            <div className="relative">
              {/* Línea vertical del timeline */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

              <div className="space-y-6">
                {citas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay citas en este periodo</p>
                ) : (
                  citas.map((cita, index) => {
                  const citaDate = parseISO(cita.fecha_hora_inicio)
                  return (
                    <div key={cita.id} className="relative pl-10">
                      {/* Círculo del timeline */}
                      <div className={`absolute left-2 w-5 h-5 rounded-full border-2 
                        ${cita.estado_id === 2 ? 'bg-green-500 border-green-600' : 
                          cita.estado_id === 3 ? 'bg-red-400 border-red-500' : 
                          'bg-blue-500 border-blue-600'}
                      `} />

                      {/* Card de la cita */}
                      <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow
                        ${cita.estado_id === 3 ? 'opacity-60' : ''}
                      `}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Info principal */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(citaDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                              </span>
                              <Badge className={getEstadoColor(cita.estado_id)}>
                                {cita.estado_cita?.nombre || "Pendiente"}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(citaDate, "HH:mm", { locale: es })}
                              </span>
                              {cita.motivo_cita && (
                                <span className="truncate max-w-[200px]">
                                  {cita.motivo_cita}
                                </span>
                              )}
                            </div>

                            {/* Indicadores */}
                            <div className="flex items-center gap-3 text-xs">
                              {cita.tiene_documentos && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <FileText className="h-3 w-3" />
                                  {cita.documentos_count} doc{cita.documentos_count !== 1 ? 's' : ''}
                                </span>
                              )}
                              {cita.tiene_recetas && (
                                <span className="flex items-center gap-1 text-purple-600">
                                  <Pill className="h-3 w-3" />
                                  {cita.recetas_count} receta{cita.recetas_count !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botón ver detalle */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDetail(cita.id)}
                            className="gap-2"
                            disabled={cita.estado_id === 3}
                            title={cita.estado_id === 3 ? "No se puede acceder a citas canceladas" : "Ver detalle de la cita"}
                          >
                            <Eye className="h-4 w-4" />
                            {cita.estado_id === 3 ? "No disponible" : "Ver detalle"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }))
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalle */}
      <PatientAppointmentDetailModal
        citaId={selectedCitaId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  )
}
