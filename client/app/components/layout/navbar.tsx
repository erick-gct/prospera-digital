// En: client/components/layout/PublicNavbar.tsx
'use client'; 

import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'; 

export function PublicNavbar() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* Item 1: Homepage */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/">
              Inicio
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Item 2: Página Informativa (ej. "Acerca de") */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/about">
              Acerca de
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Item 3: Login */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/login">
              Iniciar Sesión
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}