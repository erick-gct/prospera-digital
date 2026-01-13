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
    "/gestion-citas",
    // Rutas de Admin
    "/admin-usuarios",
    "/admin-auditoria",
    "/admin-citas",
    "/admin-documentos",
  ];
  
  // 2. Rutas solo para NO logueados (Login/Registro)
  const authPaths = ["/login", "/register"];
  
  // 3. Rutas EXCLUSIVAS de Podólogo
  const podiatristPaths = [
    "/pacientes", 
    "/agenda", 
    "/gestion-citas", 
    "/historial"
  ];

  // 4. Rutas EXCLUSIVAS de Administrador
  const adminPaths = [
    "/admin-usuarios",
    "/admin-auditoria",
    "/admin-citas",
    "/admin-documentos",
  ];

  const isProtectedRoute = protectedPaths.some((p) => path.startsWith(p));
  const isAuthRoute = authPaths.some((p) => path.startsWith(p));
  const isPodiatristRoute = podiatristPaths.some((p) => path.startsWith(p));
  const isAdminRoute = adminPaths.some((p) => path.startsWith(p));

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

  // C. PROTECCIÓN DE ROL: Validación consultando la base de datos
  if (user) {
    let userRole = 'PACIENTE'; // Default

    // Verificar si es administrador
    const { data: admin } = await supabase
      .from('administrador')
      .select('usuario_id')
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (admin) {
      userRole = 'ADMINISTRADOR';
    } else {
      // Verificar si es podólogo
      const { data: podologo } = await supabase
        .from('podologo')
        .select('usuario_id')
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (podologo) {
        userRole = 'PODOLOGO';
      }
    }

    console.log(`[Middleware] Usuario: ${user.email}, Rol: ${userRole}, Ruta: ${path}`);

    // Si un usuario intenta entrar a rutas de Podólogo...
    if (isPodiatristRoute && userRole !== 'PODOLOGO') {
      console.warn(`Acceso denegado a ${path}. Rol detectado: ${userRole}`);
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Si un usuario intenta entrar a rutas de Admin...
    if (isAdminRoute && userRole !== 'ADMINISTRADOR') {
      console.warn(`Acceso denegado a ${path}. Rol detectado: ${userRole}`);
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Si un admin intenta entrar a rutas de paciente que no le aplican...
    const patientOnlyPaths = ["/reserva-cita", "/mis-citas"];
    const isPatientOnlyRoute = patientOnlyPaths.some((p) => path.startsWith(p));
    
    if (isPatientOnlyRoute && userRole !== 'PACIENTE') {
      console.warn(`Ruta solo para pacientes: ${path}. Rol detectado: ${userRole}`);
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}