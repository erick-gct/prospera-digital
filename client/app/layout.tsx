import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Configuración de Inter como fuente principal
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap', // Mejora el rendimiento
});

// Configuración de Roboto como fuente opcional
const roboto = Roboto({
  weight: ['400', '700'], 
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Prospera Digital LLC | Consultorio Podológico",
  description: "Sistema de gestión para consultorio podológico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          roboto.variable
        )}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}