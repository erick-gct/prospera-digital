"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  Heart,
  Globe,
  Droplet,
  AlertCircle,
  Activity,
} from "lucide-react";
import { ApiRoutes } from "@/lib/api-routes";

interface AdminUserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

interface UserDetail {
  usuario_id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  ciudad: string | null;
  direccion: string | null;
  enfermedades: string | null;
  tipo_usuario: "PACIENTE" | "PODOLOGO";
  estado_nombre: string;
  estado_activo: boolean;
  fecha_creacion: string;
  paises?: { nombre: string } | null;
  tipos_sangre?: { nombre: string } | null;
  estadisticas?: {
    total_citas: number;
    pacientes_atendidos?: number;
  };
}

export function AdminUserDetailsDialog({
  open,
  onOpenChange,
  userId,
}: AdminUserDetailsDialogProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch(ApiRoutes.admin.usuarios.byId(userId));
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Error cargando detalles:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId, fetchUserDetails]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No especificada";
    try {
      return format(parseISO(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {user?.tipo_usuario === "PODOLOGO" ? (
              <Stethoscope className="h-5 w-5 text-purple-600" />
            ) : (
              <User className="h-5 w-5 text-blue-600" />
            )}
            Información del Usuario
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Header con nombre y estado */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {user.nombres} {user.apellidos}
                </h3>
                <p className="text-sm text-muted-foreground">{user.cedula}</p>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={
                    user.tipo_usuario === "PODOLOGO"
                      ? "border-purple-200 bg-purple-50 text-purple-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  }
                >
                  {user.tipo_usuario}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    user.estado_activo
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }
                >
                  {user.estado_activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Información de contacto */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Información de Contacto
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email || "No especificado"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.telefono || "No especificado"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información personal */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Información Personal
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Nacimiento: {formatDate(user.fecha_nacimiento)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>País: {user.paises?.nombre || "No especificado"}</span>
                </div>
                {user.ciudad && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.ciudad}</span>
                  </div>
                )}
                {user.tipos_sangre && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplet className="h-4 w-4 text-red-500" />
                    <span>Tipo de sangre: {user.tipos_sangre.nombre}</span>
                  </div>
                )}
              </div>
              {user.direccion && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>Dirección: {user.direccion}</span>
                </div>
              )}
            </div>

            {/* Información médica (solo pacientes) */}
            {user.tipo_usuario === "PACIENTE" && user.enfermedades && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Información Médica
                  </h4>
                  <div className="flex items-start gap-2 text-sm">
                    <Heart className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Enfermedades: {user.enfermedades}</span>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Estadísticas */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Estadísticas
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Activity className="h-5 w-5 mx-auto text-primary mb-1" />
                  <div className="text-2xl font-bold">
                    {user.estadisticas?.total_citas || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.tipo_usuario === "PODOLOGO"
                      ? "Citas realizadas"
                      : "Citas totales"}
                  </div>
                </div>
                {user.tipo_usuario === "PODOLOGO" &&
                  user.estadisticas?.pacientes_atendidos !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <User className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                      <div className="text-2xl font-bold">
                        {user.estadisticas.pacientes_atendidos}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pacientes atendidos
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <Separator />

            {/* Metadatos */}
            <div className="text-xs text-muted-foreground">
              <p>Registrado: {formatDate(user.fecha_creacion)}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No se pudo cargar la información del usuario.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
