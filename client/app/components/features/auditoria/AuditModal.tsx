"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Loader2, 
  Lock,
  Clock,
  User,
  FileText,
  Calendar,
  LogIn,
  LogOut
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { ApiRoutes } from "@/lib/api-routes"

interface AuditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
}

interface AuditLog {
  id: number
  tabla_afectada: string
  registro_id: string
  accion: string
  usuario_id: string | null
  usuario_nombre: string
  datos_anteriores: Record<string, unknown> | null
  datos_nuevos: Record<string, unknown> | null
  fecha_hora: string
}

interface LoginEntry {
  id: number
  usuario_id: string | null
  email: string | null
  accion: string
  ip_address: string | null
  fecha_hora: string
  usuario_nombre: string
}

interface TableOption {
  id: string
  label: string
}

// Mapeo de iconos por categoría
const categoryIcons: Record<string, React.ElementType> = {
  cita: Calendar,
  paciente: User,
  podologo: User,
  receta: FileText,
  detalles_receta: FileText,
  documentos_clinicos: FileText,
  ficha_evaluacion: FileText,
  gestion_ortesis: FileText,
  log_notificaciones: FileText,
}

// Colores de fondo por acción
const actionBackgrounds: Record<string, string> = {
  INSERT: "bg-green-50 border-green-200",
  UPDATE: "bg-blue-50 border-blue-200",
  DELETE: "bg-red-50 border-red-200",
}

// Mapeo de nombres de campos a etiquetas amigables
const fieldLabels: Record<string, string> = {
  tipo_pie_izq: "Tipo pie izq.",
  tipo_pie_der: "Tipo pie der.",
  pi_notas: "Notas pie izq.",
  pd_notas: "Notas pie der.",
  pi_unas: "Uñas pie izq.",
  pd_unas: "Uñas pie der.",
  tipo_calzado: "Tipo de calzado",
  actividad_fisica: "Actividad física",
  evaluacion_vascular: "Eval. vascular",
  tipo_ortesis: "Tipo de órtesis",
  talla_calzado: "Talla calzado",
  fecha_toma_molde: "Fecha toma molde",
  fecha_envio_laboratorio: "Fecha envío lab.",
  fecha_entrega_paciente: "Fecha entrega",
  observaciones_lab: "Observaciones lab.",
  observaciones_podologo: "Observaciones",
  procedimientos_realizados: "Procedimientos",
  motivo_cita: "Motivo",
  fecha_hora_inicio: "Fecha/hora",
  estado_id: "Estado",
  medicamento: "Medicamento",
  dosis: "Dosis",
  indicaciones: "Indicaciones",
  medicamentos: "Medicamentos",
  cita_id: "ID Cita",
  receta_id: "ID Receta",
}

// Formatear claves a etiquetas legibles
function formatKey(key: string): string {
  return fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Formatear valores para mostrar
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      if (value.length === 0) return "-"
      // Si es array de medicamentos, mostrar resumen
      if (value[0]?.medicamento) {
        return value.map(m => m.medicamento).join(", ")
      }
      return `${value.length} item(s)`
    }
    return JSON.stringify(value).substring(0, 100)
  }
  const str = String(value)
  // Si parece una fecha ISO, formatearla
  if (str.match(/^\d{4}-\d{2}-\d{2}T/)) {
    try {
      return format(parseISO(str), "d MMM yyyy, HH:mm", { locale: es })
    } catch {
      return str
    }
  }
  return str.length > 100 ? str.substring(0, 100) + "..." : str
}


// Función para generar descripción en lenguaje natural
function generateDescription(log: AuditLog): string {
  const usuario = log.usuario_nombre || "El sistema"
  const fecha = format(parseISO(log.fecha_hora), "d 'de' MMMM 'a las' HH:mm", { locale: es })

  // Descripciones específicas por tabla y acción
  if (log.tabla_afectada === "cita") {
    if (log.accion === "INSERT" && log.datos_nuevos) {
      const motivo = log.datos_nuevos.motivo_cita || "consulta general"
      const fechaCita = log.datos_nuevos.fecha_hora_inicio 
        ? format(parseISO(String(log.datos_nuevos.fecha_hora_inicio)), "d 'de' MMMM 'a las' HH:mm", { locale: es })
        : "fecha no especificada"
      return `${usuario} agendó una cita para "${motivo}" programada para el ${fechaCita}`
    }
    if (log.accion === "UPDATE" && log.datos_nuevos) {
      if (log.datos_nuevos.estado_id === 2) {
        return `${usuario} marcó la cita como completada`
      }
      if (log.datos_nuevos.estado_id === 3) {
        return `${usuario} canceló la cita`
      }
      if (log.datos_nuevos.fecha_hora_inicio && log.datos_anteriores?.fecha_hora_inicio) {
        const nuevaFecha = format(parseISO(String(log.datos_nuevos.fecha_hora_inicio)), "d 'de' MMMM 'a las' HH:mm", { locale: es })
        return `${usuario} reagendó la cita para el ${nuevaFecha}`
      }
      return `${usuario} actualizó información de la cita`
    }
    if (log.accion === "DELETE") {
      return `${usuario} eliminó una cita del sistema`
    }
  }

  if (log.tabla_afectada === "paciente") {
    if (log.accion === "INSERT" && log.datos_nuevos) {
      const nombre = `${log.datos_nuevos.nombres || ""} ${log.datos_nuevos.apellidos || ""}`.trim() || "nuevo paciente"
      return `Se registró al paciente ${nombre} en el sistema`
    }
    if (log.accion === "UPDATE" && log.datos_nuevos && log.datos_anteriores) {
      const cambios: string[] = []
      if (log.datos_nuevos.telefono !== log.datos_anteriores.telefono) cambios.push("teléfono")
      if (log.datos_nuevos.direccion !== log.datos_anteriores.direccion) cambios.push("dirección")
      if (log.datos_nuevos.email !== log.datos_anteriores.email) cambios.push("correo electrónico")
      if (log.datos_nuevos.estado_paciente_id !== log.datos_anteriores.estado_paciente_id) {
        return log.datos_nuevos.estado_paciente_id === 2 
          ? `${usuario} marcó al paciente como inactivo`
          : `${usuario} reactivó al paciente`
      }
      if (cambios.length > 0) {
        return `${usuario} actualizó ${cambios.join(", ")} del paciente`
      }
      return `${usuario} actualizó información del paciente`
    }
  }

  if (log.tabla_afectada === "receta" || log.tabla_afectada === "detalles_receta") {
    if (log.accion === "INSERT") {
      return `${usuario} creó una nueva receta médica`
    }
    if (log.accion === "UPDATE") {
      return `${usuario} modificó una receta médica`
    }
    if (log.accion === "DELETE") {
      return `${usuario} eliminó una receta médica`
    }
  }

  if (log.tabla_afectada === "documentos_clinicos") {
    if (log.accion === "INSERT" && log.datos_nuevos) {
      const nombre = log.datos_nuevos.nombre_archivo || "documento"
      return `${usuario} subió el documento "${nombre}"`
    }
    if (log.accion === "DELETE" && log.datos_anteriores) {
      const nombre = log.datos_anteriores.nombre_archivo || "documento"
      return `${usuario} eliminó el documento "${nombre}"`
    }
  }

  if (log.tabla_afectada === "ficha_evaluacion") {
    if (log.accion === "INSERT") {
      return `${usuario} registró una evaluación del pie`
    }
    if (log.accion === "UPDATE") {
      return `${usuario} actualizó la evaluación del pie`
    }
  }

  if (log.tabla_afectada === "gestion_ortesis") {
    if (log.accion === "INSERT" && log.datos_nuevos) {
      const tipo = log.datos_nuevos.tipo_ortesis || "órtesis"
      return `${usuario} registró una ${tipo}`
    }
    if (log.accion === "UPDATE" && log.datos_nuevos) {
      if (log.datos_nuevos.fecha_entrega_paciente) {
        return `${usuario} registró la entrega de órtesis al paciente`
      }
      if (log.datos_nuevos.fecha_envio_laboratorio) {
        return `${usuario} envió la órtesis al laboratorio`
      }
      return `${usuario} actualizó información de la órtesis`
    }
  }

  // Descripciones genéricas
  const acciones: Record<string, string> = {
    INSERT: "creó un registro",
    UPDATE: "actualizó un registro",
    DELETE: "eliminó un registro",
  }

  return `${usuario} ${acciones[log.accion] || "modificó un registro"} en ${log.tabla_afectada}`
}

export function AuditModal({ open, onOpenChange, userEmail }: AuditModalProps) {
  const [isVerified, setIsVerified] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [tables, setTables] = useState<TableOption[]>([])
  const [logs, setLogs] = useState<Record<string, AuditLog[]>>({})
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setIsVerified(false)
      setPassword("")
      setLogs({})
      setLoginHistory([])
    }
  }, [open])

  // Verify password
  const handleVerify = async () => {
    if (!password.trim()) {
      toast.error("Ingresa tu contraseña")
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch(ApiRoutes.audit.verifyPassword(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password }),
      })

      if (!response.ok) {
        throw new Error("Contraseña incorrecta")
      }

      setIsVerified(true)
      toast.success("Acceso autorizado")
      loadAuditData()
    } catch {
      toast.error("Contraseña incorrecta")
    } finally {
      setIsVerifying(false)
    }
  }

  // Load audit data
  const loadAuditData = async () => {
    setIsLoading(true)
    try {
      // Get available tables
      const tablesRes = await fetch(ApiRoutes.audit.tables())
      const tablesData = await tablesRes.json()
      setTables(tablesData)

      // Get logs for each table
      const logsPromises = tablesData.map(async (table: TableOption) => {
        const res = await fetch(ApiRoutes.audit.logs(table.id, 50))
        const data = await res.json()
        return { table: table.id, logs: data }
      })

      const logsResults = await Promise.all(logsPromises)
      const logsMap: Record<string, AuditLog[]> = {}
      logsResults.forEach(({ table, logs }) => {
        logsMap[table] = logs
      })
      setLogs(logsMap)

      // Get login history
      const historyRes = await fetch(ApiRoutes.audit.loginHistory(50))
      const historyData = await historyRes.json()
      setLoginHistory(historyData)
    } catch (error) {
      console.error("Error loading audit data:", error)
      toast.error("Error al cargar datos de auditoría")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle close button
  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl max-h-[85vh]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Módulo de Auditoría
          </DialogTitle>
          <DialogDescription>
            {isVerified 
              ? "Historial de actividad y cambios en el sistema"
              : "Ingresa tu contraseña para acceder a los registros"
            }
          </DialogDescription>
        </DialogHeader>

        {!isVerified ? (
          // Password verification step
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="audit-password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="audit-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="pl-10 pr-10"
                  disabled={isVerifying}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleVerify} 
              disabled={isVerifying || !password.trim()}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Acceder a Auditoría
                </>
              )}
            </Button>
          </div>
        ) : isLoading ? (
          // Loading state
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando registros...</span>
          </div>
        ) : (
          // Audit logs view
          <ScrollArea className="h-[60vh] pr-4">
            <Accordion type="multiple" className="w-full">
              {/* Login History Accordion */}
              <AccordionItem value="login-history">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-primary" />
                    <span>Historial de Accesos</span>
                    <Badge variant="secondary" className="ml-2">
                      {loginHistory.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    {loginHistory.length > 0 ? (
                      loginHistory.map((entry) => (
                        <div 
                          key={entry.id} 
                          className={`p-3 rounded-lg border text-sm ${
                            entry.accion === 'LOGIN' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {entry.accion === 'LOGIN' ? (
                              <LogIn className="h-4 w-4 text-green-600 shrink-0" />
                            ) : (
                              <LogOut className="h-4 w-4 text-orange-600 shrink-0" />
                            )}
                            <span>
                              <strong>{entry.usuario_nombre}</strong>{" "}
                              {entry.accion === 'LOGIN' ? 'inició sesión' : 'cerró sesión'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(entry.fecha_hora), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                            {entry.ip_address && ` • IP: ${entry.ip_address}`}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No hay registros de accesos
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Table-based Accordions */}
              {tables.map((table) => {
                const tableLogs = logs[table.id] || []
                const IconComponent = categoryIcons[table.id] || FileText

                return (
                  <AccordionItem key={table.id} value={table.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <span>{table.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {tableLogs.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-2">
                        {tableLogs.length > 0 ? (
                          tableLogs.map((log) => (
                            <div 
                              key={log.id} 
                              className={`p-3 rounded-lg border text-sm ${actionBackgrounds[log.accion] || "bg-gray-50 border-gray-200"}`}
                            >
                              <p className="font-medium">{generateDescription(log)}</p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(log.fecha_hora), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                              </p>
                              
                              {/* Detalles del cambio */}
                              {log.datos_nuevos && Object.keys(log.datos_nuevos).filter(k => k !== '_audit_usuario_nombre').length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    Ver detalles del cambio
                                  </summary>
                                  <div className="mt-2 text-xs space-y-1 bg-background/50 p-2 rounded">
                                    {log.datos_anteriores && Object.keys(log.datos_anteriores).length > 0 && (
                                      <div className="mb-2">
                                        <p className="font-medium text-red-600 mb-1">Valores anteriores:</p>
                                        {Object.entries(log.datos_anteriores)
                                          .filter(([key]) => key !== '_audit_usuario_nombre' && key !== 'fecha_modificacion')
                                          .slice(0, 10)
                                          .map(([key, value]) => (
                                            <p key={key} className="text-muted-foreground pl-2">
                                              <span className="font-medium">{key}:</span> {formatValue(value)}
                                            </p>
                                          ))}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-green-600 mb-1">
                                        {log.accion === 'INSERT' ? 'Datos creados:' : 'Nuevos valores:'}
                                      </p>
                                      {Object.entries(log.datos_nuevos)
                                        .filter(([key]) => key !== '_audit_usuario_nombre' && key !== 'fecha_modificacion' && key !== 'fecha_creacion')
                                        .slice(0, 15)
                                        .map(([key, value]) => (
                                          <p key={key} className="text-muted-foreground pl-2">
                                            <span className="font-medium">{formatKey(key)}:</span> {formatValue(value)}
                                          </p>
                                        ))}
                                    </div>
                                  </div>
                                </details>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No hay registros para esta categoría
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
