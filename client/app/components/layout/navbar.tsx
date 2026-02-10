// En: client/components/layout/PublicNavbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export function PublicNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="w-full flex items-center justify-between">
      
      {/* LOGO */}
      <Link href="/" className="flex-shrink-0 z-50">
        <Image
          src="/assets/logo/icono1.ico"
          alt="Prospera Digital Logo"
          width={50}
          height={50}
          className="h-10 w-auto md:h-12"
          priority={true}
        />
      </Link>

      {/* MENÚ DE ESCRITORIO (Hidden en móvil) */}
      <div className="hidden md:flex items-center gap-6">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " bg-transparent"}
              >
                <Link href="/info-podologo">Acerca del Podólogo</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " bg-transparent"}
              >
                <Link href="/info-consultorio">Consultorio</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <Button asChild variant="default" className="bg-chart-2 hover:bg-chart-2/90">
          <Link href="/login">Acceder</Link>
        </Button>
      </div>

      {/* BOTÓN HAMBURGUESA (Visible solo en móvil) */}
      <button
        className="md:hidden z-50 p-2 text-foreground focus:outline-none"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Menu"
      >
        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* MENÚ MÓVIL (Portal para escapar del contexto de apilamiento del header) */}
      {mounted && isMobileMenuOpen && createPortal(
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center space-y-8 md:hidden animate-in fade-in zoom-in duration-200">
            
            {/* Botón de cerrar flotante en el menú móvil para mejor UX */}
            <button 
              className="absolute top-6 right-6 p-2 text-foreground focus:outline-none"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={32} />
            </button>

            <Link 
              href="/" 
              className="text-2xl font-bold hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Inicio
            </Link>
          
          <Link 
            href="/info-podologo" 
            className="text-xl font-medium hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Acerca del Podólogo
          </Link>

          <Link 
            href="/info-consultorio" 
            className="text-xl font-medium hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Consultorio
          </Link>

          <Link 
            href="/login" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Button size="lg" className="w-48 bg-chart-2 text-lg">
              Acceder
            </Button>
          </Link>
        </div>,
        document.body
      )}
    </div>
  );
}
