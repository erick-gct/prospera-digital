"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/cliente"
import { ApiRoutes } from "@/lib/api-routes"
import { DateFilter } from "@/app/components/features/gestion-citas/DateFilter"
import { AppointmentsList, CitaGestion } from "@/app/components/features/gestion-citas/AppointmentsList"
import { AppointmentDetail } from "@/app/components/features/gestion-citas/AppointmentDetail"

type ViewMode = "list" | "detail"

export default function GestionCitasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [citas, setCitas] = useState<CitaGestion[]>([])
  const [selectedCita, setSelectedCita] = useState<CitaGestion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [podologoId, setPodologoId] = useState<string | null>(null)

  // Obtener ID del podólogo autenticado
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

  // Cargar citas cuando cambia la fecha o el podólogo
  useEffect(() => {
    const fetchCitas = async () => {
      if (!podologoId) return

      setIsLoading(true)
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const response = await fetch(ApiRoutes.citas.byDate(podologoId, dateStr))
        
        if (response.ok) {
          const data = await response.json()
          setCitas(data)
        } else {
          console.error("Error fetching citas:", response.status)
          setCitas([])
        }
      } catch (error) {
        console.error("Error fetching citas:", error)
        setCitas([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCitas()
  }, [podologoId, selectedDate])

  // Manejar selección de cita
  const handleSelectCita = (cita: CitaGestion) => {
    setSelectedCita(cita)
    setViewMode("detail")
  }

  // Volver a la lista
  const handleBack = () => {
    setViewMode("list")
    setSelectedCita(null)
  }

  // Manejar cambio de fecha
  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    // Volver a la lista si estaba en detalle
    if (viewMode === "detail") {
      setViewMode("list")
      setSelectedCita(null)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Gestión de Citas
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las citas y registra la información de cada consulta
          </p>
        </div>
      </div>

      {/* Vista: Lista de citas */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {/* Filtro de fecha */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <DateFilter 
              selectedDate={selectedDate} 
              onDateChange={handleDateChange} 
            />
          </div>

          {/* Lista de citas */}
          <AppointmentsList
            citas={citas}
            isLoading={isLoading}
            onSelectCita={handleSelectCita}
            selectedDate={selectedDate}
          />
        </div>
      )}

      {/* Vista: Detalle de cita */}
      {viewMode === "detail" && selectedCita && (
        <AppointmentDetail
          cita={selectedCita}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
