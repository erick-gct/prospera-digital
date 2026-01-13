"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  Shield,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ApiRoutes } from "@/lib/api-routes";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

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

interface RecentActivity {
  id: number;
  usuario_nombre: string;
  accion: string;
  fecha_hora: string;
  tipo_usuario?: string;
}

export function DashboardAdmin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogins, setRecentLogins] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Cargar estadísticas
      const statsRes = await fetch(ApiRoutes.admin.stats);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Cargar últimos accesos
      const loginsRes = await fetch(ApiRoutes.admin.auditoria.loginHistory(10));
      if (loginsRes.ok) {
        const loginsData = await loginsRes.json();
        setRecentLogins(loginsData);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Bienvenido al centro de control del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
          <Shield className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">
            Administrador
          </span>
        </div>
      </div>

      {/* Estadísticas principales */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Usuarios */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Usuarios
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.usuarios.total_pacientes +
                  stats.usuarios.total_podologos}
              </div>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-blue-600">
                  {stats.usuarios.total_pacientes} pacientes
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-purple-600">
                  {stats.usuarios.total_podologos} podólogos
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pacientes Activos */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pacientes Activos
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.usuarios.pacientes_activos}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.usuarios.pacientes_inactivos} inactivos
              </p>
            </CardContent>
          </Card>

          {/* Citas del Mes */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Citas Totales
              </CardTitle>
              <Calendar className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.citas.total}</div>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-yellow-600">
                  {stats.citas.pendientes} pendientes
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tasa de Éxito */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasa de Éxito
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.citas.total > 0
                  ? Math.round(
                      (stats.citas.completadas / stats.citas.total) * 100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.citas.completadas} citas completadas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accesos Rápidos y Actividad Reciente */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Accesos Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accesos Rápidos</CardTitle>
            <CardDescription>
              Navega rápidamente a las secciones principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin-usuarios">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Gestión de Usuarios
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin-citas">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  Citas del Sistema
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin-auditoria">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Auditoría
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Últimos Accesos
            </CardTitle>
            <CardDescription>
              Usuarios que han iniciado sesión recientemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay actividad reciente
                </p>
              ) : (
                recentLogins.slice(0, 5).map((login) => (
                  <div
                    key={login.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-full ${
                          login.accion === "LOGIN"
                            ? "bg-green-100"
                            : "bg-orange-100"
                        }`}
                      >
                        {login.accion === "LOGIN" ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {login.usuario_nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {login.accion === "LOGIN"
                            ? "Inició sesión"
                            : "Cerró sesión"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(login.fecha_hora), "d MMM, HH:mm", {
                        locale: es,
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
            {recentLogins.length > 5 && (
              <Link href="/admin-auditoria">
                <Button variant="ghost" size="sm" className="w-full mt-4">
                  Ver más
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen de Estado de Citas */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Citas</CardTitle>
            <CardDescription>
              Distribución de estados de todas las citas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <div className="text-2xl font-bold text-yellow-700">
                  {stats.citas.pendientes}
                </div>
                <p className="text-sm text-yellow-600">Reservadas</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-700">
                  {stats.citas.completadas}
                </div>
                <p className="text-sm text-green-600">Completadas</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <div className="text-2xl font-bold text-red-700">
                  {stats.citas.canceladas}
                </div>
                <p className="text-sm text-red-600">Canceladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
