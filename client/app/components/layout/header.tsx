"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Clock, LogOut } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function AppHeader() {
  const [time, setTime] = useState("")

  useEffect(() => {
    // Actualiza la hora cada segundo
    const timerId = setInterval(() => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }, 1000)

    // Limpia el intervalo cuando el componente se desmonta
    return () => clearInterval(timerId)
  }, [])

  return (
    <>
      <header className="flex h-16 items-center justify-between gap-4 bg-background px-6">
        {/* Lado Izquierdo: Hora */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{time}</span>
        </div>

        {/* Lado Derecho: Botón de Salir */}
        <div>
          <Button variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>
      <Separator />
    </>
  )
}