"use client"

import { Input } from "@/components/ui/input"
import { Search, User } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PatientFiltersProps {
  onSearchCedulaChange: (value: string) => void
  onSearchApellidoChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function PatientFilters({ onSearchCedulaChange,onSearchApellidoChange,onStatusChange }: PatientFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      {/* Buscador por Cédula/Nombre */}
      <div className="relative w-full md:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por N. de Indentificación..."
          className="pl-8 bg-white"
          onChange={(e) => onSearchCedulaChange(e.target.value)}
        />
      </div>

      {/* Buscador por Apellido */}
      <div className="relative w-full md:max-w-xs">
        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por Apellido..."
          className="pl-8 bg-white"
          onChange={(e) => onSearchApellidoChange(e.target.value)}
        />
      </div>


      {/* Filtro por Estado */}
      <div className="w-full md:w-[180px] md:ml-auto">
        <Select onValueChange={onStatusChange} defaultValue="todos">
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}