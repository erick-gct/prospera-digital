import { createMiddlewareClient } from "@supabase/ssr"
import { type NextRequest, type NextResponse } from "next/server"

export async function updateSession(request: NextRequest, response: NextResponse) {
  // Define las variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createMiddlewareClient({ req: request, res: response }, {
    supabaseUrl,
    supabaseAnonKey,
  })

  // Refresca la sesión (vital para RLS)
  await supabase.auth.getSession()
  
  return response
}