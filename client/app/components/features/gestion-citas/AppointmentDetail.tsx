"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format, parseISO, differenceInYears } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Stethoscope,
  Pill,
  Footprints,
  ClipboardList,
  Upload,
  Phone,
  IdCard,
  Save,
  Plus,
  Loader2,
  CheckCircle2,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ApiRoutes } from "@/lib/api-routes"
import { CitaGestion } from "./AppointmentsList"
import { RecetaModal, Medicamento } from "./RecetaModal"
import { OrtesisSection, OrtesisData } from "./OrtesisSection"
import { EvaluacionPieSection, EvaluacionData } from "./EvaluacionPieSection"
import { DocumentosSection, DocumentosSectionRef } from "./DocumentosSection"

interface AppointmentDetailProps {
  cita: CitaGestion
  onBack: () => void
}

// Tipo para receta guardada
interface RecetaGuardada {
  id: string | number
  fecha_emision?: string
  medicamentos: { id?: number; medicamento: string; dosis: string; indicaciones: string }[]
}

// Colores por estado
const estadoColors: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-blue-100", text: "text-blue-700" },
  2: { bg: "bg-green-100", text: "text-green-700" },
  3: { bg: "bg-red-100", text: "text-red-600" },
}

export function AppointmentDetail({ cita, onBack }: AppointmentDetailProps) {
  // Estado centralizado para toda la información de la cita
  const [observacionesPodologo, setObservacionesPodologo] = useState(cita.observaciones_podologo || "")
  const [procedimientos, setProcedimientos] = useState(cita.procedimientos_realizados || "")
  const [recetaModalOpen, setRecetaModalOpen] = useState(false)
  const [recetasNuevas, setRecetasNuevas] = useState<{ id: string; medicamentos: Medicamento[] }[]>([])
  const [recetasGuardadas, setRecetasGuardadas] = useState<RecetaGuardada[]>([])
  const [activeTab, setActiveTab] = useState("observaciones")
  const [isSaving, setIsSaving] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [citaEstado, setCitaEstado] = useState(cita.estado_id)

  // Ref para documentos
  const documentosRef = useRef<DocumentosSectionRef>(null)

  // Estado de ortesis
  const [ortesisData, setOrtesisData] = useState<OrtesisData>({
    tipoOrtesis: "",
    talla: "",
    fechaTomaMolde: undefined,
    fechaEnvioLab: undefined,
    fechaEntregaPaciente: undefined,
    observaciones: "",
  })

  // Estado de evaluación
  const [evaluacionData, setEvaluacionData] = useState<EvaluacionData>({
    tipoPieIzq: "",
    piNotas: "",
    piUnas: "",
    tipoPieDer: "",
    pdNotas: "",
    pdUnas: "",
    tipoCalzado: "",
    actividadFisica: "",
    evaluacionVascular: "",
  })

  // --- RESTORED CODE BEGIN ---
  const citaTime = parseISO(cita.fecha_hora_inicio)
  const estadoIdActual = typeof citaEstado === 'string' ? parseInt(String(citaEstado), 10) : citaEstado
  const colors = estadoColors[estadoIdActual] || estadoColors[1]
  const isEditable = estadoIdActual !== 2 // No editable si está completada

  // Calcular edad del paciente
  const edad = cita.paciente?.fecha_nacimiento 
    ? differenceInYears(new Date(), parseISO(cita.paciente.fecha_nacimiento))
    : null

  // Cargar datos existentes
  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(ApiRoutes.citas.getDetail(cita.id))
      if (response.ok) {
        const data = await response.json()
        
        // Cargar datos de la cita
        if (data.cita) {
          setObservacionesPodologo(data.cita.observaciones_podologo || "")
          setProcedimientos(data.cita.procedimientos_realizados || "")
        }

        // Cargar evaluación
        if (data.evaluacion) {
          setEvaluacionData({
            tipoPieIzq: data.evaluacion.tipo_pie_izq || "",
            piNotas: data.evaluacion.pi_notas || "",
            piUnas: data.evaluacion.pi_unas || "",
            tipoPieDer: data.evaluacion.tipo_pie_der || "",
            pdNotas: data.evaluacion.pd_notas || "",
            pdUnas: data.evaluacion.pd_unas || "",
            tipoCalzado: data.evaluacion.tipo_calzado || "",
            actividadFisica: data.evaluacion.actividad_fisica || "",
            evaluacionVascular: data.evaluacion.evaluacion_vascular || "",
          })
        }

        // Cargar ortesis
        if (data.ortesis) {
          setOrtesisData({
            tipoOrtesis: data.ortesis.tipo_ortesis || "",
            talla: data.ortesis.talla_calzado || "",
            fechaTomaMolde: data.ortesis.fecha_toma_molde ? new Date(data.ortesis.fecha_toma_molde) : undefined,
            fechaEnvioLab: data.ortesis.fecha_envio_laboratorio ? new Date(data.ortesis.fecha_envio_laboratorio) : undefined,
            fechaEntregaPaciente: data.ortesis.fecha_entrega_paciente ? new Date(data.ortesis.fecha_entrega_paciente) : undefined,
            observaciones: data.ortesis.observaciones_lab || "",
          })
        }

        // Cargar recetas guardadas
        if (data.recetas && data.recetas.length > 0) {
          setRecetasGuardadas(data.recetas.map((r: any) => ({
            id: r.id,
            fecha_emision: r.fecha_emision,
            medicamentos: r.medicamentos.map((m: any) => ({
              id: m.id,
              medicamento: m.medicamento,
              dosis: m.dosis || "",
              indicaciones: m.indicaciones || "",
            }))
          })))
        }
      }
    } catch (error) {
      console.error('Error loading detail:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cita.id])

  // Cargar al montar
  useEffect(() => {
    loadDetail()
  }, [loadDetail])
  // --- RESTORED CODE END ---

  // Estado de edición de receta
  const [editingReceta, setEditingReceta] = useState<{
      type: 'guardada' | 'nueva',
      index: number,
      medicamentos: Medicamento[]
  } | null>(null)

  // ... (previous refs and states)

  // Handle Edit Receta
  const handleEditReceta = (receta: any, type: 'guardada' | 'nueva', index: number) => {
      // Mapear medicamentos al formato de RecetaModal
      const medicamentosFormatted = receta.medicamentos.map((m: any) => ({
          id: m.id ? String(m.id) : Date.now().toString() + Math.random(),
          nombre: m.medicamento || m.nombre, // Handle both formats
          dosis: m.dosis,
          indicaciones: m.indicaciones
      }))
      
      setEditingReceta({ type, index, medicamentos: medicamentosFormatted })
      setRecetaModalOpen(true)
  }

  // Guardar receta del modal (Nueva o Edición)
  const handleSaveReceta = (medicamentos: Medicamento[]) => {
    if (editingReceta) {
        // ACTUALIZAR EXISTENTE
        if (editingReceta.type === 'nueva') {
            const upRecetas = [...recetasNuevas]
            upRecetas[editingReceta.index] = {
                ...upRecetas[editingReceta.index],
                medicamentos
            }
            setRecetasNuevas(upRecetas)
        } else {
            // Actualizar guardada y marcar como modificada
            const upRecetas = [...recetasGuardadas] as any[]
            upRecetas[editingReceta.index] = {
                ...upRecetas[editingReceta.index],
                medicamentos: medicamentos.map(m => ({
                    id: isNaN(Number(m.id)) ? null : Number(m.id), // Keep ID if valid number
                    medicamento: m.nombre,
                    dosis: m.dosis,
                    indicaciones: m.indicaciones
                })),
                isModified: true 
            }
            setRecetasGuardadas(upRecetas)
        }
        setEditingReceta(null)
    } else {
        // CREAR NUEVA
        const nuevaReceta = {
            id: Date.now().toString(),
            medicamentos
        }
        setRecetasNuevas([...recetasNuevas, nuevaReceta])
    }
    setRecetaModalOpen(false)
  }

  // Guardar todo
  const handleSaveAll = async () => {
    setIsSaving(true)
    
    try {
      // Combinar recetas nuevas y modificadas
      const recetasPayload = [
          ...recetasNuevas.map(r => ({
             medicamentos: r.medicamentos.map(m => ({
                 nombre: m.nombre,
                 dosis: m.dosis,
                 indicaciones: m.indicaciones
             }))
          })),
          ...recetasGuardadas.filter((r: any) => r.isModified).map((r: any) => ({
              id: r.id, // ID para actualizar
              medicamentos: r.medicamentos.map((m: any) => ({
                  nombre: m.medicamento, // Note naming diff
                  dosis: m.dosis,
                  indicaciones: m.indicaciones
              }))
          }))
      ]

      const payload = {
        observaciones_podologo: observacionesPodologo,
        procedimientos_realizados: procedimientos,
        recetas: recetasPayload,
        ortesis: {
          tipo_ortesis: ortesisData.tipoOrtesis || null,
          talla_calzado: ortesisData.talla || null,
          fecha_toma_molde: ortesisData.fechaTomaMolde ? format(ortesisData.fechaTomaMolde, "yyyy-MM-dd") : null,
          fecha_envio_laboratorio: ortesisData.fechaEnvioLab ? format(ortesisData.fechaEnvioLab, "yyyy-MM-dd") : null,
          fecha_entrega_paciente: ortesisData.fechaEntregaPaciente ? format(ortesisData.fechaEntregaPaciente, "yyyy-MM-dd") : null,
          observaciones_lab: ortesisData.observaciones || null,
        },
        evaluacion: {
          tipo_pie_izq: evaluacionData.tipoPieIzq || null,
          pi_notas: evaluacionData.piNotas || null,
          pi_unas: evaluacionData.piUnas || null,
          tipo_pie_der: evaluacionData.tipoPieDer || null,
          pd_notas: evaluacionData.pdNotas || null,
          pd_unas: evaluacionData.pdUnas || null,
          tipo_calzado: evaluacionData.tipoCalzado || null,
          actividad_fisica: evaluacionData.actividadFisica || null,
          evaluacion_vascular: evaluacionData.evaluacionVascular || null,
        },
      }

      const response = await fetch(ApiRoutes.citas.updateDetail(cita.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al guardar')
      }

      // Subir documentos pendientes
      const pendingFiles = documentosRef.current?.getPendingFiles() || []
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const formData = new FormData()
          formData.append('file', file)
          await fetch(ApiRoutes.citas.uploadDocument(cita.id), {
            method: 'POST',
            body: formData,
          })
        }
        documentosRef.current?.clearPendingFiles()
        documentosRef.current?.reload()
      }

      toast.success("Datos guardados correctamente")
      // Limpiar recetas nuevas y recargar todo
      setRecetasNuevas([])
      await loadDetail()
    } catch (error) {
      console.error('Error saving:', error)
      toast.error(error instanceof Error ? error.message : "Error al guardar los datos")
    } finally {
      setIsSaving(false)
    }
  }

  // Cerrar/completar la cita
  const handleCerrarCita = async () => {
    setIsClosing(true)
    try {
      const response = await fetch(ApiRoutes.citas.updateStatus(cita.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoId: 2 }), // 2 = Completada
      })

      if (!response.ok) {
        throw new Error('Error al cerrar la cita')
      }

      toast.success('Cita cerrada exitosamente')
      setCitaEstado(2)
      await loadDetail()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cerrar la cita')
    } finally {
      setIsClosing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando información...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botón volver y guardar global */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a la lista
        </Button>
        <div className="flex items-center gap-3">
          <Badge className={cn("text-sm px-3 py-1", colors.bg, colors.text)}>
            {cita.estado_cita?.nombre || "Pendiente"}
          </Badge>
          {isEditable ? (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 text-green-600 border-green-600 hover:bg-green-50"
                    disabled={isSaving || isClosing}
                  >
                    {isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Cerrar Cita
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cerrar esta cita?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Al cerrar la cita, su estado cambiará a "Completada" y ya no podrás editarla.
                      Asegúrate de haber guardado toda la información antes de continuar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCerrarCita}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Sí, cerrar cita
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="gap-2" disabled={isSaving || isClosing}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaving ? "Guardando..." : "Guardar Todo"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar guardado?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se guardarán todos los datos ingresados: diagnóstico, tratamientos, recetas, ortesis y evaluación del pie.
                      Esta acción actualizará la información de la cita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSaveAll}>
                      Confirmar y Guardar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Badge variant="secondary">Solo lectura</Badge>
          )}
        </div>
      </div>

      {/* Información compacta de la cita */}
      <Card className="py-0">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Columna 1: Paciente */}
            {cita.paciente && (
              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  Paciente
                </h4>
                <p className="font-medium">
                  {cita.paciente.nombres} {cita.paciente.apellidos}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <IdCard className="h-3 w-3" />
                  C.I. {cita.paciente.cedula}
                  {edad && <span className="ml-2">• {edad} años</span>}
                </p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  {cita.paciente.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {cita.paciente.telefono}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Columna 2: Fecha y Hora */}
            <div className="space-y-1">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                Fecha y Hora
              </h4>
              <p className="font-medium">
                {format(citaTime, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(citaTime, "HH:mm")} hrs
              </p>
              {cita.motivo_cita && (
                <div className="mt-2">
                  <span className="text-xs font-medium text-muted-foreground">Motivo:</span>
                  <p className="text-sm bg-blue-50 px-2 py-1 rounded text-blue-900 mt-0.5">{cita.motivo_cita}</p>
                </div>
              )}
            </div>

            {/* Columna 3: Observaciones del paciente */}
            <div className="space-y-1">
              {cita.observaciones_paciente ? (
                <>
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    Observaciones del paciente
                  </h4>
                  <p className="text-sm bg-amber-50 px-2 py-1 rounded text-amber-900">
                    {cita.observaciones_paciente}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Sin observaciones del paciente
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para las diferentes secciones */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/80">
          <TabsTrigger 
            value="observaciones" 
            className="gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
          >
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">Tratamiento</span>
          </TabsTrigger>
          <TabsTrigger 
            value="receta" 
            className="gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
          >
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Receta</span>
            {(recetasGuardadas.length + recetasNuevas.length) > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                {recetasGuardadas.length + recetasNuevas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="ortesis" 
            className="gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
          >
            <Footprints className="h-4 w-4" />
            <span className="hidden sm:inline">Ortesis</span>
          </TabsTrigger>
          <TabsTrigger 
            value="evaluacion" 
            className="gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Evaluación</span>
          </TabsTrigger>
          <TabsTrigger 
            value="documentos" 
            className="gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Observaciones y Tratamiento */}
        <TabsContent value="observaciones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Diagnóstico y Tratamiento
              </CardTitle>
              <CardDescription>
                Registra las observaciones clínicas y los procedimientos realizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="observaciones">Diagnóstico y observaciones del podólogo</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Escribe el diagnóstico y observaciones clínicas aquí..."
                  value={observacionesPodologo}
                  onChange={(e) => setObservacionesPodologo(e.target.value)}
                  className="min-h-[120px]"
                  disabled={!isEditable}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedimientos">Procedimientos realizados</Label>
                <Textarea
                  id="procedimientos"
                  placeholder="Describe los procedimientos realizados durante la cita..."
                  value={procedimientos}
                  onChange={(e) => setProcedimientos(e.target.value)}
                  className="min-h-[120px]"
                  disabled={!isEditable}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Receta */}
        <TabsContent value="receta" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Recetas Médicas
                  </CardTitle>
                  <CardDescription>
                    Gestiona las recetas médicas para el paciente
                  </CardDescription>
                </div>
                {(isEditable && recetasGuardadas.length === 0 && recetasNuevas.length === 0) && (
                  <Button onClick={() => setRecetaModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Receta
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recetas guardadas */}
              {recetasGuardadas.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Recetas guardadas</h4>
                  {recetasGuardadas.map((receta, recetaIndex) => (
                    <div key={receta.id} className="border rounded-lg overflow-hidden relative">
                      {/* Flag de editado */}
                      {(receta as any).isModified && (
                        <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 flex items-center justify-center gap-1 font-medium text-center">
                           ⚠ Receta editada. Guarde los cambios generales para aplicar.
                        </div>
                      )}
                      <div className="bg-green-50 px-4 py-2 flex items-center justify-between">
                        <span className="font-medium text-sm flex items-center gap-2 text-green-700">
                          <FileText className="h-4 w-4" />
                          Receta #{recetaIndex + 1}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600">
                            {receta.medicamentos.length} medicamento{receta.medicamentos.length !== 1 && 's'}
                            </span>
                            {isEditable && (
                                <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-green-700 hover:text-green-800 hover:bg-green-100"
                                onClick={() => handleEditReceta(receta, 'guardada', recetaIndex)}
                                title="Editar receta existente"
                                >
                                <Edit className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                      </div>
                      <div className="p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Medicamento</th>
                              <th className="text-left py-2 font-medium">Dosis</th>
                              <th className="text-left py-2 font-medium">Indicaciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {receta.medicamentos.map((med, medIndex) => (
                              <tr key={med.id || medIndex} className="border-b last:border-0">
                                <td className="py-2">{med.medicamento}</td>
                                <td className="py-2">{med.dosis}</td>
                                <td className="py-2 text-muted-foreground">{med.indicaciones}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recetas nuevas (pendientes de guardar) */}
              {recetasNuevas.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-amber-600">Recetas pendientes de guardar</h4>
                  {recetasNuevas.map((receta, recetaIndex) => (
                    <div key={receta.id} className="border border-amber-200 rounded-lg overflow-hidden">
                      <div className="bg-amber-50 px-4 py-2 flex items-center justify-between">
                        <span className="font-medium text-sm flex items-center gap-2 text-amber-700">
                          <FileText className="h-4 w-4" />
                          Nueva Receta #{recetaIndex + 1}
                        </span>
                         <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-amber-600 border-amber-300">Pendiente</Badge>
                             {isEditable && (
                                <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                                onClick={() => handleEditReceta(receta, 'nueva', recetaIndex)}
                                title="Editar receta nueva"
                                >
                                <Edit className="h-3.5 w-3.5" />
                                </Button>
                            )}
                         </div>
                      </div>
                      <div className="p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Medicamento</th>
                              <th className="text-left py-2 font-medium">Dosis</th>
                              <th className="text-left py-2 font-medium">Indicaciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {receta.medicamentos.map((med) => (
                              <tr key={med.id} className="border-b last:border-0">
                                <td className="py-2">{med.nombre}</td>
                                <td className="py-2">{med.dosis}</td>
                                <td className="py-2 text-muted-foreground">{med.indicaciones}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sin recetas */}
              {recetasGuardadas.length === 0 && recetasNuevas.length === 0 && (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay recetas registradas para esta cita</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ortesis */}
        <TabsContent value="ortesis" className="mt-6">
          <OrtesisSection 
            citaId={cita.id} 
            data={ortesisData}
            onChange={setOrtesisData}
            disabled={!isEditable}
          />
        </TabsContent>

        {/* Tab: Evaluación del pie */}
        <TabsContent value="evaluacion" className="mt-6">
          <EvaluacionPieSection 
            citaId={cita.id}
            data={evaluacionData}
            onChange={setEvaluacionData}
            disabled={!isEditable}
          />
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documentos" className="mt-6">
          <DocumentosSection ref={documentosRef} citaId={cita.id} disabled={!isEditable} />
        </TabsContent>
      </Tabs>

      {/* Modal de Receta */}
      <RecetaModal 
        open={recetaModalOpen} 
        onOpenChange={(open) => {
            setRecetaModalOpen(open);
            if(!open) setEditingReceta(null);
        }}
        paciente={cita.paciente}
        onSave={handleSaveReceta}
        initialData={editingReceta ? editingReceta.medicamentos : undefined}
      />
    </div>
  )
}
