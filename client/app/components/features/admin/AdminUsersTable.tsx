"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Eye,
  UserX,
  UserCheck,
  AlertTriangle,
  Loader2,
  Stethoscope,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminUserDetailsDialog } from "./AdminUserDetailsDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { ProfileEditDialog } from "../perfil/ProfileEditDialog"; // Importar componente
import { KeyRound, Pencil } from "lucide-react"; // Importar icono Pencil
import { ApiRoutes } from "@/lib/api-routes";

interface Usuario {
  usuario_id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string | null;
  telefono: string | null;
  tipo_usuario: "PACIENTE" | "PODOLOGO";
  estado_nombre: string;
  estado_activo: boolean;
  fecha_creacion: string;
  // Campos adicionales para edición (vienen del backend)
  fecha_nacimiento?: string;
  pais_id?: number;
  tipo_sangre_id?: number;
  ciudad?: string;
  direccion?: string;
  enfermedades?: string;
  paises?: { nombre: string } | null;
  tipos_sangre?: { nombre: string } | null;
}

interface AdminUsersTableProps {
  data: Usuario[];
  isLoading: boolean;
  onDataUpdate: () => void;
}

export function AdminUsersTable({
  data,
  isLoading,
  onDataUpdate,
}: AdminUsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Estados para cambio de contraseña
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  
  // Estados para editar usuario
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Estados para desactivación
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Estados para activación
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const handleViewDetails = (user: Usuario) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handlePasswordClick = (user: Usuario) => {
    setSelectedUser(user);
    setIsPasswordOpen(true);
  };

  const handleEditClick = (user: Usuario) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleDeactivateClick = (user: Usuario) => {
    setSelectedUser(user);
    setIsDeactivateOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedUser) return;
    setIsDeactivating(true);

    try {
      const res = await fetch(
        ApiRoutes.admin.usuarios.deactivate(selectedUser.usuario_id),
        {
          method: "PATCH",
        }
      );
      if (!res.ok) throw new Error("Error al desactivar usuario");

      toast.success("Usuario desactivado correctamente", {
        description: `El usuario ${selectedUser.nombres} ahora está inactivo.`,
      });
      onDataUpdate();
      setIsDeactivateOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al desactivar usuario");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivateClick = (user: Usuario) => {
    setSelectedUser(user);
    setIsActivateOpen(true);
  };

  const handleConfirmActivate = async () => {
    if (!selectedUser) return;
    setIsActivating(true);

    try {
      const res = await fetch(
        ApiRoutes.admin.usuarios.reactivate(selectedUser.usuario_id),
        {
          method: "PATCH",
        }
      );
      if (!res.ok) throw new Error("Error al activar usuario");

      toast.success("Usuario activado correctamente", {
        description: `El usuario ${selectedUser.nombres} tiene acceso nuevamente.`,
      });
      onDataUpdate();
      setIsActivateOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al activar usuario");
    } finally {
      setIsActivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/5">
        <p>No se encontraron usuarios con los filtros aplicados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-[60px]">Avatar</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user) => (
                <TableRow key={user.usuario_id} className="hover:bg-muted/30">
                  <TableCell>
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarFallback
                        className={
                          user.tipo_usuario === "PODOLOGO"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-blue-100 text-blue-600"
                        }
                      >
                        {user.nombres?.[0]}
                        {user.apellidos?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {user.apellidos}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.nombres}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.tipo_usuario === "PODOLOGO"
                          ? "border-purple-200 bg-purple-50 text-purple-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      }
                    >
                      {user.tipo_usuario === "PODOLOGO" ? (
                        <>
                          <Stethoscope className="h-3 w-3 mr-1" /> Podólogo
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" /> Paciente
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{user.cedula}</TableCell>
                  <TableCell>
                    {user.telefono || (
                      <span className="text-muted-foreground italic">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.estado_activo
                          ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      }
                    >
                      {user.estado_activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        >
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Opciones</DropdownMenuLabel>

                        <DropdownMenuItem
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver información
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleEditClick(user)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar Usuario
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => handlePasswordClick(user)}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Cambiar Contraseña
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />

                        {/* Opciones de desactivar/activar parTODOS los usuarios */}
                        {user.estado_activo ? (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            onClick={() => handleDeactivateClick(user)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Desactivar Usuario
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-green-600 focus:text-green-600 focus:bg-green-50 cursor-pointer"
                            onClick={() => handleActivateClick(user)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activar Usuario
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Detalles */}
      <AdminUserDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        userId={selectedUser?.usuario_id || null}
      />

      {/* Modal de Edición de Perfil */}
        {selectedUser && (
        <ProfileEditDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          data={selectedUser as any} // Casting as any to matches Paciente | Podologo loosely
          role={selectedUser.tipo_usuario}
          onSuccess={() => {
            onDataUpdate()
            setIsEditOpen(false)
          }}
          isAdmin={true}
        />
        )}

      {/* Modal de Cambio de Contraseña */}
      <ChangePasswordDialog
        open={isPasswordOpen}
        onOpenChange={setIsPasswordOpen}
        userId={selectedUser?.usuario_id || null}
        userName={selectedUser ? `${selectedUser.nombres} ${selectedUser.apellidos}` : null}
      />

      {/* Diálogo de Desactivar */}
      <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              ¿Desactivar este{" "}
              {selectedUser?.tipo_usuario === "PODOLOGO"
                ? "podólogo"
                : "usuario"}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {selectedUser?.tipo_usuario === "PODOLOGO"
                  ? "El podólogo"
                  : "El usuario"}{" "}
                <strong>
                  {selectedUser?.nombres} {selectedUser?.apellidos}
                </strong>{" "}
                no podrá acceder al sistema hasta que sea reactivado.
              </span>
              {selectedUser?.tipo_usuario === "PODOLOGO" && (
                <span className="block text-amber-600 font-medium">
                  ⚠️ Mientras esté desactivado, el podólogo no podrá iniciar
                  sesión ni gestionar citas.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              disabled={isDeactivating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Desactivando...
                </>
              ) : (
                "Sí, desactivar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Activar */}
      <AlertDialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <UserCheck className="h-5 w-5" />
              ¿Activar este usuario?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El usuario{" "}
              <strong>
                {selectedUser?.nombres} {selectedUser?.apellidos}
              </strong>{" "}
              podrá acceder nuevamente al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmActivate}
              disabled={isActivating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isActivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activando...
                </>
              ) : (
                "Sí, activar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
