"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
  User,
  CalendarPlus,
  CalendarCheck,
  PanelLeft,
  Stethoscope,
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  ClipboardList,
  Footprints,
} from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/cliente"

type NavLink = {
  href: string
  label: string
  icon: React.ElementType
}

// --- ENLACES PACIENTE ---
const patientLinks: NavLink[] = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/perfil", label: "Mi Perfil", icon: User },
  { href: "/reserva-cita", label: "Agendar Cita", icon: CalendarPlus },
  { href: "/mis-citas", label: "Mis Citas", icon: CalendarCheck },
]

// --- ENLACES PODÓLOGO ---
const podiatristLinks: NavLink[] = [
  { href: "/dashboard", label: "Resumen General", icon: LayoutDashboard },
  { href: "/dashboard/perfil", label: "Mi Perfil", icon: User },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/gestion-citas", label: "Gestionar Citas", icon: ClipboardList },
  { href: "/historial", label: "Historial Clínico", icon: FileText },
]

interface AppSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ isCollapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname()
  const [userName, setUserName] = useState("Usuario")
  // Estado del rol: Por defecto PACIENTE para no mostrar cosas de admin por error
  const [userRole, setUserRole] = useState<"PACIENTE" | "PODOLOGO">("PACIENTE")
  
  const [isBackendOnline, setIsBackendOnline] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const initData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 1. Nombre
        if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name)
        }

        // 2. Detección de Rol (Prioridad: LocalStorage -> Email)
        // Intentamos leer lo que el login guardó
        const storedRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
        
        if (storedRole === 'PODOLOGO' || storedRole === 'PACIENTE') {
           setUserRole(storedRole);
        } else {
           // Fallback: Si no hay nada en storage (ej. recarga forzada), verificamos email por si acaso
           // (Esto es temporal hasta que tengas un endpoint /me que devuelva el rol)
           if (user.email === 'marlon.vera@prosperadigital.com' || user.email?.includes('admin')) {
             setUserRole('PODOLOGO');
           } else {
             setUserRole('PACIENTE');
           }
        }
      }
    }
    initData()

    // Health Check
    const checkBackendStatus = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        const res = await fetch('http://localhost:3001/', { method: 'GET', signal: controller.signal })
        clearTimeout(timeoutId)
        if (res.ok) setIsBackendOnline(true)
        else setIsBackendOnline(false)
      } catch { setIsBackendOnline(false) } 
      finally { setIsChecking(false) }
    }
    checkBackendStatus()
    const interval = setInterval(checkBackendStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Seleccionamos links
  const linksToRender = userRole === 'PODOLOGO' ? podiatristLinks : patientLinks

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col bg-background transition-all duration-300 border-r",
          !isCollapsed ? "w-full" : "items-center" 
        )}
      >
        {/* HEADER */}
        <div className={cn("flex h-16 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary",
                userRole === 'PODOLOGO' ? "bg-blue-100" : "bg-primary/10"
              )}>
                <Footprints className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">
                  {userRole === 'PODOLOGO' ? 'Dr. Podólogo' : 'Bienvenido,'}
                </span>
                <span className="text-sm font-bold text-foreground truncate max-w-[120px]" title={userName}>
                  {userName}
                </span>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={onToggle} className={cn("shrink-0", isCollapsed && "h-10 w-10")}>
            <PanelLeft className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Alternar menú</span>
          </Button>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {linksToRender.map((link) => {
            const isActive = pathname === link.href
            if (isCollapsed) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Link href={link.href} className={cn("flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground", isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}>
                      <link.icon className="h-5 w-5" />
                      <span className="sr-only">{link.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{link.label}</TooltipContent>
                </Tooltip>
              )
            }
            return (
              <Link key={link.href} href={link.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground", isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* FOOTER */}
        <div className="mt-auto border-t p-4">
            {!isCollapsed ? (
            <div className="flex flex-col gap-3">
              <div className={cn("flex items-center gap-2 rounded-md px-3 py-2 transition-colors", isBackendOnline ? "bg-green-500/10" : "bg-red-500/10")}>
                 <span className="relative flex h-2.5 w-2.5">
                  {isBackendOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>}
                  <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isBackendOnline ? "bg-green-600" : "bg-red-600")}></span>
                </span>
                <span className={cn("text-xs font-medium", isBackendOnline ? "text-green-700" : "text-red-700")}>
                  {isBackendOnline ? "Sistema en línea" : "Sin conexión"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-white">
                  <Image src="/assets/logo/logo-pie.ico" alt="Logo" fill className="object-contain p-1" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary uppercase">Prospera</span>
                  <span className="text-[10px] text-muted-foreground">Digital LLC</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Tooltip>
                  <TooltipTrigger>
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", isBackendOnline ? "bg-green-500/10" : "bg-red-500/10")}>
                      <span className="relative flex h-3 w-3">
                        {isBackendOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>}
                        <span className={cn("relative inline-flex rounded-full h-3 w-3", isBackendOnline ? "bg-green-600" : "bg-red-600")}></span>
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{isBackendOnline ? "Sistema en línea" : "Sin conexión"}</TooltipContent>
                </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}