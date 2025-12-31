"use client"

import { useState, useEffect, useCallback } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Stethoscope, 
  Pill, 
  Footprints, 
  ClipboardList, 
  Upload, 
  Calendar, 
  Loader2, 
  ExternalLink,
  User,
  FileText,
  Download
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ApiRoutes } from "@/lib/api-routes"

interface HistorialDetailModalProps {
  citaId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AppointmentFullDetail {
  cita: {
    id: number
    fecha_hora_inicio: string
    motivo_cita: string | null
    observaciones_paciente: string | null
    observaciones_podologo: string | null
    procedimientos_realizados: string | null
    estado_id: number
    estado_cita: { id: number; nombre: string } | null
    paciente: {
      usuario_id: string
      nombres: string
      apellidos: string
      cedula: string
    } | null
  }
  evaluacion: {
    tipo_pie_izq: string | null
    pi_notas: string | null
    pi_unas: string | null
    tipo_pie_der: string | null
    pd_notas: string | null
    pd_unas: string | null
    tipo_calzado: string | null
    actividad_fisica: string | null
    evaluacion_vascular: string | null
  } | null
  ortesis: {
    tipo_ortesis: string | null
    talla_calzado: string | null
    fecha_toma_molde: string | null
    fecha_envio_laboratorio: string | null
    fecha_entrega_paciente: string | null
    observaciones_lab: string | null
  } | null
  recetas: {
    id: number
    fecha_emision: string | null
    diagnostico_receta: string | null
    medicamentos: {
      id: number
      medicamento: string
      dosis: string | null
      indicaciones: string | null
    }[]
  }[]
  documentos: {
    id: number
    url_almacenamiento: string
    nombre_archivo: string
    tipo_archivo: string
    fecha_subida: string
  }[]
}

export function HistorialDetailModal({ citaId, open, onOpenChange }: HistorialDetailModalProps) {
  const [detail, setDetail] = useState<AppointmentFullDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!citaId) return

    setIsLoading(true)
    try {
      const response = await fetch(ApiRoutes.historial.appointmentDetail(citaId))
      if (response.ok) {
        const data = await response.json()
        setDetail(data)
      }
    } catch (error) {
      console.error('Error loading detail:', error)
    } finally {
      setIsLoading(false)
    }
  }, [citaId])

  useEffect(() => {
    if (open && citaId) {
      loadDetail()
    }
  }, [open, citaId, loadDetail])

  const handleClose = () => {
    setDetail(null)
    onOpenChange(false)
  }

  if (!citaId) return null

  const citaDate = detail?.cita?.fecha_hora_inicio 
    ? parseISO(detail.cita.fecha_hora_inicio) 
    : new Date()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detalle de Cita
          </DialogTitle>
          {detail?.cita && (
            <DialogDescription asChild>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(citaDate, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                <Badge variant="outline" className="ml-2">
                  {detail.cita.estado_cita?.nombre || "Pendiente"}
                </Badge>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : detail ? (
          <Tabs defaultValue="tratamiento" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="tratamiento" className="gap-1 text-xs">
                <Stethoscope className="h-3 w-3" />
                <span className="hidden sm:inline">Tratamiento</span>
              </TabsTrigger>
              <TabsTrigger value="recetas" className="gap-1 text-xs">
                <Pill className="h-3 w-3" />
                <span className="hidden sm:inline">Recetas</span>
                {detail.recetas.length > 0 && (
                  <Badge variant="secondary" className="h-4 w-4 p-0 text-[10px]">
                    {detail.recetas.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ortesis" className="gap-1 text-xs">
                <Footprints className="h-3 w-3" />
                <span className="hidden sm:inline">Órtesis</span>
              </TabsTrigger>
              <TabsTrigger value="evaluacion" className="gap-1 text-xs">
                <ClipboardList className="h-3 w-3" />
                <span className="hidden sm:inline">Evaluación</span>
              </TabsTrigger>
              <TabsTrigger value="documentos" className="gap-1 text-xs">
                <Upload className="h-3 w-3" />
                <span className="hidden sm:inline">Docs</span>
                {detail.documentos.length > 0 && (
                  <Badge variant="secondary" className="h-4 w-4 p-0 text-[10px]">
                    {detail.documentos.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab: Tratamiento */}
            <TabsContent value="tratamiento" className="space-y-4 pt-4">
              {detail.cita.motivo_cita && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Motivo de la cita</h4>
                  <p className="bg-blue-50 p-3 rounded-lg text-sm">{detail.cita.motivo_cita}</p>
                </div>
              )}
              {detail.cita.observaciones_paciente && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Observaciones del paciente</h4>
                  <p className="bg-amber-50 p-3 rounded-lg text-sm">{detail.cita.observaciones_paciente}</p>
                </div>
              )}
              {detail.cita.observaciones_podologo && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Diagnóstico y observaciones</h4>
                  <p className="bg-green-50 p-3 rounded-lg text-sm whitespace-pre-wrap">{detail.cita.observaciones_podologo}</p>
                </div>
              )}
              {detail.cita.procedimientos_realizados && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Procedimientos realizados</h4>
                  <p className="bg-purple-50 p-3 rounded-lg text-sm whitespace-pre-wrap">{detail.cita.procedimientos_realizados}</p>
                </div>
              )}
              {!detail.cita.observaciones_podologo && !detail.cita.procedimientos_realizados && (
                <p className="text-center text-muted-foreground py-8">No hay información de tratamiento registrada</p>
              )}
            </TabsContent>

            {/* Tab: Recetas */}
            <TabsContent value="recetas" className="space-y-4 pt-4">
              {detail.recetas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay recetas registradas</p>
              ) : (
                detail.recetas.map((receta, index) => (
                  <div key={receta.id} className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-primary">Receta {index + 1}</h4>
                      <Badge variant="outline">
                        {receta.fecha_emision 
                          ? format(parseISO(receta.fecha_emision), "d MMM yyyy", { locale: es })
                          : "Sin fecha"}
                      </Badge>
                    </div>
                    {receta.diagnostico_receta && (
                      <p className="text-sm"><span className="font-medium">Diagnóstico:</span> {receta.diagnostico_receta}</p>
                    )}
                    <div className="space-y-2">
                      {receta.medicamentos.map((med) => (
                        <div key={med.id} className="bg-white p-3 rounded border text-sm">
                          <p className="font-medium">{med.medicamento}</p>
                          {med.dosis && <p className="text-muted-foreground">Dosis: {med.dosis}</p>}
                          {med.indicaciones && <p className="text-muted-foreground">Indicaciones: {med.indicaciones}</p>}
                        </div>
                      ))}
                    </div>
                    {/* Botón Descargar PDF */}
                    <div className="flex justify-end pt-2">
                      <a
                        href={ApiRoutes.recetas.downloadPdf(receta.id)}
                        download={`receta-${receta.id}.pdf`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
                      >
                        <Download className="h-4 w-4" />
                        Descargar PDF
                      </a>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab: Órtesis */}
            <TabsContent value="ortesis" className="space-y-4 pt-4">
              {!detail.ortesis ? (
                <p className="text-center text-muted-foreground py-8">No hay datos de órtesis registrados</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {detail.ortesis.tipo_ortesis && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Tipo de órtesis</p>
                      <p className="font-medium">{detail.ortesis.tipo_ortesis}</p>
                    </div>
                  )}
                  {detail.ortesis.talla_calzado && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Talla de calzado</p>
                      <p className="font-medium">{detail.ortesis.talla_calzado}</p>
                    </div>
                  )}
                  {detail.ortesis.fecha_toma_molde && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Fecha toma de molde</p>
                      <p className="font-medium">{format(parseISO(detail.ortesis.fecha_toma_molde), "d MMM yyyy", { locale: es })}</p>
                    </div>
                  )}
                  {detail.ortesis.fecha_envio_laboratorio && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Fecha envío a laboratorio</p>
                      <p className="font-medium">{format(parseISO(detail.ortesis.fecha_envio_laboratorio), "d MMM yyyy", { locale: es })}</p>
                    </div>
                  )}
                  {detail.ortesis.fecha_entrega_paciente && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Fecha entrega al paciente</p>
                      <p className="font-medium">{format(parseISO(detail.ortesis.fecha_entrega_paciente), "d MMM yyyy", { locale: es })}</p>
                    </div>
                  )}
                  {detail.ortesis.observaciones_lab && (
                    <div className="col-span-2 bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Observaciones</p>
                      <p className="text-sm">{detail.ortesis.observaciones_lab}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Tab: Evaluación */}
            <TabsContent value="evaluacion" className="space-y-4 pt-4">
              {!detail.evaluacion ? (
                <p className="text-center text-muted-foreground py-8">No hay evaluación registrada</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Pie izquierdo */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Pie Izquierdo</h4>
                      {detail.evaluacion.tipo_pie_izq && <p className="text-sm">Tipo: {detail.evaluacion.tipo_pie_izq}</p>}
                      {detail.evaluacion.pi_notas && <p className="text-sm text-muted-foreground mt-1">{detail.evaluacion.pi_notas}</p>}
                      {detail.evaluacion.pi_unas && <p className="text-sm">Uñas: {detail.evaluacion.pi_unas}</p>}
                    </div>
                    {/* Pie derecho */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Pie Derecho</h4>
                      {detail.evaluacion.tipo_pie_der && <p className="text-sm">Tipo: {detail.evaluacion.tipo_pie_der}</p>}
                      {detail.evaluacion.pd_notas && <p className="text-sm text-muted-foreground mt-1">{detail.evaluacion.pd_notas}</p>}
                      {detail.evaluacion.pd_unas && <p className="text-sm">Uñas: {detail.evaluacion.pd_unas}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {detail.evaluacion.tipo_calzado && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">Tipo de calzado</p>
                        <p className="font-medium text-sm">{detail.evaluacion.tipo_calzado}</p>
                      </div>
                    )}
                    {detail.evaluacion.actividad_fisica && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">Actividad física</p>
                        <p className="font-medium text-sm">{detail.evaluacion.actividad_fisica}</p>
                      </div>
                    )}
                    {detail.evaluacion.evaluacion_vascular && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">Evaluación vascular</p>
                        <p className="font-medium text-sm">{detail.evaluacion.evaluacion_vascular}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Documentos */}
            <TabsContent value="documentos" className="space-y-4 pt-4">
              {detail.documentos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay documentos adjuntos</p>
              ) : (
                <div className="space-y-2">
                  {detail.documentos.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{doc.nombre_archivo}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(doc.fecha_subida), "d MMM yyyy, HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.url_almacenamiento} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
