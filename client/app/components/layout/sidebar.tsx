"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  PanelLeft,
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  ClipboardList,
  Footprints,
  Shield,
  CalendarClock,
  UserCog,
  FolderOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/cliente";
import { ApiRoutes } from "@/lib/api-routes";

type NavLink = {
  href: string;
  label: string;
  icon: React.ElementType;
};

// --- ENLACES PACIENTE ---
const patientLinks: NavLink[] = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/perfil", label: "Mi Perfil", icon: User },
  { href: "/reserva-cita", label: "Agendar Cita", icon: CalendarPlus },
  { href: "/mis-citas", label: "Mis Citas (Historial)", icon: CalendarCheck },
];

// --- ENLACES PODÓLOGO ---
const podiatristLinks: NavLink[] = [
  { href: "/dashboard", label: "Resumen General", icon: LayoutDashboard },
  { href: "/perfil", label: "Mi Perfil", icon: User },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/agendar-paciente", label: "Agendar a Paciente", icon: CalendarPlus },
  { href: "/gestion-citas", label: "Gestionar Citas", icon: ClipboardList },
  { href: "/historial", label: "Historial Clínico", icon: FileText },
];

// --- ENLACES ADMINISTRADOR ---
const adminLinks: NavLink[] = [
  { href: "/dashboard", label: "Panel General", icon: LayoutDashboard },
  { href: "/admin-usuarios", label: "Gestión de Usuarios", icon: UserCog },
  { href: "/admin-citas", label: "Citas del Sistema", icon: CalendarClock },
  { href: "/admin-documentos", label: "Documentos", icon: FolderOpen },
  { href: "/admin-auditoria", label: "Auditoría", icon: Shield },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isCollapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Usuario");
  // Estado del rol: Por defecto null hasta que se determine
  const [userRole, setUserRole] = useState<
    "PACIENTE" | "PODOLOGO" | "ADMINISTRADOR" | null
  >(null);

  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // --- 1. Intentar cargar desde localStorage (Rápido) ---
        const storedRole = typeof window !== "undefined" ? localStorage.getItem("user_role") : null;
        const storedName = typeof window !== "undefined" ? localStorage.getItem("user_display_name") : null;

        if (storedRole && storedName) {
           setUserRole(storedRole as any);
           setUserName(storedName);
           console.log("[Sidebar] Cargado desde Storage:", { role: storedRole, name: storedName });
           // Opcional: Podríamos re-verificar en segundo plano, pero por ahora confiamos
        }
        
        // --- 2. Si no hay datos en Storage, consultar BD ---
        if (!storedRole || !storedName) {
          console.log("[Sidebar] Consultando Base de Datos...");
          
          // A. Administrador
          const { data: admin } = await supabase
            .from("administrador")
            .select("usuario_id, nombres")
            .eq("usuario_id", user.id)
            .maybeSingle();

          if (admin) {
            const displayName = admin.nombres;
            setUserRole("ADMINISTRADOR");
            setUserName(displayName);
            if (typeof window !== "undefined") {
                localStorage.setItem("user_role", "ADMINISTRADOR");
                localStorage.setItem("user_display_name", displayName);
            }
          } else {
             // B. Podólogo
             const { data: podologo } = await supabase
               .from("podologo")
               .select("usuario_id, nombres, apellidos")
               .eq("usuario_id", user.id)
               .maybeSingle();
             
             if (podologo) {
                const displayName = `${podologo.nombres} ${podologo.apellidos}`;
                setUserRole("PODOLOGO");
                setUserName(displayName);
                if (typeof window !== "undefined") {
                    localStorage.setItem("user_role", "PODOLOGO");
                    localStorage.setItem("user_display_name", displayName);
                }
             } else {
                // C. Paciente
                const { data: paciente } = await supabase
                  .from("paciente")
                  .select("usuario_id, nombres, apellidos")
                  .eq("usuario_id", user.id)
                  .maybeSingle();
                
                if (paciente) {
                   const displayName = `${paciente.nombres} ${paciente.apellidos}`;
                   setUserRole("PACIENTE");
                   setUserName(displayName);
                   if (typeof window !== "undefined") {
                       localStorage.setItem("user_role", "PACIENTE");
                       localStorage.setItem("user_display_name", displayName);
                   }
                } else {
                   // Fallback absoluto
                   const metaName = user.user_metadata?.full_name || "Usuario";
                   setUserName(metaName);
                   setUserRole("PACIENTE"); // Default safe
                }
             }
          }
        }
      }
    };
    initData();

    // Health Check
    const checkBackendStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(ApiRoutes.healthCheck, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) setIsBackendOnline(true);
        else setIsBackendOnline(false);
      } catch {
        setIsBackendOnline(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 300000); // 5 minutos
    return () => clearInterval(interval);
  }, []);

  // Seleccionamos links según el rol
  const getLinksForRole = () => {
    switch (userRole) {
      case "ADMINISTRADOR":
        return adminLinks;
      case "PODOLOGO":
        return podiatristLinks;
      case "PACIENTE":
        return patientLinks;
      default:
        // Mientras carga, mostrar array vacío o links mínimos
        return [];
    }
  };

  const linksToRender = getLinksForRole();

  // Color del avatar según rol
  const getRoleColor = () => {
    switch (userRole) {
      case "ADMINISTRADOR":
        return "bg-purple-100 text-purple-600";
      case "PODOLOGO":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  // Título según rol
  const getRoleTitle = () => {
    switch (userRole) {
      case "ADMINISTRADOR":
        return "Administrador";
      case "PODOLOGO":
        return "Dr. Podólogo";
      default:
        return "Bienvenido,";
    }
  };

  // Si el rol aún no se ha cargado, mostrar loading
  if (userRole === null) {
    return (
      <aside className="flex h-full flex-col bg-background transition-all duration-300 border-r items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </aside>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col bg-background transition-all duration-300 border-r",
          !isCollapsed ? "w-full" : "items-center"
        )}
      >
        {/* HEADER */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  getRoleColor()
                )}
              >
                <Footprints className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">
                  {getRoleTitle()}
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

        {/* NAVEGACIÓN */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {linksToRender.map((link) => {
            const isActive = pathname === link.href;
            if (isCollapsed) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive &&
                          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
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

        {/* FOOTER */}
        <div className="mt-auto border-t p-4">
          {!isCollapsed ? (
            <div className="flex flex-col gap-3">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                  isBackendOnline ? "bg-green-500/10" : "bg-red-500/10"
                )}
              >
                <span className="relative flex h-2.5 w-2.5">
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
                    isBackendOnline ? "text-green-700" : "text-red-700"
                  )}
                >
                  {isBackendOnline ? "Sistema en línea" : "Sin conexión"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-white">
                  <Image
                    src="/assets/logo/logo-pie.ico"
                    alt="Logo"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary uppercase">
                    Prospera
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Digital LLC
                  </span>
                </div>
              </div>
            </div>
          ) : (
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
                  {isBackendOnline ? "Sistema en línea" : "Sin conexión"}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
