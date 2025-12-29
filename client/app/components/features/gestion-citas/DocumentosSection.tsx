"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, X, File, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DocumentosSectionProps {
  citaId: string
}

interface ArchivoSubido {
  id: string
  nombre: string
  tipo: string
  tamaño: number
}

export function DocumentosSection({ citaId }: DocumentosSectionProps) {
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    agregarArchivos(files)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      agregarArchivos(files)
    }
  }

  const agregarArchivos = (files: File[]) => {
    const nuevosArchivos: ArchivoSubido[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nombre: file.name,
      tipo: file.type,
      tamaño: file.size,
    }))
    setArchivos(prev => [...prev, ...nuevosArchivos])
  }

  const eliminarArchivo = (id: string) => {
    setArchivos(prev => prev.filter(a => a.id !== id))
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Documentos y Archivos
        </CardTitle>
        <CardDescription>
          Sube fotografías, radiografías u otros documentos relacionados con la cita
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zona de arrastre */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          )}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className={cn(
            "h-12 w-12 mx-auto mb-4 transition-colors",
            isDragging ? "text-primary" : "text-gray-400"
          )} />
          <p className="text-lg font-medium text-gray-700">
            Arrastra y suelta archivos aquí
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Formatos permitidos: JPG, PNG, PDF, DICOM (máx. 10MB)
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Lista de archivos */}
        {archivos.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Archivos seleccionados ({archivos.length})
            </h4>
            <div className="space-y-2">
              {archivos.map((archivo) => (
                <div
                  key={archivo.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(archivo.tipo)}
                    <div>
                      <p className="font-medium text-sm">{archivo.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(archivo.tamaño)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarArchivo(archivo.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón guardar */}
        {archivos.length > 0 && (
          <div className="flex justify-end">
            <Button className="gap-2" disabled>
              <Upload className="h-4 w-4" />
              Subir Documentos
            </Button>
          </div>
        )}

        {/* Documentos existentes (placeholder) */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">
            Documentos guardados
          </h4>
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay documentos guardados para esta cita</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
