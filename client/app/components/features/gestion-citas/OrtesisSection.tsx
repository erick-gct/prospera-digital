"use client"

import { useState } from "react"
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

interface OrtesisSectionProps {
  citaId: string
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

export function OrtesisSection({ citaId }: OrtesisSectionProps) {
  const [tipoOrtesis, setTipoOrtesis] = useState("")
  const [talla, setTalla] = useState("")
  const [fechaTomaMolde, setFechaTomaMolde] = useState<Date | undefined>(undefined)
  const [fechaEnvioLab, setFechaEnvioLab] = useState<Date | undefined>(undefined)
  const [fechaEntregaPaciente, setFechaEntregaPaciente] = useState<Date | undefined>(undefined)
  const [observaciones, setObservaciones] = useState("")

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
            <Select value={tipoOrtesis} onValueChange={setTipoOrtesis}>
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
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
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
                    !fechaTomaMolde && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaTomaMolde ? format(fechaTomaMolde, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaTomaMolde}
                  onSelect={setFechaTomaMolde}
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
                    !fechaEnvioLab && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaEnvioLab ? format(fechaEnvioLab, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaEnvioLab}
                  onSelect={setFechaEnvioLab}
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
                    !fechaEntregaPaciente && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaEntregaPaciente ? format(fechaEntregaPaciente, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaEntregaPaciente}
                  onSelect={setFechaEntregaPaciente}
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
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  )
}
