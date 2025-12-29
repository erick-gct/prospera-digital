"use client"

import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay,
  isPast,
  isToday,
  parseISO
} from "date-fns"
import { es } from "date-fns/locale"
import { Clock, User, FileText, CalendarX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Tipo para la cita que viene del backend
export interface Cita {
  id: string
  fecha_hora_inicio: string
  motivo_cita: string | null
  observaciones_paciente: string | null
  estado_id: number
  paciente: {
    usuario_id: string
    nombres: string
    apellidos: string
    cedula: string
  } | null
  estado_cita: {
    id: number
    nombre: string
  } | null
}

interface AgendaCalendarViewProps {
  citas: Cita[]
  selectedDate: Date
  isLoading: boolean
}

// Colores para estados de cita
const estadoColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" }, // Pendiente
  2: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" }, // Completada
  3: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" }, // Cancelada
}

export function AgendaCalendarView({ citas, selectedDate, isLoading }: AgendaCalendarViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Agrupar citas por día
  const citasByDay = daysOfWeek.map(day => {
    const dayCitas = citas.filter(cita => {
      const citaDate = parseISO(cita.fecha_hora_inicio)
      return isSameDay(citaDate, day)
    })
    return { day, citas: dayCitas }
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    )
  }

  const hasCitas = citas.length > 0

  // Separar días laborales (Lun-Vie) y fin de semana (Sab-Dom)
  const weekdays = citasByDay.slice(0, 5) // Lunes a Viernes
  const weekend = citasByDay.slice(5, 7)  // Sábado y Domingo

  // Componente para renderizar un día
  const DayCard = ({ day, dayCitas }: { day: Date; dayCitas: Cita[] }) => {
    const dayIsPast = isPast(day) && !isToday(day)
    const dayIsToday = isToday(day)
    const isWeekend = day.getDay() === 0 || day.getDay() === 6

    return (
      <div
        className={cn(
          "rounded-xl border-2 overflow-hidden transition-all",
          dayIsToday && "border-primary shadow-lg shadow-primary/10",
          dayIsPast && "opacity-60",
          !dayIsToday && !dayIsPast && "border-gray-200",
          isWeekend && !dayIsToday && "border-amber-200"
        )}
      >
        {/* Header del día */}
        <div
          className={cn(
            "px-3 py-2 text-center border-b",
            dayIsToday && "bg-primary text-primary-foreground",
            dayIsPast && "bg-gray-100 text-gray-500",
            !dayIsToday && !dayIsPast && !isWeekend && "bg-gray-50",
            !dayIsToday && !dayIsPast && isWeekend && "bg-amber-50"
          )}
        >
          <p className="text-xs uppercase font-medium">
            {format(day, "EEE", { locale: es })}
          </p>
          <p className={cn(
            "text-lg font-bold",
            dayIsToday && "text-primary-foreground",
            dayIsPast && "text-gray-500"
          )}>
            {format(day, "d")}
          </p>
        </div>

        {/* Citas del día */}
        <div className="p-2 space-y-2 min-h-[120px] bg-white">
          {dayCitas.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs py-4">
              Sin citas
            </div>
          ) : (
            dayCitas.map(cita => {
              const citaDate = parseISO(cita.fecha_hora_inicio)
              const citaIsPast = isPast(citaDate)
              const colors = estadoColors[cita.estado_id] || estadoColors[1]

              return (
                <div
                  key={cita.id}
                  className={cn(
                    "p-2 rounded-lg border text-xs transition-all hover:shadow-md cursor-pointer",
                    colors.bg,
                    colors.border,
                    citaIsPast && "opacity-70"
                  )}
                >
                  {/* Hora */}
                  <div className={cn("flex items-center gap-1 font-semibold mb-1", colors.text)}>
                    <Clock className="h-3 w-3" />
                    {format(citaDate, "HH:mm")}
                  </div>

                  {/* Paciente */}
                  {cita.paciente && (
                    <div className="flex items-center gap-1 text-gray-700 truncate">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {cita.paciente.nombres} {cita.paciente.apellidos}
                      </span>
                    </div>
                  )}

                  {/* Motivo */}
                  {cita.motivo_cita && (
                    <div className="flex items-start gap-1 text-gray-500 mt-1">
                      <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{cita.motivo_cita}</span>
                    </div>
                  )}

                  {/* Badge de estado */}
                  {cita.estado_cita && (
                    <Badge 
                      variant="outline" 
                      className={cn("mt-2 text-[10px]", colors.text, colors.border)}
                    >
                      {cita.estado_cita.nombre}
                    </Badge>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Días laborales (Lunes a Viernes) */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Días laborales</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {weekdays.map(({ day, citas: dayCitas }) => (
            <DayCard key={day.toISOString()} day={day} dayCitas={dayCitas} />
          ))}
        </div>
      </div>

      {/* Fin de semana (Sábado y Domingo) */}
      <div>
        <p className="text-xs font-medium text-amber-600 mb-2 uppercase tracking-wide">Fin de semana</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:max-w-xl md:mx-auto">
          {weekend.map(({ day, citas: dayCitas }) => (
            <DayCard key={day.toISOString()} day={day} dayCitas={dayCitas} />
          ))}
        </div>
      </div>

      {/* Empty state cuando no hay citas en toda la semana */}
      {!hasCitas && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <CalendarX className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-600">No hay citas esta semana</h3>
          <p className="text-gray-500 text-sm mt-1">
            Las citas agendadas aparecerán aquí
          </p>
        </div>
      )}

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Pendiente</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Completada</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Cancelada</span>
        </div>
      </div>
    </div>
  )
}
