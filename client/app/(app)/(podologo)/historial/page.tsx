"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, User, Calendar, FileText, ClipboardList, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ApiRoutes } from "@/lib/api-routes"
import { PatientTimeline } from "@/app/components/features/historial/PatientTimeline"

interface Patient {
  usuario_id: string
  cedula: string
  nombres: string
  apellidos: string
  telefono: string | null
  email: string | null
  fecha_nacimiento: string | null
  enfermedades: string | null
  tipo_sangre: string | null
  ultima_observacion: string | null
  total_citas: number
}

// Helper para calcular edad
function calculateAge(dateString: string | null) {
  if (!dateString) return null
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export default function HistorialPage() {
  const [searchCedula, setSearchCedula] = useState("")
  const [searchApellido, setSearchApellido] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // ... (rest of the state and logic remains same until JSX)

  // Búsqueda con debounce
  const searchPatients = useCallback(async (cedula: string, apellido: string) => {
    if (cedula.length < 2 && apellido.length < 2) {
      setPatients([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(ApiRoutes.historial.searchPatients(cedula, apellido))
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
        setHasSearched(true)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchCedula, searchApellido)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchCedula, searchApellido, searchPatients])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          Historial Clínico de Citas
        </h1>
        <p className="text-muted-foreground mt-1">
          Consulta el historial de citas por paciente
        </p>
      </div>

      {/* Buscador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Paciente
          </CardTitle>
          <CardDescription>
            Busca por cédula o apellido del paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda por cédula */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cédula..."
                value={searchCedula}
                onChange={(e) => setSearchCedula(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            {/* Búsqueda por apellido */}
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por apellido..."
                value={searchApellido}
                onChange={(e) => setSearchApellido(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            {isSearching && (
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {hasSearched && patients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No se encontraron pacientes</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Intenta con otro número de cédula
            </p>
          </CardContent>
        </Card>
      )}

      {patients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Pacientes Encontrados
              <Badge variant="secondary">{patients.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {patients.map((patient) => (
                <AccordionItem 
                  key={patient.usuario_id} 
                  value={patient.usuario_id}
                  className="border rounded-lg px-4 bg-muted/30"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {patient.nombres} {patient.apellidos}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          C.I. {patient.cedula}
                        </p>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {patient.total_citas} cita{patient.total_citas !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-4 space-y-6">
                    {/* Resumen Clínico del Paciente */}
                    <div className="bg-white rounded-lg p-4 border shadow-sm">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                        <ClipboardList className="h-4 w-4" />
                        Resumen Clínico & Datos Personales
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Edad y Nacimiento */}
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Edad / Nacimiento</span>
                          <p className="text-sm font-medium">
                            {calculateAge(patient.fecha_nacimiento)} años
                          </p>
                          <p className="text-xs text-muted-foreground">
                             ({patient.fecha_nacimiento?.split('T')[0]})
                          </p>
                        </div>

                        {/* Tipo de Sangre */}
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Tipo de Sangre</span>
                          <p className="text-sm font-medium">
                            {patient.tipo_sangre || "No registrado"}
                          </p>
                        </div>

                         {/* Enfermedades */}
                         <div className="space-y-1 md:col-span-2">
                          <span className="text-xs text-muted-foreground">Enfermedades / Antecedentes</span>
                          <p className="text-sm font-medium break-words">
                            {patient.enfermedades || "No registrado"}
                          </p>
                        </div>
                      </div>

                      {/* Último Diagnóstico */}
                      <div className="mt-4 pt-3 border-t">
                         <span className="text-xs text-muted-foreground block mb-1">Último Diagnóstico / Observación Reciente</span>
                         {patient.ultima_observacion ? (
                           <p className="text-sm bg-blue-50 text-blue-900 p-2 rounded">
                             {patient.ultima_observacion}
                           </p>
                         ) : (
                           <p className="text-sm text-muted-foreground italic">
                             Sin observaciones registradas en citas recientes.
                           </p>
                         )}
                      </div>
                    </div>

                    <PatientTimeline pacienteId={patient.usuario_id} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Estado inicial */}
      {!hasSearched && searchCedula.length < 2 && searchApellido.length < 2 && (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-20 w-20 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">Busca un paciente para ver su historial</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Ingresa al menos 2 caracteres de la cédula o apellido para comenzar la búsqueda
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
