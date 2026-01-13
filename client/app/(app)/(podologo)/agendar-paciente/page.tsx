"use client"

import { AgendarCitaPaciente } from "@/app/components/features/citas/AgendarCitaPaciente"
import { CalendarPlus } from "lucide-react"

export default function AgendarPacientePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CalendarPlus className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agendar Cita a Paciente</h1>
          <p className="text-muted-foreground">
            Programa una cita para uno de tus pacientes
          </p>
        </div>
      </div>

      {/* Componente principal */}
      <AgendarCitaPaciente />
    </div>
  )
}
