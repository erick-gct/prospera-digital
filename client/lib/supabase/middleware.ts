import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: getUser() valida el token y trae la metadata fresca
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // --- CONFIGURACIÓN DE RUTAS ---
  
  // 1. Rutas que requieren estar logueado (Cualquier rol)
  const protectedPaths = [
    "/dashboard", 
    "/reserva-cita", 
    "/perfil", 
    "/mis-citas",
    "/pacientes", 
    "/agenda", 
    "/historial",
    "/gestion-citas"
  ];
  
  // 2. Rutas solo para NO logueados (Login/Registro)
  const authPaths = ["/login", "/register"];
  
  // 3. Rutas EXCLUSIVAS de Podólogo (Admin)
  const podiatristPaths = [
    "/pacientes", 
    "/agenda", 
    "/gestion-citas", 
    "/historial"
  ];

  const isProtectedRoute = protectedPaths.some((p) => path.startsWith(p));
  const isAuthRoute = authPaths.some((p) => path.startsWith(p));
  const isPodiatristRoute = podiatristPaths.some((p) => path.startsWith(p));

  // --- REGLAS DE SEGURIDAD ---

  // A. Usuario NO logueado intentando entrar a zona protegida -> Login
  if (!user && isProtectedRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // B. Usuario YA logueado intentando entrar a Login/Registro -> Dashboard
  if (user && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // C. PROTECCIÓN DE ROL: Validación por Metadata
  // Si un usuario intenta entrar a rutas de Podólogo...
  if (user && isPodiatristRoute) {
    // Leemos el rol directamente de la metadata de Supabase
    // (Esto funciona porque ya actualizaste el usuario en la BD con el SQL)
    const userRole = user.user_metadata?.role;

    // Si NO es PODOLOGO, lo expulsamos al dashboard general
    if (userRole !== 'PODOLOGO') {
      console.warn(`Acceso denegado a ${path}. Rol detectado: ${userRole}`);
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}