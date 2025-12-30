"use client"

import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react"
import { Upload, FileText, X, File, Image, Loader2, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ApiRoutes } from "@/lib/api-routes"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface DocumentosSectionProps {
  citaId: string
  disabled?: boolean
}

interface ArchivoSeleccionado {
  id: string
  file: File
  nombre: string
  tipo: string
  tamaño: number
}

interface DocumentoGuardado {
  id: number
  url_almacenamiento: string
  nombre_archivo: string
  tipo_archivo: string
  fecha_subida: string
}

// Métodos expuestos al padre
export interface DocumentosSectionRef {
  getPendingFiles: () => File[]
  clearPendingFiles: () => void
  hasPendingFiles: () => boolean
  reload: () => void
}

export const DocumentosSection = forwardRef<DocumentosSectionRef, DocumentosSectionProps>(
  function DocumentosSection({ citaId, disabled = false }, ref) {
    const [archivosSeleccionados, setArchivosSeleccionados] = useState<ArchivoSeleccionado[]>([])
    const [documentosGuardados, setDocumentosGuardados] = useState<DocumentoGuardado[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Exponer métodos al padre
    useImperativeHandle(ref, () => ({
      getPendingFiles: () => archivosSeleccionados.map(a => a.file),
      clearPendingFiles: () => setArchivosSeleccionados([]),
      hasPendingFiles: () => archivosSeleccionados.length > 0,
      reload: () => loadDocuments(),
    }))

    // Cargar documentos existentes
    const loadDocuments = useCallback(async () => {
      try {
        const response = await fetch(ApiRoutes.citas.getDocuments(citaId))
        if (response.ok) {
          const data = await response.json()
          setDocumentosGuardados(data)
        }
      } catch (error) {
        console.error('Error loading documents:', error)
      } finally {
        setIsLoading(false)
      }
    }, [citaId])

    useEffect(() => {
      loadDocuments()
    }, [loadDocuments])

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setIsDragging(true)
    }, [disabled])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return
      
      const files = Array.from(e.dataTransfer.files)
      agregarArchivos(files)
    }, [disabled])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && !disabled) {
        const files = Array.from(e.target.files)
        agregarArchivos(files)
      }
    }

    const agregarArchivos = (files: File[]) => {
      const nuevosArchivos: ArchivoSeleccionado[] = files.map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        nombre: file.name,
        tipo: file.type,
        tamaño: file.size,
      }))
      setArchivosSeleccionados(prev => [...prev, ...nuevosArchivos])
    }

    const eliminarArchivoSeleccionado = (id: string) => {
      setArchivosSeleccionados(prev => prev.filter(a => a.id !== id))
    }

    const handleDeleteDocument = async (documentId: number) => {
      try {
        const response = await fetch(ApiRoutes.citas.deleteDocument(documentId), {
          method: 'DELETE',
        })

        if (response.ok) {
          toast.success("Documento eliminado")
          loadDocuments()
        } else {
          throw new Error('Error al eliminar')
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error("Error al eliminar documento")
      }
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
          {!disabled && (
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
                Formatos permitidos: JPG, PNG, PDF, GIF, WebP (máx. 10MB)
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
          )}

          {/* Archivos seleccionados (pendientes de subir) */}
          {archivosSeleccionados.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-amber-600">
                📁 Archivos pendientes ({archivosSeleccionados.length}) - Se subirán al guardar
              </h4>
              <div className="space-y-2">
                {archivosSeleccionados.map((archivo) => (
                  <div
                    key={archivo.id}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
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
                      onClick={() => eliminarArchivoSeleccionado(archivo.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentos guardados */}
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Documentos guardados
            </h4>
            
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : documentosGuardados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay documentos guardados para esta cita</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documentosGuardados.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.tipo_archivo)}
                      <div>
                        <p className="font-medium text-sm">{doc.nombre_archivo}</p>
                        <p className="text-xs text-muted-foreground">
                          Subido el {format(parseISO(doc.fecha_subida), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <a href={doc.url_almacenamiento} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      {!disabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
