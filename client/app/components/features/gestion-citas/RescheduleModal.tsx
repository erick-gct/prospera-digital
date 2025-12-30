"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Clock, CalendarClock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface RescheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  citaId: string
  nombrePaciente: string
  fechaActual: Date
  onSuccess: () => void
}

// Generar slots de horarios según día (L-V: 8AM-5PM, S-D: 8AM-4PM)
const generateTimeSlots = (selectedDate?: Date) => {
  const slots: string[] = []
  const startHour = 8
  
  let endHour = 17 // Por defecto lunes a viernes
  if (selectedDate) {
    const dayOfWeek = selectedDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      endHour = 16 // Fines de semana: hasta las 4pm
    }
  }

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      slots.push(timeString)
    }
  }

  return slots
}

export function RescheduleModal({ 
  open, 
  onOpenChange, 
  citaId, 
  nombrePaciente, 
  fechaActual,
  onSuccess 
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const timeSlots = generateTimeSlots(selectedDate)

  // Deshabilitar días pasados
  const disabledDays = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime("") // Reset time when date changes
  }

  const handleConfirmReschedule = async () => {
    if (!selectedDate || !selectedTime) return

    setIsLoading(true)
    try {
      // Crear la nueva fecha/hora combinada
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours, minutes, 0, 0)

      const response = await fetch(ApiRoutes.citas.reschedule(citaId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevaFechaHora: newDateTime.toISOString() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al reagendar')
      }

      toast.success("Cita reagendada correctamente")
      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : "Error al reagendar la cita")
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const handleClose = () => {
    setSelectedDate(undefined)
    setSelectedTime("")
    onOpenChange(false)
  }

  const canReschedule = selectedDate && selectedTime

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Reagendar Cita
            </DialogTitle>
            <DialogDescription>
              Selecciona una nueva fecha y hora para la cita de <span className="font-medium">{nombrePaciente}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Fecha actual */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Fecha actual de la cita:</p>
              <p className="font-medium">
                {format(fechaActual, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>

            {/* Selector de fecha y hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Calendario */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Nueva Fecha
                </label>
                <div className="border rounded-lg p-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    disabled={disabledDays}
                    locale={es}
                    className="rounded-md"
                  />
                </div>
              </div>

              {/* Selector de hora */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Nueva Hora
                </label>
                {selectedDate ? (
                  <div className="border rounded-lg p-3 h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "text-xs",
                            selectedTime === time && "ring-2 ring-primary ring-offset-2"
                          )}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-6 h-[300px] flex items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">
                      Selecciona una fecha primero para ver los horarios disponibles
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen de nueva fecha */}
            {canReschedule && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Nueva fecha y hora:</p>
                <p className="font-medium text-primary">
                  {format(selectedDate!, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} a las {selectedTime}
                </p>
              </div>
            )}

            {/* Botón de reagendar */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={() => setShowConfirmDialog(true)}
                disabled={!canReschedule || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                Reagendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar reagendamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              La cita de <span className="font-semibold">{nombrePaciente}</span> será reprogramada para:
              <br />
              <span className="font-semibold text-primary">
                {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} a las {selectedTime}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReschedule} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reagendando...
                </>
              ) : (
                "Confirmar Reagendamiento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
