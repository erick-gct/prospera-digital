"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Phone, Mail, Activity, FileText, CreditCard } from "lucide-react"
import { Paciente } from "@/types"


interface PatientDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  paciente: Paciente | null
}

export function PatientDetailsDialog({ isOpen, onClose, paciente }: PatientDetailsDialogProps) {
  if (!paciente) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="text-2xl text-primary">
                {paciente.nombres} {paciente.apellidos}
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2">
                <CreditCard className="h-3 w-3" /> C.I: {paciente.cedula}
              </DialogDescription>
            </div>
            <Badge 
              className={paciente.estado_paciente_id === 1 ? "bg-green-500" : "bg-destructive"}
            >
              {paciente.estado_paciente_id === 1 ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Información Personal */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-primary">
              <Calendar className="h-4 w-4" /> Datos Personales
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Fecha de Nacimiento</span>
                <span>
                  {paciente.fecha_nacimiento 
                    ? format(new Date(paciente.fecha_nacimiento), "PPP", { locale: es }) 
                    : "No registrada"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Email</span>
                <span>{paciente.email || "No registrado"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Teléfono</span>
                <span>{paciente.telefono || "No registrado"}</span>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-primary">
              <MapPin className="h-4 w-4" /> Ubicación
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">País</span>
                <span>{paciente.paises?.nombre || "No registrado"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Ciudad</span>
                <span>{paciente.ciudad || "No registrada"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Dirección</span>
                <span>{paciente.direccion || "No registrada"}</span>
              </div>
            </div>
          </div>

          {/* Salud */}
          <div className="space-y-4 md:col-span-2">
             <h4 className="font-semibold flex items-center gap-2 text-primary">
              <Activity className="h-4 w-4" /> Información Médica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-3 bg-muted/30 rounded-md border">
               <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Tipo de Sangre</span>
                <span className="font-medium">{paciente.tipos_sangre?.nombre || "No especificado"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Enfermedades / Alergias</span>
                <span>{paciente.enfermedades || "Ninguna registrada"}</span>
              </div>
            </div>
          </div>
          
          {/* Auditoría */}
          <div className="space-y-4 md:col-span-2">
            <h4 className="font-semibold flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
               <FileText className="h-3 w-3" /> Auditoría del Sistema
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                 <span>Registrado el: </span>
                 <span className="font-medium text-foreground">
                   {paciente.fecha_creacion 
                     ? format(new Date(paciente.fecha_creacion), "PPpp", { locale: es }) 
                     : "-"}
                 </span>
              </div>
              <div>
                 <span>Última actualización: </span>
                 <span className="font-medium text-foreground">
                   {paciente.fecha_modificacion 
                     ? format(new Date(paciente.fecha_modificacion), "PPpp", { locale: es }) 
                     : " Sin modificaciones"}
                 </span>
              </div>
            </div>
          </div>

        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}