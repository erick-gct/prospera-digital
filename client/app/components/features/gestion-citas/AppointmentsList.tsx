"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, User, FileText, ClipboardEdit, CalendarX, CalendarClock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ApiRoutes } from "@/lib/api-routes"
import { RescheduleModal } from "./RescheduleModal"

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
  onRefresh: () => void
}

// Colores por estado
const estadoColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  2: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  3: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
}

// Opciones de estado
const ESTADO_OPTIONS = [
  { value: "1", label: "Reservada" },
  { value: "2", label: "Completada" },
]

export function AppointmentsList({ citas, isLoading, onSelectCita, selectedDate, onRefresh }: AppointmentsListProps) {
  const [loadingCitaId, setLoadingCitaId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    citaId: string
    nombrePaciente: string
    nuevoEstado: number
    accion: string
  }>({ open: false, citaId: "", nombrePaciente: "", nuevoEstado: 0, accion: "" })

  // Estado para modal de reagendamiento
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean
    cita: CitaGestion | null
  }>({ open: false, cita: null })

  const handleChangeStatus = async (citaId: string, estadoId: number) => {
    setLoadingCitaId(citaId)
    try {
      const response = await fetch(ApiRoutes.citas.updateStatus(citaId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al cambiar estado')
      }

      const result = await response.json()
      toast.success(`Cita ${result.nuevo_estado.toLowerCase()}`)
      onRefresh()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado")
    } finally {
      setLoadingCitaId(null)
      setConfirmDialog({ open: false, citaId: "", nombrePaciente: "", nuevoEstado: 0, accion: "" })
    }
  }

  const openConfirmDialog = (cita: CitaGestion, nuevoEstado: number) => {
    const acciones: Record<number, string> = {
      1: "regresar a Reservada",
      2: "marcar como Completada",
      3: "cancelar",
    }
    setConfirmDialog({
      open: true,
      citaId: cita.id,
      nombrePaciente: cita.paciente ? `${cita.paciente.nombres} ${cita.paciente.apellidos}` : "Paciente",
      nuevoEstado,
      accion: acciones[nuevoEstado] || "cambiar estado",
    })
  }

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
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{citas.length}</span> cita{citas.length !== 1 && 's'} para {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>

        <div className="space-y-3">
          {citas.map((cita) => {
            const citaTime = parseISO(cita.fecha_hora_inicio)
            const estadoId = typeof cita.estado_id === 'string' ? parseInt(cita.estado_id, 10) : cita.estado_id
            const colors = estadoColors[estadoId] || estadoColors[1]
            const isUpdating = loadingCitaId === cita.id

            return (
              <div
                key={cita.id}
                className={cn(
                  "p-4 rounded-xl border-2 bg-white transition-all hover:shadow-md",
                  colors.border
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex items-center gap-2 font-semibold text-lg", colors.text)}>
                        <Clock className="h-5 w-5" />
                        {format(citaTime, "HH:mm")}
                      </div>
                      <Badge variant="outline" className={cn("text-xs", colors.bg, colors.text, colors.border)}>
                        {cita.estado_cita?.nombre || "Pendiente"}
                      </Badge>
                    </div>

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

                    {cita.motivo_cita && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{cita.motivo_cita}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones en dos filas */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* Fila 1: Botón principal */}
                    <Button
                      onClick={() => onSelectCita(cita)}
                      className="gap-2 w-full"
                      variant={estadoId === 3 ? "outline" : "default"}
                      disabled={isUpdating || estadoId === 3}
                      title={estadoId === 3 ? "No se puede acceder a citas canceladas" : "Acceder a la cita"}
                    >
                      <ClipboardEdit className="h-4 w-4" />
                      {estadoId === 3 ? "No disponible" : "Acceder a la Cita"}
                    </Button>

                    {/* Fila 2: Acciones secundarias */}
                    <div className="flex items-center gap-2">


                      {/* Select de estado */}
                      {estadoId !== 3 && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground">Estado</span>
                          <Select
                            value={estadoId.toString()}
                            onValueChange={(value) => openConfirmDialog(cita, parseInt(value, 10))}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-[100px] h-7 text-xs">
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADO_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-xs">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                                            {/* Botón de reagendar (solo si está reservada) */}
                      {estadoId === 1 && (
         
                          <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-8 text-xs flex-1"
                          onClick={() => setRescheduleModal({ open: true, cita })}
                          disabled={isUpdating}
                          title="Reagendar cita"
                        >
                          <CalendarClock className="h-4 w-4" />
                          <span className="hidden sm:inline">Reagendar</span>
                        </Button>
                    
                          
                      )}

                      {/* Botón cancelar */}
                      {estadoId !== 3 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => openConfirmDialog(cita, 3)}
                          disabled={isUpdating}
                          title="Cancelar cita"
                        >
                          <CalendarX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.nuevoEstado === 3 ? "¿Cancelar esta cita?" : "¿Cambiar estado de la cita?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.nuevoEstado === 3 ? (
                <>
                  Estás a punto de <span className="font-semibold text-red-600">cancelar</span> la cita de{" "}
                  <span className="font-semibold">{confirmDialog.nombrePaciente}</span>.
                </>
              ) : (
                <>
                  Estás a punto de <span className="font-semibold">{confirmDialog.accion}</span> la cita de{" "}
                  <span className="font-semibold">{confirmDialog.nombrePaciente}</span>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleChangeStatus(confirmDialog.citaId, confirmDialog.nuevoEstado)}
              className={confirmDialog.nuevoEstado === 3 ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {confirmDialog.nuevoEstado === 3 ? "Sí, cancelar cita" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Reagendamiento */}
      {rescheduleModal.cita && (
        <RescheduleModal
          open={rescheduleModal.open}
          onOpenChange={(open) => setRescheduleModal({ ...rescheduleModal, open })}
          citaId={rescheduleModal.cita.id}
          nombrePaciente={
            rescheduleModal.cita.paciente 
              ? `${rescheduleModal.cita.paciente.nombres} ${rescheduleModal.cita.paciente.apellidos}`
              : "Paciente"
          }
          fechaActual={parseISO(rescheduleModal.cita.fecha_hora_inicio)}
          onSuccess={onRefresh}
        />
      )}
    </>
  )
}
