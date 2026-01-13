"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCog, Search, Filter, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ApiRoutes } from "@/lib/api-routes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminUsersTable } from "@/app/components/features/admin/AdminUsersTable";
import { AdminStatsCards } from "@/app/components/features/admin/AdminStatsCards";
import { CreatePodologoDialog } from "@/app/components/features/admin/CreatePodologoDialog";

interface AdminStats {
  usuarios: {
    total_pacientes: number;
    pacientes_activos: number;
    pacientes_inactivos: number;
    total_podologos: number;
  };
  citas: {
    total: number;
    completadas: number;
    pendientes: number;
    canceladas: number;
  };
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [cedulaQuery, setCedulaQuery] = useState("");
  const [apellidoQuery, setApellidoQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  // Dialog para crear podólogo
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const res = await fetch(ApiRoutes.admin.stats);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  // Cargar usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = ApiRoutes.admin.usuarios.list({
        tipo: tipoFilter !== "todos" ? tipoFilter : undefined,
        cedula: cedulaQuery || undefined,
        apellido: apellidoQuery || undefined,
        estado: estadoFilter !== "todos" ? estadoFilter : undefined,
      });

      const res = await fetch(url);

      if (!res.ok) throw new Error("Error al cargar usuarios");

      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la lista de usuarios");
    } finally {
      setIsLoading(false);
    }
  }, [tipoFilter, cedulaQuery, apellidoQuery, estadoFilter]);

  // Cargar estadísticas al inicio
  useEffect(() => {
    fetchStats();
  }, []);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  return (
    <div className="rounded-sm border bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <UserCog className="h-8 w-8" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra todos los usuarios del sistema: pacientes y podólogos.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          className="self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Podólogo
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && <AdminStatsCards stats={stats} />}

      {/* Contenedor Principal */}
      <div className="bg-white p-6 shadow-sm space-y-6">
        {/* Filtros */}
        <div className="rounded-lg bg-gray-50 p-4 border">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Filtros
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tipo de Usuario */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Tipo de Usuario
              </label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="paciente">Pacientes</SelectItem>
                  <SelectItem value="podologo">Podólogos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Búsqueda por Cédula */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Buscar por Cédula
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ej: 0912345678"
                  value={cedulaQuery}
                  onChange={(e) => setCedulaQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Búsqueda por Apellido */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Buscar por Apellido
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ej: García"
                  value={apellidoQuery}
                  onChange={(e) => setApellidoQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Estado (solo para pacientes) */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Estado</label>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="1">Activos</SelectItem>
                  <SelectItem value="2">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <AdminUsersTable
          data={users}
          isLoading={isLoading}
          onDataUpdate={() => {
            fetchUsers();
            fetchStats();
          }}
        />
      </div>

      {/* Dialog para crear podólogo */}
      <CreatePodologoDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />
    </div>
  );
}
