"use client"

import { useState, useEffect } from "react"
import { CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { startOfWeek, endOfWeek } from "date-fns"
import { createClient } from "@/lib/supabase/cliente"
import { ApiRoutes } from "@/lib/api-routes"
import { WeekSelector } from "@/app/components/features/agenda/WeekSelector"
import { AgendaCalendarView, Cita } from "@/app/components/features/agenda/AgendaCalendarView"

export default function AgendaPage() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [podologoId, setPodologoId] = useState<string | null>(null)

  // Obtener el ID del podólogo logueado
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setPodologoId(user.id)
      }
    }
    fetchUser()
  }, [])

  // Cargar citas cuando cambia la semana o el podólogo
  useEffect(() => {
    if (!podologoId) return

    const fetchCitas = async () => {
      try {
        setIsLoading(true)
        
        // Calcular inicio y fin de la semana
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
        
        // Ajustar para incluir todo el día final
        weekEnd.setHours(23, 59, 59, 999)

        const url = ApiRoutes.citas.byPodologo(
          podologoId,
          weekStart.toISOString(),
          weekEnd.toISOString()
        )

        const res = await fetch(url)
        
        if (!res.ok) {
          throw new Error("Error al cargar las citas")
        }

        const data = await res.json()
        setCitas(data)
      } catch (error) {
        console.error("Error fetching citas:", error)
        toast.error("Error al cargar las citas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCitas()
  }, [podologoId, selectedDate])

  const handleWeekChange = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="rounded-sm border bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <CalendarDays className="h-8 w-8" />
          Mi Agenda
        </h1>
        <p className="text-muted-foreground">
          Visualiza y gestiona todas tus citas programadas.
        </p>
      </div>

      {/* Contenedor Principal */}
      <div className="space-y-6">
        {/* Selector de Semana */}
        <WeekSelector 
          selectedDate={selectedDate} 
          onWeekChange={handleWeekChange} 
        />

        {/* Vista de Calendario */}
        <AgendaCalendarView 
          citas={citas}
          selectedDate={selectedDate}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
