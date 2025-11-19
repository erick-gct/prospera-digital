"use client"

import * as React from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  type PanelRef, 
} from "@/components/ui/resizable"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/app/components/layout/sidebar"
import { AppHeader } from "@/app/components/layout/header"
import { AppFooter } from "@/app/components/layout/footer-app"
// 1. Importar el Toaster
import { Toaster } from "@/components/ui/sonner"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Estado para saber si el sidebar está colapsado
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const panelRef = useRef<PanelRef>(null)

  // 3. Creamos la función de toggle
  const toggleSidebar = () => {
    if (panelRef.current) {
      if (isCollapsed) {
        panelRef.current.expand() // Usamos el método expand()
      } else {
        panelRef.current.collapse() // Usamos el método collapse()
      }
    }
  }
  
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-screen w-full"
    >
      {/* Panel 1: El Sidebar */}
      <ResizablePanel
        ref={panelRef}
        collapsible={true}
        collapsedSize={4} // Tamaño en % cuando está colapsado
        minSize={15}      // Ancho mínimo
        maxSize={20}      // Ancho máximo
        defaultSize={20}
        onCollapse={() => {
          setIsCollapsed(true)
        }}
        onExpand={() => {
          setIsCollapsed(false)
        }}
        className="h-full"
      >
        {/* Pasamos el estado al componente Sidebar */}
        <AppSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      </ResizablePanel>

      {/* El "agarrador" para redimensionar */}
      <ResizableHandle withHandle />

      {/* Panel 2: El Contenido Principal */}
      <ResizablePanel defaultSize={80}>
        <div className="flex h-full flex-col">
          {/* 1. Header Fijo */}
          <AppHeader />
          
          {/* 2. Contenido Principal (con scroll) */}
          <main className="flex-1 overflow-y-auto bg-muted/50 p-6">
            {children}
          </main>
          
          {/* 3. Footer Fijo */}
          <AppFooter />
        </div>

         {/* 2. Añadir el Toaster aquí */}
        <Toaster richColors position="bottom-right" />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}