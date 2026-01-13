"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  Search,
  FileText,
  Image,
  File,
  Download,
  Eye,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileImage,
  FileType,
} from "lucide-react";
import { ApiRoutes } from "@/lib/api-routes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Documento {
  id: number;
  url_almacenamiento: string;
  nombre_archivo: string;
  tipo_archivo: string;
  fecha_subida: string;
  cita_id: number;
  fecha_cita: string;
}

interface PacienteDocumentos {
  paciente: {
    usuario_id: string;
    nombres: string;
    apellidos: string;
    cedula: string;
    email: string;
  };
  documentos: Documento[];
  totalDocumentos: number;
}

interface DocumentStats {
  totalDocumentos: number;
  pacientesConDocumentos: number;
  documentosPorTipo: Record<string, number>;
}

export default function AdminDocumentosPage() {
  const [pacientes, setPacientes] = useState<PacienteDocumentos[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(
    new Set()
  );

  // Preview dialog
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const res = await fetch(ApiRoutes.admin.documentos.stats);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  // Cargar documentos
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = ApiRoutes.admin.documentos.list({
        search: searchQuery || undefined,
      });

      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar documentos");

      const data = await res.json();
      setPacientes(data.pacientes || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  const togglePatient = (patientId: string) => {
    setExpandedPatients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.includes("image"))
      return <FileImage className="h-4 w-4 text-blue-500" />;
    if (tipo.includes("pdf"))
      return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePreview = (doc: Documento) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const isImage = (tipo: string) => tipo.includes("image");
  const isPdf = (tipo: string) => tipo.includes("pdf");

  return (
    <div className="rounded-sm border bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <FolderOpen className="h-8 w-8" />
          Documentos del Sistema
        </h1>
        <p className="text-muted-foreground">
          Visualiza todos los documentos clínicos organizados por paciente.
        </p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="p-2 bg-blue-100 rounded-md">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Documentos</p>
              <p className="text-lg font-semibold">{stats.totalDocumentos}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="p-2 bg-green-100 rounded-md">
              <User className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pacientes</p>
              <p className="text-lg font-semibold">
                {stats.pacientesConDocumentos}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Con documentos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="p-2 bg-purple-100 rounded-md">
              <FileImage className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Imágenes</p>
              <p className="text-lg font-semibold">
                {Object.entries(stats.documentosPorTipo)
                  .filter(([k]) => k.includes("image"))
                  .reduce((sum, [, v]) => sum + v, 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="p-2 bg-red-100 rounded-md">
              <FileType className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">PDFs</p>
              <p className="text-lg font-semibold">
                {Object.entries(stats.documentosPorTipo)
                  .filter(([k]) => k.includes("pdf"))
                  .reduce((sum, [, v]) => sum + v, 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, cédula o nombre de archivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          {pacientes.length} paciente{pacientes.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Lista de pacientes con documentos */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pacientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/5">
            <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
            <p>No se encontraron documentos.</p>
            {searchQuery && (
              <p className="text-sm">Intenta con otra búsqueda.</p>
            )}
          </div>
        ) : (
          pacientes.map((item) => (
            <Collapsible
              key={item.paciente.usuario_id}
              open={expandedPatients.has(item.paciente.usuario_id)}
              onOpenChange={() => togglePatient(item.paciente.usuario_id)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {item.paciente.nombres?.[0]}
                            {item.paciente.apellidos?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {item.paciente.apellidos}, {item.paciente.nombres}
                            <Badge variant="secondary" className="ml-2">
                              {item.totalDocumentos} archivo
                              {item.totalDocumentos !== 1 ? "s" : ""}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-3 mt-0.5">
                            <span>CI: {item.paciente.cedula}</span>
                            {item.paciente.email && (
                              <span className="text-xs">
                                {item.paciente.email}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      {expandedPatients.has(item.paciente.usuario_id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">
                              Archivo
                            </th>
                            <th className="text-left p-3 font-medium">Tipo</th>
                            <th className="text-left p-3 font-medium">
                              Fecha Subida
                            </th>
                            <th className="text-left p-3 font-medium">Cita</th>
                            <th className="text-right p-3 font-medium">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.documentos.map((doc) => (
                            <tr
                              key={doc.id}
                              className="border-t hover:bg-muted/20"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {getFileIcon(doc.tipo_archivo)}
                                  <span
                                    className="truncate max-w-[200px]"
                                    title={doc.nombre_archivo}
                                  >
                                    {doc.nombre_archivo}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">
                                  {doc.tipo_archivo
                                    .split("/")[1]
                                    ?.toUpperCase() || "Archivo"}
                                </Badge>
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {formatDate(doc.fecha_subida)}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span className="text-xs">
                                    {doc.fecha_cita
                                      ? new Date(
                                          doc.fecha_cita
                                        ).toLocaleDateString("es-ES")
                                      : `#${doc.cita_id}`}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {(isImage(doc.tipo_archivo) ||
                                    isPdf(doc.tipo_archivo)) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePreview(doc)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" asChild>
                                    <a
                                      href={doc.url_almacenamiento}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewDoc && getFileIcon(previewDoc.tipo_archivo)}
              {previewDoc?.nombre_archivo}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-auto max-h-[70vh]">
            {previewDoc && isImage(previewDoc.tipo_archivo) && (
              <img
                src={previewDoc.url_almacenamiento}
                alt={previewDoc.nombre_archivo}
                className="max-w-full max-h-[65vh] object-contain"
              />
            )}
            {previewDoc && isPdf(previewDoc.tipo_archivo) && (
              <iframe
                src={previewDoc.url_almacenamiento}
                className="w-full h-[65vh]"
                title={previewDoc.nombre_archivo}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
