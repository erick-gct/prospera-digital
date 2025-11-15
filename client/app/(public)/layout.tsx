"use client";

import { PublicNavbar } from "@/app/components/layout/navbar"; // Importas TU navbar
import { useState, useEffect } from "react";
import { PublicFooter } from "@/app/components/layout/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Puedes ajustar esta altura. Es para evitar que se oculte
  // con un scroll muy pequeño al inicio.
  const NAVBAR_HEIGHT_THRESHOLD = 64;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Si estás scrolleando hacia abajo Y ya pasaste la altura del navbar
      if (
        currentScrollY > lastScrollY &&
        currentScrollY > NAVBAR_HEIGHT_THRESHOLD
      ) {
        setIsVisible(false); // Ocultar
      } else {
        // Si estás scrolleando hacia arriba
        setIsVisible(true); // Mostrar
      }

      // Actualizar la última posición de scroll
      setLastScrollY(currentScrollY);
    };

    // Añadir el listener al montar el componente
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Limpiar el listener al desmontar
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]); // El efecto depende de la última posición de scroll

  return (
    <div>
      {/* Este 'header' es el contenedor de tu navbar.
        Le añadimos las clases de Tailwind para:
        1. position: sticky, top: 0, z-index: 50 (para que se pegue arriba)
        2. Fondos y blur (para el efecto "vidrio esmerilado" sobre el contenido)
        3. transition-transform (para la animación de entrada/salida)
        4. Clase condicional: 'translate-y-0' (visible) o '-translate-y-full' (oculto)
      */}
      <header
        className={`
          sticky top-0 z-50 
          w-full 
          border-b border-border/40 
          bg-background/95 backdrop-blur-sm 
          transition-transform duration-600 ease-in-out
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        {/* Ponemos la navbar dentro de un 'container' para que 
          mantenga los márgenes centrados, pero el fondo del header
          ocupe el 100% del ancho.
        */}
        <div className="container flex h-16 items-center">
          <PublicNavbar />
          <ScrollProgress className="top-[65px] bg-chart-2 h-1" />
        </div>
      </header>

      {/* El contenido de tu página */}
      <main>{children}</main>
      {/* Aquí va el <PublicFooter /> */}
      <PublicFooter />
    </div>
  );
}
