"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Edit, UserX, Eye, UserCheck, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import { PatientDetailsDialog } from "./PatientDetailsDialog"
import { PatientEditDialog } from "./PatientEditDialog"
import { Paciente } from "@/types"
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
import { toast } from "sonner"
import {ApiRoutes} from "@/lib/api-routes"

interface PatientsTableProps {
  data: Paciente[]
  isLoading: boolean
  onDataUpdate: () => void
}

export function PatientsTable({ data, isLoading, onDataUpdate }: PatientsTableProps) {
  // Estados para selección
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null)
  
  // Estados de Modales
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  // Estados para Desactivación
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  // Estados para ACTIVACIÓN
  const [isActivateOpen, setIsActivateOpen] = useState(false)
  const [isActivating, setIsActivating] = useState(false)

  // --- HANDLERS ---

  const handleViewDetails = (paciente: Paciente) => {
    setSelectedPatient(paciente)
    setIsDetailsOpen(true)
  }

  const handleEditUser = (paciente: Paciente) => {
    setSelectedPatient(paciente)
    setIsEditOpen(true)
  }

  // --- Lógica de Desactivar ---
  const handleDeactivateClick = (paciente: Paciente) => {
    setSelectedPatient(paciente)
    setIsDeactivateOpen(true)
  }

  const handleConfirmDeactivate = async () => {
    if (!selectedPatient) return
    setIsDeactivating(true)

    try {
      const res = await fetch(`${ApiRoutes.pacientes.byId(selectedPatient.usuario_id)}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error("Error al desactivar usuario")

      toast.success("Usuario desactivado correctamente", {
        description: `El paciente ${selectedPatient.nombres} ahora está inactivo.`
      })
      onDataUpdate()
      setIsDeactivateOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Error al desactivar usuario")
    } finally {
      setIsDeactivating(false)
    }
  }

  // --- Lógica de ACTIVAR ---
  const handleActivateClick = (paciente: Paciente) => {
    setSelectedPatient(paciente)
    setIsActivateOpen(true)
  }

  const handleConfirmActivate = async () => {
    if (!selectedPatient) return
    setIsActivating(true)

    try {
      const res = await fetch(`${ApiRoutes.pacientes.reactivate(selectedPatient.usuario_id)}`, {
        method: 'PATCH' 
      })

      if (!res.ok) throw new Error("Error al activar usuario")

      toast.success("Usuario activado correctamente", {
        description: `El paciente ${selectedPatient.nombres} tiene acceso nuevamente.`
      })
      
      onDataUpdate()
      setIsActivateOpen(false)

    } catch (error) {
      console.error(error)
      toast.error("Error al activar usuario")
    } finally {
      setIsActivating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
         <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/5">
        <p>No se encontraron pacientes con los filtros aplicados.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-[60px]">Avatar</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((paciente) => {
                // Variable para saber si está activo (1) o no
                const isActive = paciente.estado_paciente_id === 1;

                return (
                  <TableRow key={paciente.usuario_id} className="hover:bg-muted/30">
                    {/* ... (Celdas de datos iguales) ... */}
                    <TableCell>
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {paciente.nombres?.[0]}{paciente.apellidos?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{paciente.apellidos}</div>
                      <div className="text-sm text-muted-foreground">{paciente.nombres}</div>
                    </TableCell>
                    <TableCell className=" text-sm">{paciente.cedula}</TableCell>
                    <TableCell>{paciente.telefono || <span className="text-muted-foreground italic">N/A</span>}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{paciente.ciudad || "-"}</span>
                        <span className="text-xs text-muted-foreground">{paciente.paises?.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{paciente.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={
                          isActive 
                            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" 
                            : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        }
                      >
                        {isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                          
                          <DropdownMenuItem onClick={() => handleViewDetails(paciente)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Mostrar info completa
                          </DropdownMenuItem>
                          
                          {/* --- AQUÍ ESTÁ EL CAMBIO --- */}
                          <DropdownMenuItem 
                            onClick={() => handleEditUser(paciente)}
                            disabled={!isActive} // Se deshabilita si NO es activo (estado != 1)
                            title={!isActive ? "Activa el usuario para editar" : ""}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Usuario
                          </DropdownMenuItem>
                          {/* --------------------------- */}
                          
                          <DropdownMenuSeparator />
                          
                          {isActive ? (
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                              onClick={() => handleDeactivateClick(paciente)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Desactivar Usuario
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                               className="text-green-600 focus:text-green-600 focus:bg-green-50 cursor-pointer"
                               onClick={() => handleActivateClick(paciente)}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activar Usuario
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* --- MODALES --- */}
      
      <PatientDetailsDialog 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        paciente={selectedPatient} 
      />

      <PatientEditDialog 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        paciente={selectedPatient}
        onSuccess={onDataUpdate}
      />

      {/* DIÁLOGOS DE CONFIRMACIÓN */}
      <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
               <AlertTriangle className="h-5 w-5" /> Desactivar Usuario
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  ¿Estás seguro de que deseas desactivar la cuenta de 
                  <span className="font-bold text-foreground"> {selectedPatient?.nombres} {selectedPatient?.apellidos}</span>?
                </p>
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                   <strong>Advertencia:</strong> Mientras la cuenta esté inactiva, 
                   el paciente <u>no podrá iniciar sesión</u> ni agendar citas en el sistema.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeactivate} 
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isDeactivating && <Loader2 className="h-4 w-4 animate-spin" />}
              Sí, desactivar cuenta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" /> Activar Usuario
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  ¿Deseas reactivar la cuenta de 
                  <span className="font-bold text-foreground"> {selectedPatient?.nombres} {selectedPatient?.apellidos}</span>?
                </p>
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                   El paciente podrá volver a iniciar sesión y gestionar sus citas normalmente.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActivating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmActivate} 
              disabled={isActivating}
              className="bg-green-600 text-white hover:bg-green-700 gap-2"
            >
              {isActivating && <Loader2 className="h-4 w-4 animate-spin" />}
              Sí, activar cuenta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  )
}
