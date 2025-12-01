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
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {   
  Loader2, 
  Save, 
  AlertTriangle, 
  CalendarIcon,
  User,
  MapPin,
  Activity } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Paciente } from "@/types" 
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface PatientEditDialogProps {
  isOpen: boolean
  onClose: () => void
  paciente: Paciente | null
  onSuccess: () => void // Callback para recargar la tabla al terminar
}

export function PatientEditDialog({ isOpen, onClose, paciente, onSuccess }: PatientEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false) // Para el diálogo de "¿Estás seguro?"

  // Catálogos
  const [paisesOptions, setPaisesOptions] = useState<ComboboxOption[]>([])
  const [tiposSangreOptions, setTiposSangreOptions] = useState<{id: number, nombre: string}[]>([])
  
  // Estado del Formulario
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    cedula: "", // Solo lectura
    email: "",
    telefono: "",
    ciudad: "",
    direccion: "",
    fechaNacimiento: undefined as Date | undefined, // String para el input date
    paisId: undefined as number | undefined,
    tipoSangreId: undefined as number | undefined,
    enfermedades: "",
  })

  // 1. Cargar Catálogos y Datos del Paciente al abrir
  useEffect(() => {
    if (isOpen && paciente) {
      // Cargar catálogos (reutilizamos la lógica del registro)
      const fetchCatalogs = async () => {
        try {
          const [resPaises, resSangre] = await Promise.all([
            fetch("http://localhost:3001/common/paises"),
            fetch("http://localhost:3001/common/tipos-sangre")
          ])
          
          if (resPaises.ok) {
             const data = await resPaises.json()
             if(Array.isArray(data)) setPaisesOptions(data.map((p: any) => ({ value: p.id.toString(), label: p.nombre })))
          }
          if (resSangre.ok) {
             const data = await resSangre.json()
             if(Array.isArray(data)) setTiposSangreOptions(data)
          }
        } catch (error) {
          console.error("Error cargando catálogos", error)
        }
      }
      fetchCatalogs()

        // Parsear fecha para el estado inicial
      // (La fecha viene como string ISO desde la BD, hay que convertirla a objeto Date para el componente)
      let fechaNac: Date | undefined = undefined;
      if (paciente.fecha_nacimiento) {
        const fechaString = paciente.fecha_nacimiento.includes('T') 
          ? paciente.fecha_nacimiento 
          : `${paciente.fecha_nacimiento}T00:00:00`;
        fechaNac = new Date(fechaString);
      }

      // Rellenar formulario con datos existentes
      setFormData({
        nombres: paciente.nombres || "",
        apellidos: paciente.apellidos || "",
        cedula: paciente.cedula || "",
        email: paciente.email || "",
        telefono: paciente.telefono || "",
        ciudad: paciente.ciudad || "",
        direccion: paciente.direccion || "",
        // Formatear fecha para input type="date" (YYYY-MM-DD)
        fechaNacimiento: fechaNac,
        paisId: paciente.paises ? paciente.pais_id : undefined, // Usamos el ID directo si lo tenemos en tu tipo, o asumimos que paises trae el id
        // NOTA: Si tu tipo Paciente en 'types/index.ts' no tiene 'pais_id' en la raíz, asegúrate de que el backend lo envíe.
        // El servicio 'findOne' y 'findAll' envían `*`, así que `pais_id` debería estar ahí.
        tipoSangreId: paciente.tipos_sangre ? paciente.tipo_sangre_id : undefined,
        enfermedades: paciente.enfermedades || "",
      })
    }
  }, [isOpen, paciente])

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCountryChange = (val: string) => setFormData(prev => ({ ...prev, paisId: Number(val) }))
  const handleBloodChange = (val: string) => setFormData(prev => ({ ...prev, tipoSangreId: Number(val) }))

    const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, fechaNacimiento: date }))
  }
  // 2. Pre-Submit: Abrir confirmación
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirm(true)
  }

  // 3. Submit Real: Llamar a la API
  const handleConfirmUpdate = async () => {
    if (!paciente) return
    setIsLoading(true)
    setShowConfirm(false) // Cerramos la alerta, mostramos loading en el dialog principal si queremos o bloqueamos

    try {
      const response = await fetch(`http://localhost:3001/pacientes/${paciente.usuario_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           // Enviamos solo lo editable. No enviamos cedula.
           nombres: formData.nombres,
           apellidos: formData.apellidos,
           email: formData.email, // Si decides permitir editar email
           telefono: formData.telefono,
           ciudad: formData.ciudad,
           direccion: formData.direccion,
          // Formatear Date a String ISO para el backend
           fechaNacimiento: formData.fechaNacimiento ? formData.fechaNacimiento.toISOString() : null,
           paisId: formData.paisId,
           tipoSangreId: formData.tipoSangreId,
           enfermedades: formData.enfermedades
        }),
      })

      if (!response.ok) throw new Error("Error al actualizar")

      toast.success("Paciente actualizado correctamente", {
        description: `Los datos de ${formData.nombres} han sido modificados.`
      })
      
      onSuccess() // Recargar tabla
      onClose()   // Cerrar modal

    } catch (error) {
      console.error(error)
      toast.error("Error al actualizar", { description: "No se pudieron guardar los cambios." })
    } finally {
      setIsLoading(false)
    }
  }

  // Prevenir cierre accidental al hacer clic afuera
  const handleInteractOutside = (e: Event) => {
    e.preventDefault()
  }
 
   return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent 
        className="max-w-6xl p-0 max-h-[95vh] overflow-y-auto" 
        onInteractOutside={handleInteractOutside}
      >
        <DialogHeader className="px-6 pt-6 pb-2 border-b bg-gray-50/50">
          <DialogTitle className="text-xl flex items-center gap-2 text-primary">
             <User className="h-5 w-5" />
             Editar Información del Paciente
          </DialogTitle>
          <DialogDescription className="text-xs">
            Actualiza los datos necesarios.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-patient-form" onSubmit={handlePreSubmit} className="p-6">
          {/* LAYOUT DE 3 COLUMNAS para evitar scroll vertical */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            
            {/* COLUMNA 1: DATOS PERSONALES */}
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
                      value={formData.cedula} 
                      disabled 
                      className="h-8 bg-muted text-muted-foreground cursor-not-allowed border-dashed" 
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
                          {formData.fechaNacimiento ? (
                            format(formData.fechaNacimiento, "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.fechaNacimiento}
                          onSelect={handleDateChange}
                          initialFocus
                          captionLayout="dropdown" // Habilita el select de año/mes
    
                        />
                      </PopoverContent>
                    </Popover>
                 </div>
              </div>
            </div>

            {/* COLUMNA 2: CONTACTO Y UBICACIÓN */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-1">
                 <MapPin className="h-3 w-3" /> Ubicación y Contacto
              </h4>
              
              <div className="grid gap-3">
                 <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input className="h-8" name="email" type="email" value={formData.email} onChange={handleChange} required />
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
                 <div className="space-y-1.5">
                    <Label className="text-xs">Ciudad</Label>
                    <Input className="h-8" name="ciudad" value={formData.ciudad} onChange={handleChange} />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-xs">Dirección</Label>
                    <Input className="h-8" name="direccion" value={formData.direccion} onChange={handleChange} />
                 </div>
              </div>
            </div>

            {/* COLUMNA 3: SALUD Y OTROS */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-1">
                 <Activity className="h-3 w-3" /> Salud
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
                 <div className="space-y-1.5">
                    <Label className="text-xs">Enfermedades / Alergias</Label>
                    <Textarea 
                      name="enfermedades" 
                      value={formData.enfermedades} 
                      onChange={handleChange} 
                      className="min-h-[160px] resize-none text-sm" // Más altura para aprovechar espacio vertical de la columna
                      placeholder="Detalle aquí cualquier condición relevante..."
                    />
                 </div>
              </div>
            </div>

          </div>
        </form>

        <DialogFooter className="px-6 py-3 border-t bg-gray-50">
          <div className="flex w-full justify-between items-center">
             <p className="text-[10px] text-muted-foreground">
               * La cédula no es editable. | <span className="font-medium">Todos los cambios se registran.</span>
             </p>
             <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" form="edit-patient-form" size="sm" disabled={isLoading} className="gap-2">
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
               <AlertTriangle className="h-5 w-5" /> Confirmar Edición
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas actualizar la información de este paciente? 
              Esta acción registrará la fecha de modificación en el sistema.
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
    </>
  )
}