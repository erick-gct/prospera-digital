"use client"

import { useState, useEffect } from "react"
import { PatientFilters } from "@/app/components/features/pacientes/PatientFilters"
import { PatientsTable } from "@/app/components/features/pacientes/PatientsTable"
import { Users } from "lucide-react"
import { toast } from "sonner"
import { ApiRoutes } from "@/lib/api-routes"

export default function PatientsPage() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para filtros
  const [cedulaQuery, setCedulaQuery] = useState("")
  const [apellidoQuery, setApellidoQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")

  // Función para cargar datos
  const fetchPatients = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (cedulaQuery) params.append("cedula", cedulaQuery)
      if (apellidoQuery) params.append("apellido", apellidoQuery)
      if (statusFilter !== "todos") params.append("estado", statusFilter)

      const res = await fetch(`${ApiRoutes.pacientes.base}?${params.toString()}`)
      
      if (!res.ok) throw new Error("Error al cargar pacientes")
      
      const patients = await res.json()
      setData(patients)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar la lista de pacientes")
    } finally {
      setIsLoading(false)
    }
  }

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients()
    }, 400) // 400ms para dar tiempo a escribir

    return () => clearTimeout(timer)
  }, [cedulaQuery, apellidoQuery, statusFilter])

  return (
    <div className="rounded-sm border bg-white p-6 space-y-6 ">
      {/* Header con Título e Icono */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Users className="h-8 w-8" />
          Gestión de Pacientes
        </h1>
        <p className="text-muted-foreground">
          Administra la información, estados e historiales de tus pacientes registrados.
        </p>
      </div>

      {/* Contenedor Principal Blanco */}
      <div className=" bg-white p-6 shadow-sm">
        <div className="space-y-6">
          
          {/* Filtros */}
          <div className="rounded-lg bg-gray-50 p-4 border">
            <PatientFilters 
              onSearchCedulaChange={setCedulaQuery}
              onSearchApellidoChange={setApellidoQuery}
              onStatusChange={setStatusFilter} 
            />
          </div>

          {/* Tabla */}
          <PatientsTable 
            data={data} 
            isLoading={isLoading} 
            onDataUpdate={fetchPatients}
          />
          
        </div>
      </div>
    </div>
  )
}