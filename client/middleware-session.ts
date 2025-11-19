import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  // Llama al helper para actualizar la sesión
  const response = NextResponse.next()
  return await updateSession(request, response)
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto las que empiezan por:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (archivo de favicon)
     * No queremos ejecutar el middleware en estos archivos.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}