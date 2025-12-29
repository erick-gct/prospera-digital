"use client"

import { useState } from "react"
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

interface EvaluacionPieSectionProps {
  citaId: string
}

const TIPO_PIE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "plano", label: "Pie Plano" },
  { value: "cavo", label: "Pie Cavo" },
  { value: "plano_flexible", label: "Pie Plano Flexible" },
  { value: "cavo_rígido", label: "Pie Cavo Rígido" },
]

const TIPO_CALZADO_OPTIONS = [
  { value: "deportivo", label: "Deportivo" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "sandalias", label: "Sandalias" },
  { value: "botas", label: "Botas" },
  { value: "tacones", label: "Tacones" },
  { value: "mixto", label: "Mixto" },
]

export function EvaluacionPieSection({ citaId }: EvaluacionPieSectionProps) {
  // Pie izquierdo
  const [tipoPieIzq, setTipoPieIzq] = useState("")
  const [piNotas, setPiNotas] = useState("")
  const [piUnas, setPiUnas] = useState("")

  // Pie derecho
  const [tipoPieDer, setTipoPieDer] = useState("")
  const [pdNotas, setPdNotas] = useState("")
  const [pdUnas, setPdUnas] = useState("")

  // Información general
  const [tipoCalzado, setTipoCalzado] = useState("")
  const [actividadFisica, setActividadFisica] = useState("")
  const [evaluacionVascular, setEvaluacionVascular] = useState("")

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
              <Select value={tipoPieIzq} onValueChange={setTipoPieIzq}>
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
                value={piNotas}
                onChange={(e) => setPiNotas(e.target.value)}
                className="min-h-[60px] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Estado de las Uñas</Label>
              <Textarea
                placeholder="Onicomicosis, encarnadas, engrosadas..."
                value={piUnas}
                onChange={(e) => setPiUnas(e.target.value)}
                className="min-h-[50px] text-sm"
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
              <Select value={tipoPieDer} onValueChange={setTipoPieDer}>
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
                value={pdNotas}
                onChange={(e) => setPdNotas(e.target.value)}
                className="min-h-[60px] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Estado de las Uñas</Label>
              <Textarea
                placeholder="Onicomicosis, encarnadas, engrosadas..."
                value={pdUnas}
                onChange={(e) => setPdUnas(e.target.value)}
                className="min-h-[50px] text-sm"
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
                value={tipoCalzado}
                onChange={(e) => setTipoCalzado(e.target.value)}
                className="h-9"
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
                value={actividadFisica}
                onChange={(e) => setActividadFisica(e.target.value)}
                className="h-9"
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
                value={evaluacionVascular}
                onChange={(e) => setEvaluacionVascular(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
