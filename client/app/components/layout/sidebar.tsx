"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // Para saber qué link está activo
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  User,
  CalendarPlus,
  CalendarCheck,
  PanelLeft, // Icono para el logo/nombre
  Stethoscope,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/cliente"

// Definimos la estructura de un enlace del sidebar
type NavLink = {
  href: string;
  label: string;
  icon: React.ElementType;
};

// Opciones del Paciente (expandible para el Podólogo en el futuro)
const navLinks: NavLink[] = [
  {
    href: "/dashboard/perfil",
    label: "Mi Perfil",
    icon: User,
  },
  {
    href: "/reserva-cita",
    label: "Agendar Cita",
    icon: CalendarPlus,
  },
  {
    href: "/dashboard/citas",
    label: "Mis Citas",
    icon: CalendarCheck,
  },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void; // 2. Añadimos la nueva prop 'onToggle'
}

export function AppSidebar({ isCollapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  // Estado para guardar el nombre (inicia genérico mientras carga)
  const [userName, setUserName] = useState("Paciente")

    useEffect(() => {
    const getUserName = async () => {
      const supabase = createClient()
      // 1. Obtenemos el usuario de la sesión actual (caché local)
      const { data: { user } } = await supabase.auth.getUser()
      
      // 2. Si existe y tiene metadata, sacamos el nombre
      if (user?.user_metadata?.full_name) {
        // Opcional: Si el nombre es muy largo, podrías tomar solo el primer nombre
        // const primerNombre = user.user_metadata.full_name.split(' ')[0]
        setUserName(user.user_metadata.full_name)
      }
    }

    getUserName()
  }, [])

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col bg-background transition-all duration-300",
          !isCollapsed ? "w-full" : "items-center" // Ancho cuando está expandido
        )}
      >
        {/* HEADER DEL SLIDEBAR */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {/* Si está expandido: Mostramos el saludo.
                Si está colapsado: Solo el ícono
          */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Bienvenido,</span>
                  <span className="text-sm font-bold text-foreground truncate max-w-[120px]" title={userName}>
                  {userName}
                </span>
              </div>
            </div>
          )}

          {/* Botón de Toggle (Colapsar/Expandir) */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle} 
            className={cn("shrink-0", isCollapsed && "h-10 w-10")}
          >
            <PanelLeft className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Alternar menú</span>
          </Button>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href // Coincidencia exacta o startsWith según prefieras

            // Si está colapsado, mostramos Tooltip
            if (isCollapsed) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive &&
                          "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      <span className="sr-only">{link.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{link.label}</TooltipContent>
                </Tooltip>
              );
            }

            // Si está expandido, mostramos texto
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
