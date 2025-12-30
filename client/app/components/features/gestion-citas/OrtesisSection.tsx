"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Footprints, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Tipo para los datos de ortesis
export interface OrtesisData {
  tipoOrtesis: string
  talla: string
  fechaTomaMolde: Date | undefined
  fechaEnvioLab: Date | undefined
  fechaEntregaPaciente: Date | undefined
  observaciones: string
}

interface OrtesisSectionProps {
  citaId: string
  data: OrtesisData
  onChange: (data: OrtesisData) => void
  disabled?: boolean
}

const TIPO_ORTESIS_OPTIONS = [
  { value: "plantilla_personalizada", label: "Plantilla Personalizada" },
  { value: "plantilla_prefabricada", label: "Plantilla Prefabricada" },
  { value: "separador_dedos", label: "Separador de Dedos" },
  { value: "protector_juanete", label: "Protector de Juanete" },
  { value: "soporte_arco", label: "Soporte de Arco" },
  { value: "talonera", label: "Talonera" },
  { value: "otro", label: "Otro" },
]

export function OrtesisSection({ citaId, data, onChange, disabled = false }: OrtesisSectionProps) {
  const updateField = <K extends keyof OrtesisData>(field: K, value: OrtesisData[K]) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Footprints className="h-5 w-5 text-primary" />
          Orden de Ortesis
        </CardTitle>
        <CardDescription>
          Registra los datos de la orden de ortesis para el paciente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primera fila: Tipo y Talla */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipo-ortesis">Tipo de Ortesis</Label>
            <Select 
              value={data.tipoOrtesis} 
              onValueChange={(v) => updateField("tipoOrtesis", v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPO_ORTESIS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="talla">Talla del Calzado</Label>
            <Input
              id="talla"
              placeholder="Ej: 42"
              value={data.talla}
              onChange={(e) => updateField("talla", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Segunda fila: Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fecha toma de molde */}
          <div className="space-y-2">
            <Label>Fecha Toma de Molde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.fechaTomaMolde && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.fechaTomaMolde ? format(data.fechaTomaMolde, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.fechaTomaMolde}
                  onSelect={(date) => updateField("fechaTomaMolde", date)}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha envío a laboratorio */}
          <div className="space-y-2">
            <Label>Fecha Envío a Laboratorio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.fechaEnvioLab && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.fechaEnvioLab ? format(data.fechaEnvioLab, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.fechaEnvioLab}
                  onSelect={(date) => updateField("fechaEnvioLab", date)}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha entrega al paciente */}
          <div className="space-y-2">
            <Label>Fecha Entrega al Paciente</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.fechaEntregaPaciente && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.fechaEntregaPaciente ? format(data.fechaEntregaPaciente, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.fechaEntregaPaciente}
                  onSelect={(date) => updateField("fechaEntregaPaciente", date)}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Observaciones */}
        <div className="space-y-2">
          <Label htmlFor="observaciones-ortesis">Estado / Observaciones del Laboratorio</Label>
          <Textarea
            id="observaciones-ortesis"
            placeholder="Especificaciones del material, estado del pedido, comunicaciones con el laboratorio, etc..."
            value={data.observaciones}
            onChange={(e) => updateField("observaciones", e.target.value)}
            className="min-h-[80px]"
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  )
}
