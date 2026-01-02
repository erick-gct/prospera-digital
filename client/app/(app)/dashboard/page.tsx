"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/cliente"
import { DashboardPaciente } from "@/app/components/features/dashboard/DashboardPaciente"
import { DashboardPodologo } from "@/app/components/features/dashboard/DashboardPodologo"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Verificar si el usuario es paciente (usando limit(1) para evitar error 406)
        const { data: pacientes } = await supabase
          .from('paciente')
          .select('usuario_id')
          .eq('usuario_id', user.id)
          .limit(1)
        
        if (pacientes && pacientes.length > 0) {
          setRole('paciente')
        } else {
          // Verificar si es podólogo
          const { data: podologos } = await supabase
            .from('podologo')
            .select('usuario_id')
            .eq('usuario_id', user.id)
            .limit(1)
          
          if (podologos && podologos.length > 0) {
            setRole('podologo')
          } else {
            setRole('admin')
          }
        }
      }
      setIsLoading(false)
    }

    fetchRole()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (role === 'paciente') {
    return <DashboardPaciente />
  }

  if (role === 'podologo') {
    return <DashboardPodologo />
  }

  // Admin u otro rol - mostrar mensaje básico
  return (
    <div>
      <h1 className="text-3xl font-bold">Panel de Administración</h1>
      <p className="mt-2 text-muted-foreground">
        Bienvenido al panel de administración.
      </p>
    </div>
  )
}
