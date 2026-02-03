"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Phone, Mail, FileText, Info } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { AppointmentTimeline } from "./AppointmentTimeline"
import { CitaGestion } from "./AppointmentsList"

interface AppointmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cita: CitaGestion | null
}

export function AppointmentDetailsDialog({ open, onOpenChange, cita }: AppointmentDetailsDialogProps) {
  if (!cita) return null

  // Helper para estado
  const getEstadoBadge = (estadoId: number, nombre: string) => {
    const colors: Record<number, string> = {
      1: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      2: "bg-green-100 text-green-700 hover:bg-green-100",
      3: "bg-red-100 text-red-700 hover:bg-red-100",
    }
    return <Badge className={colors[estadoId] || ""}>{nombre}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl flex items-center gap-3">
                Detalles de la Cita
                {cita.estado_cita && getEstadoBadge(cita.estado_id, cita.estado_cita.nombre)}
              </DialogTitle>
              <DialogDescription>
                ID: #{cita.id}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end text-sm text-muted-foreground bg-slate-50 px-3 py-2 rounded-lg">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(cita.fecha_hora_inicio), "EEEE d 'de' MMMM", { locale: es })}
                </span>
                <span className="text-lg font-bold text-primary">
                    {format(parseISO(cita.fecha_hora_inicio), "h:mm a")}
                </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 mt-6 flex-1 min-h-0">
          
          {/* Columna Izquierda: Información Estática */}
          <div className="w-full md:w-1/2 space-y-6 overflow-y-auto pr-2">
            
            {/* Paciente */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                <User className="h-4 w-4" />
                Información del Paciente
              </h4>
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm border border-slate-100">
                <p className="font-medium text-base">
                  {cita.paciente?.nombres} {cita.paciente?.apellidos}
                </p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs uppercase tracking-wider text-slate-400">Cédula</span>
                        <span>{cita.paciente?.cedula || "N/A"}</span>
                    </div>
                </div>
                <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{cita.paciente?.telefono || "Sin teléfono"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{cita.paciente?.email || "Sin email"}</span>
                    </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Motivo y Observaciones */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 text-primary mb-2">
                  <Info className="h-4 w-4" />
                  Motivo de Consulta
                </h4>
                <p className="text-sm text-slate-600 bg-white border p-3 rounded-md min-h-[60px]">
                  {cita.motivo_cita || "No especificado"}
                </p>
              </div>

              {cita.observaciones_podologo && (
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-primary mb-2">
                      <FileText className="h-4 w-4" />
                      Notas del Especialista
                    </h4>
                    <p className="text-sm text-slate-600 bg-blue-50/50 border border-blue-100 p-3 rounded-md">
                      {cita.observaciones_podologo}
                    </p>
                  </div>
              )}
            </div>

          </div>

          {/* Divisor Vertical (Desktop) */}
          <div className="hidden md:block w-px bg-slate-200" />

          {/* Columna Derecha: Timeline */}
          <div className="w-full md:w-1/2 flex flex-col min-h-[300px]">
             <h4 className="font-semibold text-sm flex items-center gap-2 text-primary mb-4">
                <Info className="h-4 w-4" />
                Historial de Cambios (Trazabilidad)
              </h4>
             <div className="flex-1 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
                <AppointmentTimeline citaId={cita.id} />
             </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
