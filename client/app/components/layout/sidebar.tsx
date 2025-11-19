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
} from "lucide-react";

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

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col bg-background",
          !isCollapsed && "w-56" // Ancho cuando está expandido
        )}
      >
        {/* Logo/Nombre */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "text-lg font-bold text-primary",
              isCollapsed && "hidden"
            )}
          >
            {!isCollapsed && <span>Podología</span>}
          </Link>
          {/* 6. El icono es ahora un botón que llama a 'onToggle' */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="shrink-0"
          >
            <PanelLeft className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);

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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
