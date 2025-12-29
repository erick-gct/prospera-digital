"use client"

import { useState } from "react"
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
  Mail,
  IdCard,
  Save,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CitaGestion } from "./AppointmentsList"
import { RecetaModal, Medicamento } from "./RecetaModal"
import { OrtesisSection } from "./OrtesisSection"
import { EvaluacionPieSection } from "./EvaluacionPieSection"
import { DocumentosSection } from "./DocumentosSection"

interface AppointmentDetailProps {
  cita: CitaGestion
  onBack: () => void
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
  const [recetas, setRecetas] = useState<{ id: string; medicamentos: Medicamento[] }[]>([])
  const [activeTab, setActiveTab] = useState("observaciones")

  const citaTime = parseISO(cita.fecha_hora_inicio)
  const colors = estadoColors[cita.estado_id] || estadoColors[1]

  // Calcular edad del paciente
  const edad = cita.paciente?.fecha_nacimiento 
    ? differenceInYears(new Date(), parseISO(cita.paciente.fecha_nacimiento))
    : null

  // Guardar receta del modal
  const handleSaveReceta = (medicamentos: Medicamento[]) => {
    const nuevaReceta = {
      id: Date.now().toString(),
      medicamentos
    }
    setRecetas([...recetas, nuevaReceta])
    setRecetaModalOpen(false)
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
          <Button className="gap-2" disabled>
            <Save className="h-4 w-4" />
            Guardar Todo
          </Button>
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
            className={cn(
              "gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
            )}
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
            {recetas.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                {recetas.length}
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
                <Button onClick={() => setRecetaModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Receta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recetas.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay recetas registradas para esta cita</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recetas.map((receta, recetaIndex) => (
                    <div key={receta.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
                        <span className="font-medium text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Receta #{recetaIndex + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {receta.medicamentos.length} medicamento{receta.medicamentos.length !== 1 && 's'}
                        </span>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ortesis */}
        <TabsContent value="ortesis" className="mt-6">
          <OrtesisSection citaId={cita.id} />
        </TabsContent>

        {/* Tab: Evaluación del pie */}
        <TabsContent value="evaluacion" className="mt-6">
          <EvaluacionPieSection citaId={cita.id} />
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documentos" className="mt-6">
          <DocumentosSection citaId={cita.id} />
        </TabsContent>
      </Tabs>

      {/* Modal de Receta */}
      <RecetaModal 
        open={recetaModalOpen} 
        onOpenChange={setRecetaModalOpen}
        paciente={cita.paciente}
        onSave={handleSaveReceta}
      />
    </div>
  )
}
