"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Shield,
  Clock,
  User,
  FileText,
  Calendar,
  LogIn,
  LogOut,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { ApiRoutes } from "@/lib/api-routes";

interface AuditLog {
  id: number;
  tabla_afectada: string;
  registro_id: string;
  accion: string;
  usuario_id: string | null;
  usuario_nombre: string;
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  fecha_hora: string;
}

interface LoginEntry {
  id: number;
  usuario_id: string | null;
  email: string | null;
  accion: string;
  ip_address: string | null;
  fecha_hora: string;
  usuario_nombre: string;
  tipo_usuario?: string;
}

interface TableOption {
  id: string;
  label: string;
}

// Mapeo de iconos por categoría
const categoryIcons: Record<string, React.ElementType> = {
  cita: Calendar,
  paciente: User,
  podologo: User,
  receta: FileText,
  detalles_receta: FileText,
  documentos_clinicos: FileText,
  ficha_evaluacion: FileText,
  gestion_ortesis: FileText,
  log_notificaciones: FileText,
};

// Colores de fondo por acción
const actionBackgrounds: Record<string, string> = {
  INSERT: "bg-green-50 border-green-200",
  UPDATE: "bg-blue-50 border-blue-200",
  DELETE: "bg-red-50 border-red-200",
};

// Mapeo de nombres de campos
const fieldLabels: Record<string, string> = {
  tipo_pie_izq: "Tipo pie izq.",
  tipo_pie_der: "Tipo pie der.",
  motivo_cita: "Motivo",
  fecha_hora_inicio: "Fecha/hora",
  estado_id: "Estado",
  medicamento: "Medicamento",
};

function formatKey(key: string): string {
  return (
    fieldLabels[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      if (value.length === 0) return "-";
      if (value[0]?.medicamento) {
        return value.map((m) => m.medicamento).join(", ");
      }
      return `${value.length} item(s)`;
    }
    return JSON.stringify(value).substring(0, 100);
  }
  const str = String(value);
  if (str.match(/^\d{4}-\d{2}-\d{2}T/)) {
    try {
      return format(parseISO(str), "d MMM yyyy, HH:mm", { locale: es });
    } catch {
      return str;
    }
  }
  return str.length > 100 ? str.substring(0, 100) + "..." : str;
}

function generateDescription(log: AuditLog): string {
  const usuario = log.usuario_nombre || "El sistema";

  if (log.tabla_afectada === "cita") {
    if (log.accion === "INSERT") return `${usuario} agendó una nueva cita`;
    if (log.accion === "UPDATE") {
      if (log.datos_nuevos?.estado_id === 2)
        return `${usuario} marcó la cita como completada`;
      if (log.datos_nuevos?.estado_id === 3)
        return `${usuario} canceló la cita`;
      return `${usuario} actualizó información de la cita`;
    }
    if (log.accion === "DELETE") return `${usuario} eliminó una cita`;
  }

  if (log.tabla_afectada === "paciente") {
    if (log.accion === "INSERT") return `Se registró un nuevo paciente`;
    if (log.accion === "UPDATE") {
      if (log.datos_nuevos?.estado_paciente_id === 2)
        return `${usuario} desactivó un paciente`;
      if (log.datos_nuevos?.estado_paciente_id === 1)
        return `${usuario} reactivó un paciente`;
      return `${usuario} actualizó información del paciente`;
    }
  }

  const acciones: Record<string, string> = {
    INSERT: "creó un registro",
    UPDATE: "actualizó un registro",
    DELETE: "eliminó un registro",
  };

  return `${usuario} ${acciones[log.accion] || "modificó un registro"} en ${
    log.tabla_afectada
  }`;
}

export default function AdminAuditoriaPage() {
  const [tables, setTables] = useState<TableOption[]>([]);
  const [logs, setLogs] = useState<Record<string, AuditLog[]>>({});
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>("all");

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchTables(), fetchLogs(), fetchLoginHistory()]);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos de auditoría");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const fetchTables = async () => {
    const res = await fetch(ApiRoutes.admin.auditoria.tables);
    if (res.ok) {
      const data = await res.json();
      setTables(data);
    }
  };

  const fetchLogs = async (table?: string) => {
    const url = ApiRoutes.admin.auditoria.logs(
      table && table !== "all" ? table : undefined,
      200
    );
    const res = await fetch(url);
    if (res.ok) {
      const data: AuditLog[] = await res.json();

      // Agrupar por tabla
      const grouped: Record<string, AuditLog[]> = {};
      data.forEach((log) => {
        if (!grouped[log.tabla_afectada]) {
          grouped[log.tabla_afectada] = [];
        }
        grouped[log.tabla_afectada].push(log);
      });
      setLogs(grouped);
    }
  };

  const fetchLoginHistory = async () => {
    const res = await fetch(ApiRoutes.admin.auditoria.loginHistory(100));
    if (res.ok) {
      const data = await res.json();
      setLoginHistory(data);
    }
  };

  const handleTableChange = async (value: string) => {
    setSelectedTable(value);
    setIsLoading(true);
    await fetchLogs(value);
    setIsLoading(false);
  };

  const handleRefresh = () => {
    fetchAllData();
    toast.success("Datos actualizados");
  };

  return (
    <div className="rounded-sm border bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Auditoría del Sistema
          </h1>
          <p className="text-muted-foreground">
            Visualiza todas las acciones y cambios realizados en el sistema.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cambios" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="cambios">
            <FileText className="h-4 w-4 mr-2" />
            Cambios en Datos
          </TabsTrigger>
          <TabsTrigger value="accesos">
            <LogIn className="h-4 w-4 mr-2" />
            Historial de Accesos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Cambios en Datos */}
        <TabsContent value="cambios" className="space-y-4">
          {/* Filtro por tabla */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Filtrar por tabla:
            </span>
            <Select value={selectedTable} onValueChange={handleTableChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas las tablas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tablas</SelectItem>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de logs */}
          <ScrollArea className="h-[600px] rounded-md border p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : Object.keys(logs).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>No hay registros de auditoría</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(logs).map(([tabla, registros]) => {
                  const IconComponent = categoryIcons[tabla] || FileText;
                  return (
                    <AccordionItem
                      key={tabla}
                      value={tabla}
                      className="border rounded-lg"
                    >
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <span className="font-medium capitalize">
                            {tabla.replace(/_/g, " ")}
                          </span>
                          <Badge variant="secondary">{registros.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {registros.map((log) => (
                            <div
                              key={log.id}
                              className={`rounded-lg border p-4 ${
                                actionBackgrounds[log.accion] || "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm">
                                    {generateDescription(log)}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    {format(
                                      parseISO(log.fecha_hora),
                                      "d 'de' MMMM yyyy, HH:mm",
                                      { locale: es }
                                    )}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    log.accion === "INSERT"
                                      ? "default"
                                      : log.accion === "UPDATE"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                >
                                  {log.accion}
                                </Badge>
                              </div>

                              {/* Datos modificados */}
                              {log.datos_nuevos &&
                                Object.keys(log.datos_nuevos).filter(
                                  (k) => !k.startsWith("_")
                                ).length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-dashed">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                      Datos modificados:
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(log.datos_nuevos)
                                        .filter(([key]) => !key.startsWith("_"))
                                        .slice(0, 6)
                                        .map(([key, value]) => (
                                          <div key={key} className="text-xs">
                                            <span className="text-muted-foreground">
                                              {formatKey(key)}:{" "}
                                            </span>
                                            <span className="font-medium">
                                              {formatValue(value)}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Tab: Historial de Accesos */}
        <TabsContent value="accesos" className="space-y-4">
          <ScrollArea className="h-[600px] rounded-md border">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <LogIn className="h-12 w-12 mb-4 opacity-50" />
                <p>No hay registros de acceso</p>
              </div>
            ) : (
              <div className="divide-y">
                {loginHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            entry.accion === "LOGIN"
                              ? "bg-green-100"
                              : "bg-orange-100"
                          }`}
                        >
                          {entry.accion === "LOGIN" ? (
                            <LogIn className="h-4 w-4 text-green-600" />
                          ) : (
                            <LogOut className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {entry.usuario_nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.accion === "LOGIN"
                              ? "Inició sesión"
                              : "Cerró sesión"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            entry.tipo_usuario === "PODOLOGO"
                              ? "border-purple-200 bg-purple-50 text-purple-700"
                              : entry.tipo_usuario === "ADMINISTRADOR"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-blue-200 bg-blue-50 text-blue-700"
                          }
                        >
                          {entry.tipo_usuario || "PACIENTE"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(
                            parseISO(entry.fecha_hora),
                            "d MMM yyyy, HH:mm",
                            { locale: es }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
