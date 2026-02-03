"use client"

import { useState, useEffect, useCallback } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Stethoscope, 
  Pill, 
  Footprints, 
  ClipboardList, 
  FileImage, 
  Calendar, 
  Loader2, 
  FileText,
  ChevronDown,
  Image as ImageIcon,
  FileIcon,
  Download,
  History,
  Clock,
  // UserMd removed
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ApiRoutes } from "@/lib/api-routes"
import { AppointmentTimeline } from "../gestion-citas/AppointmentTimeline"

interface PatientAppointmentDetailModalProps {
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
    podologo?: {
      usuario_id: string
      nombres: string
      apellidos: string
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

export function PatientAppointmentDetailModal({ citaId, open, onOpenChange }: PatientAppointmentDetailModalProps) {
  const [detail, setDetail] = useState<AppointmentFullDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!citaId) return

    setIsLoading(true)
    try {
      const response = await fetch(ApiRoutes.misCitas.detail(citaId))
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

  const isImage = (tipo: string) => tipo.startsWith('image/')
  const getFileIcon = (tipo: string) => {
    if (isImage(tipo)) return <ImageIcon className="h-4 w-4 text-blue-500" />
    if (tipo.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    return <FileIcon className="h-4 w-4 text-gray-500" />
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex flex-col gap-2">
            <DialogTitle className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              Detalle de Mi Cita
            </DialogTitle>
            
            {detail?.cita && (
              <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">
                        {format(citaDate, "EEEE, d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                     <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">
                        {format(citaDate, "h:mm a")}
                      </span>
                    </div>
                    <Badge variant="outline" className={
                      detail.cita.estado_id === 2 ? "bg-green-50 text-green-700 border-green-200" :
                      detail.cita.estado_id === 3 ? "bg-red-50 text-red-700 border-red-200" : ""
                    }>
                      {detail.cita.estado_cita?.nombre || "Pendiente"}
                    </Badge>
                 </div>

                 {detail.cita.podologo && (
                   <div className="flex items-center gap-2 text-sm text-slate-600 border-t pt-2 mt-1">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      <span>Atendido por: <span className="font-semibold">{detail.cita.podologo.nombres} {detail.cita.podologo.apellidos}</span></span>
                   </div>
                 )}
              </div>
            )}
            
            <DialogDescription className="sr-only">
              Información completa de la cita médica
            </DialogDescription>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : detail ? (
          <Tabs defaultValue="tratamiento" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-slate-100/80">
              <TabsTrigger value="tratamiento" className="gap-1 text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Stethoscope className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tratamiento</span>
              </TabsTrigger>
              <TabsTrigger value="recetas" className="gap-1 text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Pill className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Recetas</span>
                {detail.recetas.length > 0 && (
                  <Badge variant="secondary" className="h-4 w-auto min-w-[1rem] px-1 text-[9px] ml-0.5">
                    {detail.recetas.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ortesis" className="gap-1 text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Footprints className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Órtesis</span>
              </TabsTrigger>
              <TabsTrigger value="evaluacion" className="gap-1 text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ClipboardList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Evaluación</span>
              </TabsTrigger>
              <TabsTrigger value="documentos" className="gap-1 text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileImage className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Docs</span>
                {detail.documentos.length > 0 && (
                  <Badge variant="secondary" className="h-4 w-auto min-w-[1rem] px-1 text-[9px] ml-0.5">
                    {detail.documentos.length}
                  </Badge>
                )}
              </TabsTrigger>
               <TabsTrigger value="historial" className="gap-1 text-xs py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Tratamiento (Restored) */}
            <TabsContent value="tratamiento" className="space-y-4 pt-4 px-1">
              {detail.cita.motivo_cita && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Motivo de la cita</h4>
                  <p className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-100 text-slate-700">
                    {detail.cita.motivo_cita}
                  </p>
                </div>
              )}
              {detail.cita.observaciones_paciente && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Tus observaciones previas</h4>
                  <p className="bg-amber-50 p-3 rounded-lg text-sm border border-amber-100 text-slate-700">
                    {detail.cita.observaciones_paciente}
                  </p>
                </div>
              )}
              {detail.cita.observaciones_podologo && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Diagnóstico / Observaciones del Especialista</h4>
                  <p className="bg-green-50 p-3 rounded-lg text-sm whitespace-pre-wrap border border-green-100 text-slate-700">
                    {detail.cita.observaciones_podologo}
                  </p>
                </div>
              )}
              {detail.cita.procedimientos_realizados && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Procedimientos realizados</h4>
                  <p className="bg-purple-50 p-3 rounded-lg text-sm whitespace-pre-wrap border border-purple-100 text-slate-700">
                    {detail.cita.procedimientos_realizados}
                  </p>
                </div>
              )}
              {!detail.cita.observaciones_podologo && !detail.cita.procedimientos_realizados && (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">El especialista aún no ha registrado detalles del tratamiento.</p>
                </div>
              )}
            </TabsContent>

            {/* Tab: Recetas */}
            <TabsContent value="recetas" className="space-y-4 pt-4 px-1">
              {detail.recetas.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed">
                  <Pill className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No hay recetas registradas para esta cita.</p>
                </div>
              ) : (
                detail.recetas.map((receta, index) => (
                  <div key={receta.id} className="bg-white border rounded-lg p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        Receta #{index + 1}
                      </h4>
                      <Badge variant="outline" className="bg-slate-50">
                        {receta.fecha_emision 
                          ? format(parseISO(receta.fecha_emision), "d MMM yyyy", { locale: es })
                          : "Sin fecha"}
                      </Badge>
                    </div>
                    {receta.diagnostico_receta && (
                      <p className="text-sm bg-slate-50 p-2 rounded">
                        <span className="font-semibold text-slate-700">Diagnóstico:</span> {receta.diagnostico_receta}
                      </p>
                    )}
                    <div className="grid gap-2">
                      {receta.medicamentos.map((med) => (
                        <div key={med.id} className="bg-white p-3 rounded border border-slate-200 text-sm hover:border-blue-200 transition-colors">
                          <p className="font-bold text-slate-800">{med.medicamento}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-slate-600">
                            {med.dosis && <span><span className="font-medium text-xs uppercase tracking-wide text-slate-400">Dosis:</span> {med.dosis}</span>}
                            {med.indicaciones && <span><span className="font-medium text-xs uppercase tracking-wide text-slate-400">Indicaciones:</span> {med.indicaciones}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-2">
                      <a
                        href={ApiRoutes.recetas.downloadPdf(receta.id)}
                        download={`receta-${receta.id}.pdf`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
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
            <TabsContent value="ortesis" className="space-y-4 pt-4 px-1">
              {!detail.ortesis ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed">
                  <Footprints className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No hay datos de órtesis registrados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* ... ortesis content ... */}
                   {/* Keeping simplified for brevity in this replace, ensuring structure is correct */}
                   <div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 mb-2">
                      <h4 className="font-medium flex items-center gap-2 mb-2 text-blue-800">
                        <Footprints className="h-4 w-4" />
                        Detalles de la Órtesis
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                          {detail.ortesis.tipo_ortesis && (
                            <div>
                              <p className="text-xs text-blue-600 font-medium uppercase">Tipo</p>
                              <p className="font-medium">{detail.ortesis.tipo_ortesis}</p>
                            </div>
                          )}
                           {detail.ortesis.talla_calzado && (
                            <div>
                              <p className="text-xs text-blue-600 font-medium uppercase">Talla</p>
                              <p className="font-medium">{detail.ortesis.talla_calzado}</p>
                            </div>
                          )}
                      </div>
                   </div>
                   {/* Dates */}
                   <div className="grid grid-cols-3 gap-2 col-span-2 text-sm">
                      {[{ label: "Toma de Molde", date: detail.ortesis.fecha_toma_molde },
                        { label: "Envío Lab", date: detail.ortesis.fecha_envio_laboratorio },
                        { label: "Entrega", date: detail.ortesis.fecha_entrega_paciente }
                      ].map((item, i) => (
                        item.date && (
                          <div key={i} className="bg-slate-50 p-2 rounded border text-center">
                            <p className="text-xs text-slate-400 font-medium uppercase">{item.label}</p>
                            <p className="font-medium">{format(parseISO(item.date), "d MMM", { locale: es })}</p>
                          </div>
                        )
                      ))}
                   </div>
                   {detail.ortesis.observaciones_lab && (
                    <div className="col-span-2 mt-2">
                       <p className="text-sm font-medium mb-1">Observaciones</p>
                       <p className="text-sm bg-white border p-3 rounded-lg text-slate-600">{detail.ortesis.observaciones_lab}</p>
                    </div>
                   )}
                </div>
              )}
            </TabsContent>

            {/* Tab: Evaluación */}
            <TabsContent value="evaluacion" className="space-y-4 pt-4 px-1">
              {!detail.evaluacion ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed">
                  <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No hay evaluación registrada.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pie izquierdo */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500" /> Pie Izquierdo
                      </h4>
                      <div className="space-y-2 text-sm">
                        {detail.evaluacion.tipo_pie_izq && <p><span className="font-medium text-slate-600">Tipo:</span> {detail.evaluacion.tipo_pie_izq}</p>}
                        {detail.evaluacion.pi_notas && <p className="bg-white/50 p-2 rounded text-slate-600 italic">"{detail.evaluacion.pi_notas}"</p>}
                        {detail.evaluacion.pi_unas && <p><span className="font-medium text-slate-600">Uñas:</span> {detail.evaluacion.pi_unas}</p>}
                      </div>
                    </div>
                    {/* Pie derecho */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h4 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" /> Pie Derecho
                      </h4>
                      <div className="space-y-2 text-sm">
                        {detail.evaluacion.tipo_pie_der && <p><span className="font-medium text-slate-600">Tipo:</span> {detail.evaluacion.tipo_pie_der}</p>}
                        {detail.evaluacion.pd_notas && <p className="bg-white/50 p-2 rounded text-slate-600 italic">"{detail.evaluacion.pd_notas}"</p>}
                        {detail.evaluacion.pd_unas && <p><span className="font-medium text-slate-600">Uñas:</span> {detail.evaluacion.pd_unas}</p>}
                      </div>
                    </div>
                  </div>
                  {/* ... extra info ... */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                     {[{ l: "Calzado", v: detail.evaluacion.tipo_calzado }, { l: "Actividad", v: detail.evaluacion.actividad_fisica }, { l: "Vascular", v: detail.evaluacion.evaluacion_vascular }]
                       .filter(x => x.v)
                       .map((x, i) => (
                         <div key={i} className="bg-slate-50 p-3 rounded-lg border">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{x.l}</p>
                            <p className="font-medium">{x.v}</p>
                         </div>
                       ))
                     }
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Documentos */}
            <TabsContent value="documentos" className="space-y-4 pt-4 px-1">
              {detail.documentos.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed">
                  <FileImage className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No hay documentos adjuntos.</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {detail.documentos.map((doc) => (
                    <AccordionItem key={doc.id} value={`doc-${doc.id}`} className="border rounded-lg mb-2 px-2 bg-white">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.tipo_archivo)}
                          <div className="text-left">
                            <p className="font-medium text-sm text-slate-800">{doc.nombre_archivo}</p>
                            <p className="text-xs text-slate-400">
                              {format(parseISO(doc.fecha_subida), "d MMM yyyy, HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                          {isImage(doc.tipo_archivo) ? (
                            <div className="flex justify-center bg-white rounded border border-slate-100 p-2">
                              <img 
                                src={doc.url_almacenamiento} 
                                alt={doc.nombre_archivo}
                                className="max-w-full max-h-[300px] object-contain rounded"
                              />
                            </div>
                          ) : doc.tipo_archivo.includes('pdf') ? (
                            <div className="bg-white rounded border border-slate-100 overflow-hidden" style={{ height: '350px' }}>
                              <iframe
                                src={doc.url_almacenamiento}
                                className="w-full h-full"
                                title={doc.nombre_archivo}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 bg-white rounded border border-slate-100">
                              <FileIcon className="h-10 w-10 text-slate-300 mb-2" />
                              <p className="text-xs text-slate-500">Vista previa no disponible</p>
                            </div>
                          )}
                          <div className="flex justify-center">
                            <a 
                              href={doc.url_almacenamiento} 
                              download={doc.nombre_archivo}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
                            >
                              <Download className="h-4 w-4" />
                              Descargar
                            </a>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>

             {/* Tab: Historial (Trazabilidad) */}
            <TabsContent value="historial" className="space-y-4 pt-4 px-1">
               <div className="bg-white rounded-xl p-4 h-[450px] border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100">
                     <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-800">
                      <History className="h-4 w-4 text-purple-600" />
                      Línea de Tiempo de la Cita
                    </h4>
                    <Badge variant="secondary" className="text-xs font-normal bg-purple-50 text-purple-700 hover:bg-purple-100">
                        Registro de cambios
                    </Badge>
                  </div>
                  <div className="flex-1 overflow-hidden">
                     <AppointmentTimeline citaId={String(citaId)} />
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
