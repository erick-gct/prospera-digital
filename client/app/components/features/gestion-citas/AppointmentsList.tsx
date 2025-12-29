"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, User, FileText, ClipboardEdit, CalendarX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Tipo de cita para gestión
export interface CitaGestion {
  id: string
  fecha_hora_inicio: string
  motivo_cita: string | null
  observaciones_paciente: string | null
  observaciones_podologo: string | null
  procedimientos_realizados: string | null
  estado_id: number
  paciente: {
    usuario_id: string
    nombres: string
    apellidos: string
    cedula: string
    telefono: string | null
    email: string | null
    fecha_nacimiento: string | null
  } | null
  estado_cita: {
    id: number
    nombre: string
  } | null
}

interface AppointmentsListProps {
  citas: CitaGestion[]
  isLoading: boolean
  onSelectCita: (cita: CitaGestion) => void
  selectedDate: Date
}

// Colores por estado
const estadoColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" }, // Pendiente
  2: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" }, // Completada
  3: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" }, // Cancelada
}

export function AppointmentsList({ citas, isLoading, onSelectCita, selectedDate }: AppointmentsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (citas.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <CalendarX className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600">No hay citas para este día</h3>
        <p className="text-gray-500 mt-2">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con conteo */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{citas.length}</span> cita{citas.length !== 1 && 's'} para {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Lista de citas */}
      <div className="space-y-3">
        {citas.map((cita) => {
          const citaTime = parseISO(cita.fecha_hora_inicio)
          const colors = estadoColors[cita.estado_id] || estadoColors[1]

          return (
            <div
              key={cita.id}
              className={cn(
                "p-4 rounded-xl border-2 bg-white transition-all hover:shadow-md",
                colors.border
              )}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info de la cita */}
                <div className="flex-1 space-y-2">
                  {/* Hora y estado */}
                  <div className="flex items-center gap-3">
                    <div className={cn("flex items-center gap-2 font-semibold text-lg", colors.text)}>
                      <Clock className="h-5 w-5" />
                      {format(citaTime, "HH:mm")}
                    </div>
                    <Badge variant="outline" className={cn("text-xs", colors.bg, colors.text, colors.border)}>
                      {cita.estado_cita?.nombre || "Pendiente"}
                    </Badge>
                  </div>

                  {/* Paciente */}
                  {cita.paciente && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {cita.paciente.nombres} {cita.paciente.apellidos}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        • C.I. {cita.paciente.cedula}
                      </span>
                    </div>
                  )}

                  {/* Motivo */}
                  {cita.motivo_cita && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{cita.motivo_cita}</span>
                    </div>
                  )}
                </div>

                {/* Botón de acción */}
                <Button
                  onClick={() => onSelectCita(cita)}
                  className="gap-2 shrink-0"
                  variant="default"
                >
                  <ClipboardEdit className="h-4 w-4" />
                  Registrar Información
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
