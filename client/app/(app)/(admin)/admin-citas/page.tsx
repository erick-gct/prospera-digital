"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarClock,
  Filter,
  Calendar,
  User,
  Stethoscope,
  Phone,
  Mail,
  Clock,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ApiRoutes } from "@/lib/api-routes";
import { createClient } from "@/lib/supabase/cliente";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReportGeneratorModal } from "@/components/reports/ReportGeneratorModal";

interface Cita {
  id: number;
  fecha_hora_inicio: string;
  motivo_cita: string | null;
  observaciones_paciente: string | null;
  observaciones_podologo: string | null;
  procedimientos_realizados: string | null;
  estado_id: number;
  estado_nombre: string;
  paciente: {
    nombre_completo: string;
    cedula: string;
    email: string | null;
    telefono: string | null;
  } | null;
  podologo: {
    nombre_completo: string;
  } | null;
  fecha_creacion: string;
}

interface Podologo {
  id: string;
  nombre: string;
}

const estadoColors: Record<number, string> = {
  1: "border-yellow-200 bg-yellow-50 text-yellow-700",
  2: "border-green-200 bg-green-50 text-green-700",
  3: "border-red-200 bg-red-50 text-red-700",
};

const estadoNames: Record<number, string> = {
  1: "Reservada",
  2: "Completada",
  3: "Cancelada",
};

export default function AdminCitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [podologos, setPodologos] = useState<Podologo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingCitaId, setUpdatingCitaId] = useState<number | null>(null);

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [podologoFilter, setPodologoFilter] = useState("todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    reservadas: 0,
    completadas: 0,
    canceladas: 0,
  });

  const fetchCitas = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = ApiRoutes.admin.citas.list({
        estado: estadoFilter !== "todos" ? estadoFilter : undefined,
        podologoId: podologoFilter !== "todos" ? podologoFilter : undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
      });

      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) throw new Error("Error al cargar citas");

      const data: Cita[] = await res.json();
      setCitas(data);

      // Calcular estadísticas
      setStats({
        total: data.length,
        reservadas: data.filter((c) => c.estado_id === 1).length,
        completadas: data.filter((c) => c.estado_id === 2).length,
        canceladas: data.filter((c) => c.estado_id === 3).length,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la lista de citas");
    } finally {
      setIsLoading(false);
    }
  }, [estadoFilter, podologoFilter, fechaInicio, fechaFin]);

  const fetchPodologos = async () => {
    try {
      const res = await fetch(ApiRoutes.admin.podologosList);
      if (res.ok) {
        const data = await res.json();
        setPodologos(data);
      }
    } catch (error) {
      console.error("Error cargando podólogos:", error);
    }
  };

  // Cargar podólogos al inicio
  useEffect(() => {
    fetchPodologos();
    // Establecer rango de fechas del mes actual
    const now = new Date();
    setFechaInicio(format(startOfMonth(now), "yyyy-MM-dd"));
    setFechaFin(format(endOfMonth(now), "yyyy-MM-dd"));
  }, []);

  // Cargar citas cuando cambien los filtros
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const timer = setTimeout(() => {
        fetchCitas();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fetchCitas, fechaInicio, fechaFin]);

  const handleViewDetail = (cita: Cita) => {
    setSelectedCita(cita);
    setIsDetailOpen(true);
  };

  const handleStatusChange = async (citaId: number, newStatusId: string) => {
    try {
      setUpdatingCitaId(citaId);
      const numericStatus = parseInt(newStatusId, 10);
      


      // Nota: ApiRoutes.admin.citas no tiene definido updateStatus, usaremos ApiRoutes.citas.updateStatus
      const url = ApiRoutes.citas.updateStatus(citaId);
      
      // Obtener ID del usuario actual (Administrador) desde Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
          console.warn("No se pudo obtener el ID del usuario para verificar permisos de administrador");
      }

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            estadoId: numericStatus, 
            userId: userId 
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado");
      
      const data = await res.json();
      toast.success(`Estado actualizado a ${estadoNames[numericStatus]}`);
      
      // Actualizar la lista localmente
      setCitas(prev => prev.map(c => 
        c.id === citaId 
          ? { ...c, estado_id: numericStatus, estado_nombre: estadoNames[numericStatus] } 
          : c
      ));
      
      // Actualizar estadísticas también si es posible, o recargar
      fetchCitas(); 

    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el estado");
    } finally {
      setUpdatingCitaId(null);
    }
  };

  return (
    <div className="rounded-sm border bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <CalendarClock className="h-8 w-8" />
            Citas del Sistema
          </h1>
          <p className="text-muted-foreground">
            Visualiza todas las citas registradas en el sistema.
          </p>
        </div>
        <ReportGeneratorModal />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Reservadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {stats.reservadas}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {stats.completadas}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {stats.canceladas}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="rounded-lg bg-gray-50 p-4 border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Filtros
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Estado */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Estado</label>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="1">Reservadas</SelectItem>
                <SelectItem value="2">Completadas</SelectItem>
                <SelectItem value="3">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Podólogo */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Podólogo</label>
            <Select value={podologoFilter} onValueChange={setPodologoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los podólogos</SelectItem>
                {podologos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha Inicio */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          {/* Fecha Fin */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Citas */}
      <div className="rounded-md border bg-white overflow-hidden">
        {isLoading ? (
          <div className="w-full h-48 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : citas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <CalendarClock className="h-12 w-12 mb-4 opacity-50" />
            <p>No se encontraron citas con los filtros aplicados.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader className="bg-gray-50/80 sticky top-0">
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Podólogo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citas.map((cita) => (
                  <TableRow key={cita.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">
                            {format(
                              parseISO(cita.fecha_hora_inicio),
                              "d MMM yyyy",
                              { locale: es }
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(cita.fecha_hora_inicio), "HH:mm", {
                              locale: es,
                            })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cita.paciente ? (
                        <div>
                          <div className="font-medium text-sm">
                            {cita.paciente.nombre_completo}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {cita.paciente.cedula}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          N/A
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cita.podologo ? (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">
                            {cita.podologo.nombre_completo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          N/A
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm truncate max-w-[150px] block">
                        {cita.motivo_cita || (
                          <span className="text-muted-foreground italic">
                            Sin motivo
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={cita.estado_id.toString()}
                        onValueChange={(val) => handleStatusChange(cita.id, val)}
                        disabled={updatingCitaId === cita.id}
                      >
                        <SelectTrigger className={`h-8 w-[130px] ${estadoColors[cita.estado_id] || ""}`}>
                          {updatingCitaId === cita.id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                             <SelectValue>{estadoNames[cita.estado_id]}</SelectValue>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Reservada</SelectItem>
                          <SelectItem value="2">Completada</SelectItem>
                          <SelectItem value="3">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(cita)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>

      {/* Modal de Detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Detalle de Cita #{selectedCita?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedCita && (
            <div className="space-y-4">
              {/* Estado y Fecha */}
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`${
                    estadoColors[selectedCita.estado_id] || ""
                  } text-sm px-3 py-1`}
                >
                  {estadoNames[selectedCita.estado_id] ||
                    selectedCita.estado_nombre}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(
                    parseISO(selectedCita.fecha_hora_inicio),
                    "EEEE d 'de' MMMM yyyy, HH:mm",
                    { locale: es }
                  )}
                </div>
              </div>
              
              {/* Fecha de Creación */}
               <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded border">
                  <Calendar className="h-3 w-3" />
                  <span>Agendada el: {selectedCita.fecha_creacion ? format(parseISO(selectedCita.fecha_creacion), "d 'de' MMMM yyyy, HH:mm", { locale: es }) : 'N/A'}</span>
               </div>

              <Separator />

              {/* Información del Paciente */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Paciente
                </h4>
                {selectedCita.paciente ? (
                  <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                    <p className="font-medium">
                      {selectedCita.paciente.nombre_completo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cédula: {selectedCita.paciente.cedula}
                    </p>
                    <div className="flex gap-4 text-sm">
                      {selectedCita.paciente.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedCita.paciente.email}
                        </span>
                      )}
                      {selectedCita.paciente.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedCita.paciente.telefono}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Información no disponible
                  </p>
                )}
              </div>

              {/* Información del Podólogo */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Podólogo
                </h4>
                {selectedCita.podologo ? (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="font-medium">
                      {selectedCita.podologo.nombre_completo}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Información no disponible
                  </p>
                )}
              </div>

              <Separator />

              {/* Motivo y Observaciones */}
              <div className="space-y-3">
                {selectedCita.motivo_cita && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Motivo de la Cita
                    </h4>
                    <p className="text-sm">{selectedCita.motivo_cita}</p>
                  </div>
                )}
                {selectedCita.observaciones_paciente && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Observaciones del Paciente
                    </h4>
                    <p className="text-sm">
                      {selectedCita.observaciones_paciente}
                    </p>
                  </div>
                )}
                {selectedCita.procedimientos_realizados && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Procedimientos Realizados
                    </h4>
                    <p className="text-sm">
                      {selectedCita.procedimientos_realizados}
                    </p>
                  </div>
                )}
                {selectedCita.observaciones_podologo && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Observaciones del Podólogo
                    </h4>
                    <p className="text-sm">
                      {selectedCita.observaciones_podologo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
