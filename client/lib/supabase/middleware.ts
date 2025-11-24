import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  // 1. Crear una respuesta inicial (permitir que continúe)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Crear el cliente de Supabase para el Middleware
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

  // 3. Obtener el usuario actual
  // IMPORTANTE: Usamos getUser() y no getSession() por seguridad
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // -----------------------------------------------------------
  // REGLAS DE PROTECCIÓN DE RUTAS
  // -----------------------------------------------------------

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Definimos rutas protegidas (solo usuarios logueados)
  const protectedPaths = ["/dashboard", "/reserva-cita", "/perfil"];
  
  // Definimos rutas de autenticación (solo usuarios NO logueados)
  const authPaths = ["/login", "/register"];

  const isProtectedRoute = protectedPaths.some((p) => path.startsWith(p));
  const isAuthRoute = authPaths.some((p) => path.startsWith(p));

  // CASO A: Usuario NO logueado intenta entrar a ruta protegida
  if (!user && isProtectedRoute) {
    url.pathname = "/login";
    // Opcional: Guardar la url a la que querían ir para redirigirlos después
    // url.searchParams.set("next", path); 
    return NextResponse.redirect(url);
  }

  // CASO B: Usuario YA logueado intenta entrar a login o registro
  if (user && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // -----------------------------------------------------------

  return response;
}