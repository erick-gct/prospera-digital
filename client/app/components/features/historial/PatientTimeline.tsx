"use client"

import { useState, useEffect, useCallback } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, FileText, Pill, File, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ApiRoutes } from "@/lib/api-routes"
import { HistorialDetailModal } from "./HistorialDetailModal"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface CitaHistorial {
  id: number
  fecha_hora_inicio: string
  motivo_cita: string | null
  estado_id: number
  observaciones_podologo: string | null
  procedimientos_realizados: string | null
  estado_cita: {
    id: number
    nombre: string
  } | null
  tiene_documentos: boolean
  tiene_recetas: boolean
  documentos_count: number
  recetas_count: number
}

interface PatientTimelineProps {
  pacienteId: string
}

// Colores por estado
const estadoColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  2: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  3: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
}

export function PatientTimeline({ pacienteId }: PatientTimelineProps) {
  const [citas, setCitas] = useState<CitaHistorial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCitaId, setSelectedCitaId] = useState<number | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(ApiRoutes.historial.patientHistory(pacienteId))
      if (response.ok) {
        const data = await response.json()
        setCitas(data)
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pacienteId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (citas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay citas registradas para este paciente</p>
      </div>
    )
  }

  return (
    <>
      <div className="relative pl-6 space-y-4 py-4">
        {/* Línea de tiempo vertical */}
        <div className="absolute left-2 top-6 bottom-6 w-0.5 bg-border" />

        {citas.map((cita, index) => {
          const citaDate = parseISO(cita.fecha_hora_inicio)
          const estadoId = cita.estado_id
          const colors = estadoColors[estadoId] || estadoColors[1]

          return (
            <div key={cita.id} className="relative">
              {/* Punto en la línea de tiempo */}
              <div className={`absolute -left-4 w-4 h-4 rounded-full border-2 ${colors.bg} ${colors.border}`} />

              <div className={`ml-4 p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}>
                {/* Encabezado */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Calendar className="h-4 w-4" />
                      {format(citaDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(citaDate, "HH:mm")}
                    </div>
                  </div>
                  <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border}`}>
                    {cita.estado_cita?.nombre || "Pendiente"}
                  </Badge>
                </div>

                {/* Motivo */}
                {cita.motivo_cita && (
                  <p className="text-sm mt-2">
                    <span className="font-medium">Motivo:</span> {cita.motivo_cita}
                  </p>
                )}

                {/* Indicadores */}
                <div className="flex items-center gap-3 mt-3">
                  {cita.tiene_documentos && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <File className="h-3 w-3" />
                      {cita.documentos_count} doc{cita.documentos_count !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {cita.tiene_recetas && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Pill className="h-3 w-3" />
                      {cita.recetas_count} receta{cita.recetas_count !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Botón ver detalle */}
                <div className="mt-3 pt-3 border-t border-current/10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setSelectedCitaId(cita.id)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalle completo
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de detalle */}
      <HistorialDetailModal
        citaId={selectedCitaId}
        open={selectedCitaId !== null}
        onOpenChange={(open) => !open && setSelectedCitaId(null)}
      />
    </>
  )
}
