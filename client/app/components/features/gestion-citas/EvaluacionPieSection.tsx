"use client"

import { ClipboardList, Footprints, Activity, Heart, Shirt } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Tipo para los datos de evaluación
export interface EvaluacionData {
  tipoPieIzq: string
  piNotas: string
  piUnas: string
  tipoPieDer: string
  pdNotas: string
  pdUnas: string
  tipoCalzado: string
  actividadFisica: string
  evaluacionVascular: string
}

interface EvaluacionPieSectionProps {
  citaId: string
  data: EvaluacionData
  onChange: (data: EvaluacionData) => void
  disabled?: boolean
}

const TIPO_PIE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "plano", label: "Pie Plano" },
  { value: "cavo", label: "Pie Cavo" },
  { value: "plano_flexible", label: "Pie Plano Flexible" },
  { value: "cavo_rígido", label: "Pie Cavo Rígido" },
]

export function EvaluacionPieSection({ citaId, data, onChange, disabled = false }: EvaluacionPieSectionProps) {
  const updateField = <K extends keyof EvaluacionData>(field: K, value: EvaluacionData[K]) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Ficha de Evaluación del Pie
        </CardTitle>
        <CardDescription>
          Completa la evaluación podológica del paciente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Evaluación por pie - 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pie Izquierdo */}
          <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
            <h4 className="font-semibold flex items-center gap-2 text-base border-b pb-2">
              <Footprints className="h-4 w-4 text-primary" />
              Pie Izquierdo
            </h4>
            
            <div className="space-y-2">
              <Label className="text-sm">Tipo de Pie</Label>
              <Select 
                value={data.tipoPieIzq} 
                onValueChange={(v) => updateField("tipoPieIzq", v)}
                disabled={disabled}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_PIE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Notas / Condición</Label>
              <Textarea
                placeholder="Gravedad, deformidades, hallazgos..."
                value={data.piNotas}
                onChange={(e) => updateField("piNotas", e.target.value)}
                className="min-h-[60px] text-sm"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Estado de las Uñas</Label>
              <Textarea
                placeholder="Onicomicosis, encarnadas, engrosadas..."
                value={data.piUnas}
                onChange={(e) => updateField("piUnas", e.target.value)}
                className="min-h-[50px] text-sm"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Pie Derecho */}
          <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
            <h4 className="font-semibold flex items-center gap-2 text-base border-b pb-2">
              <Footprints className="h-4 w-4 text-primary transform scale-x-[-1]" />
              Pie Derecho
            </h4>
            
            <div className="space-y-2">
              <Label className="text-sm">Tipo de Pie</Label>
              <Select 
                value={data.tipoPieDer} 
                onValueChange={(v) => updateField("tipoPieDer", v)}
                disabled={disabled}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_PIE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Notas / Condición</Label>
              <Textarea
                placeholder="Gravedad, deformidades, hallazgos..."
                value={data.pdNotas}
                onChange={(e) => updateField("pdNotas", e.target.value)}
                className="min-h-[60px] text-sm"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Estado de las Uñas</Label>
              <Textarea
                placeholder="Onicomicosis, encarnadas, engrosadas..."
                value={data.pdUnas}
                onChange={(e) => updateField("pdUnas", e.target.value)}
                className="min-h-[50px] text-sm"
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Información General - 3 columnas */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-base mb-4">Información General</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de calzado */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Shirt className="h-4 w-4 text-muted-foreground" />
                Tipo de Calzado Habitual
              </Label>
              <Input
                placeholder="Deportivo, formal, casual..."
                value={data.tipoCalzado}
                onChange={(e) => updateField("tipoCalzado", e.target.value)}
                className="h-9"
                disabled={disabled}
              />
            </div>

            {/* Actividad física */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Actividad Física
              </Label>
              <Input
                placeholder="Tipo y frecuencia..."
                value={data.actividadFisica}
                onChange={(e) => updateField("actividadFisica", e.target.value)}
                className="h-9"
                disabled={disabled}
              />
            </div>

            {/* Evaluación vascular */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-muted-foreground" />
                Evaluación Vascular
              </Label>
              <Input
                placeholder="Pulsos, temperatura, coloración..."
                value={data.evaluacionVascular}
                onChange={(e) => updateField("evaluacionVascular", e.target.value)}
                className="h-9"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
