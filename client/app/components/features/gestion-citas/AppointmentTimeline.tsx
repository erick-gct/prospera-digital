"use client"

import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  User,
  GitCommit
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ApiRoutes } from "@/lib/api-routes"

interface TimelineEvent {
  id: number
  fecha: string
  titulo: string
  descripcion: string
  icon: string
  usuario: string
  detalles: {
    antes: any
    despues: any
  }
}

interface AppointmentTimelineProps {
  citaId: string
  className?: string
}

export function AppointmentTimeline({ citaId, className }: AppointmentTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(ApiRoutes.citas.timeline(citaId))
        if (response.ok) {
          const data = await response.json()
          setEvents(data)
        }
      } catch (error) {
        console.error("Error fetching timeline:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (citaId) {
      fetchTimeline()
    }
  }, [citaId])

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
        <GitCommit className="h-8 w-8 mb-2 opacity-50" />
        <p>No hay historial disponible</p>
      </div>
    )
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'calendar-check': return <Calendar className="h-4 w-4" />
      case 'check-circle': return <CheckCircle2 className="h-4 w-4" />
      case 'x-circle': return <XCircle className="h-4 w-4" />
      case 'clock': return <Clock className="h-4 w-4" />
      case 'edit': return <Edit3 className="h-4 w-4" />
      default: return <GitCommit className="h-4 w-4" />
    }
  }

  const getColor = (iconName: string) => {
     switch (iconName) {
      case 'calendar-check': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'check-circle': return 'bg-green-100 text-green-600 border-green-200'
      case 'x-circle': return 'bg-red-100 text-red-600 border-red-200'
      case 'clock': return 'bg-orange-100 text-orange-600 border-orange-200'
      default: return 'bg-slate-100 text-slate-600 border-slate-200'
    } 
  }

  return (
    <ScrollArea className={`h-full pr-4 ${className}`}>
      <div className="relative space-y-0 pl-2">
        {/* Línea conectora vertical */}
        <div className="absolute left-[19px] top-2 bottom-4 w-px bg-slate-200" />

        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0 group">
            
            {/* Icono */}
            <div className={`relative z-10 flex-none w-9 h-9 rounded-full border-2 flex items-center justify-center bg-white ${getColor(event.icon)} shadow-sm`}>
              {getIcon(event.icon)}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-slate-900 leading-none">
                  {event.titulo}
                </p>
                <time className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                  {format(parseISO(event.fecha), "d MMM, HH:mm", { locale: es })}
                </time>
              </div>
              
              <p className="text-sm text-slate-600 mb-1">
                {event.descripcion}
              </p>

              {/* Usuario responsable */}
              {event.usuario && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 bg-slate-50 inline-flex px-2 py-0.5 rounded-full border border-slate-100">
                    <User className="h-3 w-3" />
                    <span>{event.usuario}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
