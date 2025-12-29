"use client"

import { useState } from "react"
import { Plus, Trash2, Pill, Save, Syringe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface Medicamento {
  id: string
  nombre: string
  dosis: string
  indicaciones: string
}

interface RecetaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paciente: {
    nombres: string
    apellidos: string
    cedula: string
  } | null
  onSave: (medicamentos: Medicamento[]) => void
}

export function RecetaModal({ open, onOpenChange, paciente, onSave }: RecetaModalProps) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([
    { id: "1", nombre: "", dosis: "", indicaciones: "" }
  ])

  const addMedicamento = () => {
    setMedicamentos([
      ...medicamentos,
      { id: Date.now().toString(), nombre: "", dosis: "", indicaciones: "" }
    ])
  }

  const removeMedicamento = (id: string) => {
    if (medicamentos.length > 1) {
      setMedicamentos(medicamentos.filter(m => m.id !== id))
    }
  }

  const updateMedicamento = (id: string, field: keyof Medicamento, value: string) => {
    setMedicamentos(medicamentos.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const handleSave = () => {
    // Filtrar medicamentos vacíos
    const medicamentosValidos = medicamentos.filter(m => m.nombre.trim() !== "")
    if (medicamentosValidos.length > 0) {
      onSave(medicamentosValidos)
      // Resetear para próxima receta
      setMedicamentos([{ id: "1", nombre: "", dosis: "", indicaciones: "" }])
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Resetear
    setMedicamentos([{ id: "1", nombre: "", dosis: "", indicaciones: "" }])
  }

  const isValid = medicamentos.some(m => m.nombre.trim() !== "")

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pill className="h-6 w-6 text-primary" />
            Nueva Receta Médica
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              Paciente: <strong>{paciente?.nombres} {paciente?.apellidos}</strong>
            </span>
            <span className="text-muted-foreground">• C.I. {paciente?.cedula}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Header de la tabla */}
          <div className="grid grid-cols-12 gap-3 mb-2 px-2">
            <div className="col-span-4">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Medicamento
              </Label>
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Dosis
              </Label>
            </div>
            <div className="col-span-5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Indicaciones
              </Label>
            </div>
            <div className="col-span-1"></div>
          </div>

          {/* Lista de medicamentos */}
          <div className="space-y-2">
            {medicamentos.map((med, index) => (
              <div 
                key={med.id} 
                className="grid grid-cols-12 gap-3 p-3 bg-muted/30 rounded-lg items-center"
              >
                <div className="col-span-4 flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Nombre del medicamento"
                    value={med.nombre}
                    onChange={(e) => updateMedicamento(med.id, "nombre", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="Ej: 500mg"
                    value={med.dosis}
                    onChange={(e) => updateMedicamento(med.id, "dosis", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    placeholder="Ej: 1 cada 8 horas por 7 días"
                    value={med.indicaciones}
                    onChange={(e) => updateMedicamento(med.id, "indicaciones", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {medicamentos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMedicamento(med.id)}
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botón agregar */}
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addMedicamento} 
            className="mt-3 gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar medicamento
          </Button>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={!isValid}>
            <Save className="h-4 w-4" />
            Guardar Receta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
