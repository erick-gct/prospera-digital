import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Rutas Protegidas (Requieren Login)
  const protectedPaths = ["/dashboard", "/reserva-cita", "/perfil", "/pacientes", "/agenda", "/historial"];
  const authPaths = ["/login", "/register"];
  
  // 2. Rutas Exclusivas de Podólogo
  const podiatristPaths = ["/pacientes", "/agenda", "/gestion-citas", "/historial"];

  const isProtectedRoute = protectedPaths.some((p) => path.startsWith(p));
  const isAuthRoute = authPaths.some((p) => path.startsWith(p));
  const isPodiatristRoute = podiatristPaths.some((p) => path.startsWith(p));

  // --- REGLAS ---

  // A. Usuario no logueado -> Login
  if (!user && isProtectedRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // B. Usuario logueado -> No puede ver Login/Registro
  if (user && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // C. PROTECCIÓN DE ROL: Paciente intentando entrar a zona de Podólogo
  if (user && isPodiatristRoute) {
    // Obtenemos el rol (esto depende de cómo guardes el rol, por ahora simulamos con email o metadata)
    // Idealmente: const role = user.user_metadata.role;
    const email = user.email;
    const esPodologo = email === 'marlon.vera@prosperadigital.com' || email === 'admin@test.com'; // Tu lógica de admin

    if (!esPodologo) {
      // Si no es podólogo, lo mandamos a su dashboard seguro
      url.pathname = "/dashboard"; 
      return NextResponse.redirect(url);
    }
  }

  return response;
}