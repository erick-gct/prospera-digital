// En: client/components/layout/PublicNavbar.tsx
"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function PublicNavbar() {
  return (
    // 2. Creamos un contenedor flex padre que ocupe todo el ancho
    <div className="flex w-full items-center justify-between">
      {/* 3. El menú de navegación se queda a la izquierda */}
      <NavigationMenu>
        <NavigationMenuList>
          {/* Item 1: Homepage */}
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()+ " hover:bg-transparent"}
            >
              <Link href="/">
                <Image
                  src="/assets/logo/icono1.ico"
                  alt="logo"
                  width={120}
                  height={90}
                  priority={false}
                />
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          {/* Item 2: Página Informativa (ej. "Acerca de") */}
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link href="/about">Acerca del Podólogo</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          {/* Item 3: Login */}
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link href="/login">Información del Consultorio</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>


        </NavigationMenuList>
      </NavigationMenu>

      {/* 4. Ponemos el botón como un elemento hermano, fuera del menú */}
      <Button asChild variant="default" className="bg-chart-2">
        <Link href="/login">Acceder</Link>
      </Button>
    </div>
  );
}
