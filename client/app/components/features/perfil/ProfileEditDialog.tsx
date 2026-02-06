"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
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
import { 
  Loader2, 
  Save, 
  AlertTriangle, 
  CalendarIcon,
  User,
  MapPin,
  Activity,
  Lock
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Paciente, Podologo } from "@/types"
import { ApiRoutes } from "@/lib/api-routes"
import { PasswordChangeDialog } from "./PasswordChangeDialog"

interface ProfileEditDialogProps {
  isOpen: boolean
  onClose: () => void
  data: Paciente | Podologo | null
  role: string | null
  onSuccess: () => void
  isAdmin?: boolean // Nuevo prop opcional
}

export function ProfileEditDialog({ isOpen, onClose, data, role, onSuccess, isAdmin = false }: ProfileEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const isPaciente = role === "PACIENTE"



  // Catálogos
  const [paisesOptions, setPaisesOptions] = useState<ComboboxOption[]>([])
  const [tiposSangreOptions, setTiposSangreOptions] = useState<{id: number, nombre: string}[]>([])
  
  // Estado del Formulario (Unificado para ambos roles)
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    email: "",
    telefono: "",
    // Campos específicos de Paciente (se ignoran si es Podólogo)
    ciudad: "",
    direccion: "",
    enfermedades: "",
    // Comunes
    fechaNacimiento: undefined as Date | undefined,
    paisId: undefined as number | undefined,
    tipoSangreId: undefined as number | undefined,
  })

  // 1. Cargar Datos y Catálogos
  useEffect(() => {
    if (isOpen && data) {
      const fetchCatalogs = async () => {
        try {
          const [resPaises, resSangre] = await Promise.all([
            fetch(ApiRoutes.common.paises),
            fetch(ApiRoutes.common.tiposSangre)
          ])
          
          if (resPaises.ok) {
             const d = await resPaises.json()
             if(Array.isArray(d)) setPaisesOptions(d.map((p: any) => ({ value: p.id.toString(), label: p.nombre })))
          }
          if (resSangre.ok) {
             const d = await resSangre.json()
             if(Array.isArray(d)) setTiposSangreOptions(d)
          }
        } catch (error) {
          console.error("Error cargando catálogos", error)
        }
      }
      fetchCatalogs()

      // Parsear fecha
      let fechaNac: Date | undefined = undefined;
      if (data.fecha_nacimiento) {
        const fechaString = data.fecha_nacimiento.includes('T') 
          ? data.fecha_nacimiento 
          : `${data.fecha_nacimiento}T00:00:00`;
        fechaNac = new Date(fechaString);
      }

      // Casting seguro para acceder a propiedades específicas
      const pacienteData = isPaciente ? (data as Paciente) : null;

      setFormData({
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
        cedula: data.cedula || "",
        email: data.email || "",
        telefono: data.telefono || "",
        // Solo llenamos si es paciente
        ciudad: pacienteData?.ciudad || "",
        direccion: pacienteData?.direccion || "",
        enfermedades: pacienteData?.enfermedades || "",
        
        fechaNacimiento: fechaNac,
        paisId: data.paises ? (data as any).pais_id : undefined, // Ajuste según tu estructura exacta de DB
        tipoSangreId: data.tipos_sangre ? (data as any).tipo_sangre_id : undefined,
      })
    }
  }, [isOpen, data, isPaciente])

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCountryChange = (val: string) => setFormData(prev => ({ ...prev, paisId: Number(val) }))
  const handleBloodChange = (val: string) => setFormData(prev => ({ ...prev, tipoSangreId: Number(val) }))
  const handleDateChange = (date: Date | undefined) => setFormData(prev => ({ ...prev, fechaNacimiento: date }))

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirm(true)
  }

  const handleConfirmUpdate = async () => {
    if (!data) return
    setIsLoading(true)
    setShowConfirm(false)

    try {
      // Endpoint dinámico según rol
      const endpoint = isPaciente 
        ? `${ApiRoutes.pacientes.byId(data.usuario_id)}`
        : `${ApiRoutes.podologos.byId(data.usuario_id)}`

      // Payload dinámico (filtramos lo que enviamos según el rol)
      const payload: any = {
         nombres: formData.nombres,
         apellidos: formData.apellidos,
         // email: formData.email, // UPDATE: Se envía si es Admin
         telefono: formData.telefono,
         fechaNacimiento: formData.fechaNacimiento ? formData.fechaNacimiento.toISOString() : null,
         paisId: formData.paisId,
         tipoSangreId: formData.tipoSangreId,
      }

      // Si es admin, añadimos campos sensibles
      if (isAdmin) {
          payload.cedula = formData.cedula;
          payload.email = formData.email;
      }

      // Si es paciente, enviamos los campos extra
      if (isPaciente) {
         payload.ciudad = formData.ciudad;
         payload.direccion = formData.direccion;
         payload.enfermedades = formData.enfermedades;
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Error al actualizar perfil")

      toast.success("Perfil actualizado correctamente")
      onSuccess()
      onClose()

    } catch (error) {
      console.error(error)
      toast.error("Error al actualizar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInteractOutside = (e: Event) => {
    e.preventDefault()
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent 
        className="max-w-5xl p-0 max-h-[95vh] overflow-y-auto" 
        onInteractOutside={handleInteractOutside}
      >
        <DialogHeader className="px-6 pt-6 pb-2 border-b bg-gray-50/50">
          <DialogTitle className="text-xl flex items-center gap-2 text-primary">
             <User className="h-5 w-5" />
             Editar Mi Perfil
          </DialogTitle>
          <DialogDescription className="text-xs">
            Actualiza tu información personal.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-profile-form" onSubmit={handlePreSubmit} className="p-6">
          {/* Layout adaptable: 3 columnas para paciente, 2 para podólogo */}
          <div className={cn(
             "grid gap-6 items-start",
             isPaciente ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"
          )}>
            
            {/* COLUMNA 1: DATOS PERSONALES (Común) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-1">
                 Datos Personales
              </h4>
              <div className="grid gap-3">
                 <div className="space-y-1.5">
                    <Label className="text-xs">Nombres</Label>
                    <Input className="h-8" name="nombres" value={formData.nombres} onChange={handleChange} required />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-xs">Apellidos</Label>
                    <Input className="h-8" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                 </div>
                  <div className="space-y-1.5">
                     <Label className="text-xs">Cédula</Label>
                     <Input 
                        name="cedula" // Añadir name
                        value={formData.cedula} 
                        onChange={handleChange}
                        disabled={!isAdmin} 
                        className={cn("h-8", !isAdmin && "bg-muted text-muted-foreground cursor-not-allowed border-dashed")} 
                      />
                  </div>
                 <div className="space-y-1.5 flex flex-col">
                    <Label className="text-xs">Fecha de Nacimiento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-8 justify-start text-left font-normal text-sm",
                            !formData.fechaNacimiento && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {formData.fechaNacimiento ? format(formData.fechaNacimiento, "PPP", { locale: es }) : <span>Seleccionar</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.fechaNacimiento}
                          onSelect={handleDateChange}
                          initialFocus
                          captionLayout="dropdown"
                          classNames={{ caption_dropdowns: "flex gap-2" }}
                        />
                      </PopoverContent>
                    </Popover>
                 </div>
              </div>
            </div>

            {/* COLUMNA 2: CONTACTO (Común + Extras de Paciente) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-1">
                 <MapPin className="h-3 w-3" /> Contacto
              </h4>
              <div className="grid gap-3">
                  <div className="space-y-1.5">
                     <Label className="text-xs">Email</Label>
                     {/* Asumimos email de lectura por seguridad, o editable según prefieras */}
                     <Input 
                        className={cn("h-8", !isAdmin && "bg-muted text-muted-foreground")} 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        disabled={!isAdmin} 
                      />
                  </div>
                 <div className="space-y-1.5">
                    <Label className="text-xs">Teléfono</Label>
                    <Input className="h-8" name="telefono" value={formData.telefono} onChange={handleChange} required />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-xs">País</Label>
                    <div className="h-8">
                        <Combobox 
                            options={paisesOptions} 
                            value={formData.paisId?.toString() || ""} 
                            onValueChange={handleCountryChange}
                            placeholder="Seleccionar..." 
                        />
                    </div>
                 </div>
                 
                 {/* Campos exclusivos de Paciente */}
                 {isPaciente && (
                    <>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Ciudad</Label>
                            <Input className="h-8" name="ciudad" value={formData.ciudad} onChange={handleChange} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Dirección</Label>
                            <Input className="h-8" name="direccion" value={formData.direccion} onChange={handleChange} />
                        </div>
                    </>
                 )}
              </div>
            </div>

            {/* COLUMNA 3: SALUD (Común Tipo Sangre + Extras Paciente) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-1">
                 <Activity className="h-3 w-3" /> {isPaciente ? "Salud" : "Datos Profesionales"}
              </h4>
              <div className="grid gap-3">
                 <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Sangre</Label>
                    <Select value={formData.tipoSangreId?.toString()} onValueChange={handleBloodChange}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {tiposSangreOptions.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 
                 {/* Campos exclusivos de Paciente */}
                 {isPaciente && (
                     <div className="space-y-1.5">
                        <Label className="text-xs">Enfermedades / Alergias</Label>
                        <Textarea 
                        name="enfermedades" 
                        value={formData.enfermedades} 
                        onChange={handleChange} 
                        className="min-h-[120px] resize-none text-sm"
                        />
                     </div>
                 )}
              </div>
            </div>

          </div>
        </form>

        <DialogFooter className="px-6 py-3 border-t bg-gray-50">
          <div className="flex w-full justify-between items-center">
             {!isAdmin ? (
               <Button 
                 type="button" 
                 variant="outline" 
                 size="sm" 
                 onClick={() => setShowPasswordChange(true)}
                 className="gap-2"
               >
                 <Lock className="h-3 w-3" />
                 Cambiar Contraseña
               </Button>
             ) : <div></div>}
             <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" form="edit-profile-form" size="sm" disabled={isLoading} className="gap-2">
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Guardar Cambios
                </Button>
             </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
               <AlertTriangle className="h-5 w-5" /> Confirmar Cambios
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas actualizar tu perfil?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>
              Sí, actualizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    {/* Modal de cambio de contraseña */}
    <PasswordChangeDialog 
      isOpen={showPasswordChange} 
      onClose={() => setShowPasswordChange(false)} 
    />
    </>
  )
}