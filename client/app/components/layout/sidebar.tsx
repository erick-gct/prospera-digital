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
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/cliente";
import Image from "next/image"; // Importamos Image de Next.js

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
  const [userName, setUserName] = useState("Paciente");
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const getUserName = async () => {
      const supabase = createClient();
      // 1. Obtenemos el usuario de la sesión actual (caché local)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 2. Si existe y tiene metadata, sacamos el nombre
      if (user?.user_metadata?.full_name) {
        // Opcional: Si el nombre es muy largo, podrías tomar solo el primer nombre
        const primerNombre = user.user_metadata.full_name.split(" ")[0];
        setUserName(primerNombre);
      }
    };

    getUserName();
    // 2. Función para verificar el estado del Backend
    const checkBackendStatus = async () => {
      try {
        // Hacemos un ping al endpoint raíz de tu API
        // Usamos un timeout corto para que no se quede cargando eternamente si está caído
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seg timeout

        const res = await fetch("http://localhost:3001/", {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          setIsBackendOnline(true);
        } else {
          setIsBackendOnline(false);
        }
      } catch (error) {
        // Si hay error de red (fetch failed) es que está caído
        setIsBackendOnline(false);
      } finally {
        setIsChecking(false);
      }
    };
    // Ejecutar al montar
    checkBackendStatus();
    // Opcional: Re-verificar cada 30 segundos para actualizar en tiempo real
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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
                <span className="text-xs font-medium text-muted-foreground">
                  Bienvenido,
                </span>
                <span
                  className="text-sm font-bold text-foreground truncate max-w-[120px]"
                  title={userName}
                >
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
            const isActive = pathname === link.href; // Coincidencia exacta o startsWith según prefieras

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

        {/* --- FOOTER DEL SIDEBAR  --- */}
        <div className="mt-auto border-t p-4">
          {!isCollapsed ? (
            // Versión Expandida
            <div className="flex flex-col gap-3">
              {/* Estado del Sistema DINÁMICO */}
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                  isBackendOnline
                    ? "bg-green-500/10" // Fondo verde si online
                    : "bg-red-500/10" // Fondo rojo si offline
                )}
              >
                <span className="relative flex h-2.5 w-2.5">
                  {/* Solo animamos el ping si está online */}
                  {isBackendOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  )}
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-2.5 w-2.5",
                      isBackendOnline ? "bg-green-600" : "bg-red-600"
                    )}
                  ></span>
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isBackendOnline
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  )}
                >
                  {isChecking
                    ? "Conectando..."
                    : isBackendOnline
                    ? "Sistema en línea"
                    : "Sin conexión"}
                </span>
              </div>

              {/* Logo y Marca */}
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-white">
                  <Image
                    src="/assets/logo/logo-pie.ico"
                    alt="Logo Prospera"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    Prospera
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Digital LLC
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Versión Colapsada
            <div className="flex justify-center">
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md",
                      isBackendOnline ? "bg-green-500/10" : "bg-red-500/10"
                    )}
                  >
                    <span className="relative flex h-3 w-3">
                      {isBackendOnline && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      )}
                      <span
                        className={cn(
                          "relative inline-flex rounded-full h-3 w-3",
                          isBackendOnline ? "bg-green-600" : "bg-red-600"
                        )}
                      ></span>
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isChecking
                    ? "Verificando..."
                    : isBackendOnline
                    ? "Sistema en línea"
                    : "Sin conexión al servidor"}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
