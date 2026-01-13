"use client";

import {
  Users,
  Stethoscope,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

interface AdminStatsCardsProps {
  stats: {
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
  };
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const tasaCompletadas =
    stats.citas.total > 0
      ? Math.round((stats.citas.completadas / stats.citas.total) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Pacientes */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="p-2 bg-blue-100 rounded-md">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pacientes</p>
          <p className="text-lg font-semibold">
            {stats.usuarios.total_pacientes}
          </p>
          <p className="text-[10px] text-muted-foreground">
            <span className="text-green-600">
              {stats.usuarios.pacientes_activos}
            </span>{" "}
            /
            <span className="text-red-500 ml-1">
              {stats.usuarios.pacientes_inactivos}
            </span>
          </p>
        </div>
      </div>

      {/* Podólogos */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
        <div className="p-2 bg-purple-100 rounded-md">
          <Stethoscope className="h-4 w-4 text-purple-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Podólogos</p>
          <p className="text-lg font-semibold">
            {stats.usuarios.total_podologos}
          </p>
          <p className="text-[10px] text-muted-foreground">Registrados</p>
        </div>
      </div>

      {/* Citas */}
      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
        <div className="p-2 bg-green-100 rounded-md">
          <Calendar className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Citas</p>
          <p className="text-lg font-semibold">{stats.citas.total}</p>
          <div className="flex gap-1 text-[10px]">
            <span className="text-green-600 flex items-center">
              <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
              {stats.citas.completadas}
            </span>
            <span className="text-yellow-600 flex items-center">
              <Clock className="h-2.5 w-2.5 mr-0.5" />
              {stats.citas.pendientes}
            </span>
            <span className="text-red-500 flex items-center">
              <XCircle className="h-2.5 w-2.5 mr-0.5" />
              {stats.citas.canceladas}
            </span>
          </div>
        </div>
      </div>

      {/* Tasa */}
      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
        <div className="p-2 bg-amber-100 rounded-md">
          <TrendingUp className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Completadas</p>
          <p className="text-lg font-semibold">{tasaCompletadas}%</p>
          <p className="text-[10px] text-muted-foreground">Tasa de éxito</p>
        </div>
      </div>
    </div>
  );
}
