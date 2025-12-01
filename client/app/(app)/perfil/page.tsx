"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/cliente"
import { Paciente, Podologo } from "@/types"
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  Activity, 
  FileText, 
  Edit2,
  Loader2,
  Clock
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
// Importamos el nuevo diálogo
import { ProfileEditDialog } from "@/app/components/features/perfil/ProfileEditDialog"

export default function ProfilePage() {
  const [profile, setProfile] = useState<Paciente | Podologo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Estado para el modal de edición
  const [isEditOpen, setIsEditOpen] = useState(false)

  const fetchProfile = async () => {
      try {
        setIsLoading(true) // Recargamos con loading visual o silencioso
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const role = user.user_metadata?.role || "PACIENTE"
        setUserRole(role)

        const endpoint = role === 'PODOLOGO' 
            ? `http://localhost:3001/podologos/${user.id}`
            : `http://localhost:3001/pacientes/${user.id}`

        const res = await fetch(endpoint)
        
        if (!res.ok) throw new Error("Error al cargar perfil")

        const data = await res.json()
        setProfile(data)

      } catch (error) {
        console.error(error)
        toast.error("No se pudo cargar la información del perfil")
      } finally {
        setIsLoading(false)
      }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (isLoading && !profile) { // Solo mostrar loader si no hay datos aún
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p>Cargando tu perfil...</p>
      </div>
    )
  }

  if (!profile) return null

  const isPaciente = userRole === 'PACIENTE';
  const pacienteData = isPaciente ? (profile as Paciente) : null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
           <User className="h-6 w-6" />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Mi Perfil</h1>
            <p className="text-muted-foreground text-sm">
                {isPaciente ? "Gestiona tu información personal y médica." : "Gestiona tu información profesional."}
            </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="bg-gray-50/80 p-6 border-b flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                    <AvatarImage src="" /> 
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                        {profile.nombres?.[0]}{profile.apellidos?.[0]}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        {profile.nombres} {profile.apellidos}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs font-normal text-primary bg-primary/10 hover:bg-primary/20">
                            {isPaciente ? 'Paciente' : 'Podólogo'}
                        </Badge>
                        {isPaciente && (
                            <Badge variant={pacienteData?.estado_paciente_id === 1 ? "default" : "destructive"} className="text-xs">
                                {pacienteData?.estado_paciente_id === 1 ? "Activo" : "Inactivo"}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Botón Activo */}
            <Button variant="outline" className="gap-2 shadow-sm" onClick={() => setIsEditOpen(true)}>
                <Edit2 className="h-4 w-4" />
                Editar Perfil
            </Button>
        </div>

        {/* ... (El resto del Grid de información se mantiene igual que en la versión anterior) ... */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Columna 1 */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <User className="h-4 w-4" /> Datos Personales
                </h3>
                <div className="space-y-3">
                    <InfoItem label="Cédula / ID" value={profile.cedula} icon={CreditCard} />
                    <InfoItem 
                        label="Fecha de Nacimiento" 
                        value={profile.fecha_nacimiento ? format(new Date(profile.fecha_nacimiento), "PPP", { locale: es }) : "No registrada"} 
                        icon={Calendar} 
                    />
                    <InfoItem label="Email" value={profile.email || "No registrado"} icon={Mail} />
                </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Ubicación y Contacto
                </h3>
                <div className="space-y-3">
                    <InfoItem label="Teléfono" value={profile.telefono || "No registrado"} icon={Phone} />
                    <InfoItem label="País" value={profile.paises?.nombre || "No registrado"} icon={MapPin} />
                    {isPaciente && (
                         <InfoItem label="Dirección" value={`${pacienteData?.direccion || ""}, ${pacienteData?.ciudad || ""}`} icon={MapPin} />
                    )}
                </div>
            </div>

             {/* Columna 3 */}
             <div className="space-y-4">
                {isPaciente ? (
                    <>
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Ficha Médica
                        </h3>
                        <div className="grid gap-3">
                            <div className="bg-red-50 p-3 rounded-md border border-red-100">
                                <span className="text-xs text-red-600 font-medium uppercase">Tipo de Sangre</span>
                                <p className="text-lg font-bold text-red-700">{profile.tipos_sangre?.nombre || "-"}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                <span className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                                    <FileText className="h-3 w-3" /> Antecedentes
                                </span>
                                <p className="text-sm mt-1 text-gray-700 leading-relaxed line-clamp-3" title={pacienteData?.enfermedades || ""}>
                                    {pacienteData?.enfermedades || "Ninguna registrada."}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Datos Profesionales
                        </h3>
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                             <span className="text-xs text-blue-600 font-medium uppercase">Tipo de Sangre</span>
                             <p className="text-lg font-bold text-blue-700">{profile.tipos_sangre?.nombre || "-"}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Auditoría */}
            <div className="lg:col-span-3 pt-4 border-t mt-2">
                 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Clock className="h-3 w-3" /> Registro de Actividad
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-lg border flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Fecha de Registro</span>
                        <span className="text-sm font-medium">
                            {profile.fecha_creacion ? format(new Date(profile.fecha_creacion), "PPpp", { locale: es }) : "-"}
                        </span>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg border flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Última Actualización</span>
                        <span className="text-sm font-medium">
                            {profile.fecha_modificacion ? format(new Date(profile.fecha_modificacion), "PPpp", { locale: es }) : "Sin modificaciones"}
                        </span>
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Renderizamos el Diálogo */}
      <ProfileEditDialog 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        data={profile}
        role={userRole}
        onSuccess={fetchProfile} // Al guardar, recarga los datos
      />
    </div>
  )
}

function InfoItem({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground mt-0.5">
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground break-words">{value}</span>
            </div>
        </div>
    )
}