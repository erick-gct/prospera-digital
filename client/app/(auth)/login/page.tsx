// En: client/app/(auth)/login/page.tsx
"use client"; // Marcamos como Client Component para manejar el estado del formulario

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

// --- 1. Imports necesarios ---
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/cliente"; // Nuestro helper
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // --- 2. Estado de carga y router ---
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // --- 3. Lógica de Supabase ---
    const supabase = createClient();
    try {
      // --- 3. Lógica de FETCH a tu API de NestJS ---
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si NestJS nos da un error (ej. 401 Unauthorized), lo lanzamos
        throw new Error(data.message || "Error al iniciar sesión");
      }

      // 4. ¡ÉXITO! NestJS nos devuelve la sesión
      // data.session contiene el access_token y refresh_token
      if (data.session) {
        // 5. Entregamos la sesión a la librería de Supabase (SSR)
        // Esto guardará las cookies de autenticación en el navegador
        const { error: sessionError } = await supabase.auth.setSession(
          data.session
        );

        if (sessionError) {
          throw new Error(
            `Error al guardar la sesión: ${sessionError.message}`
          );
        }

        console.log("¡Inicio de sesión exitoso!", data.user);
        toast.success(`Bienvenido, ${data.user.user_metadata.full_name}`);

        // Redirige al dashboard y refresca
        router.push("/dashboard");
        router.refresh();
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (error) {
      // 6. Manejo de Error (de red o de NestJS)
      console.error("Error de Login:", error);
      toast.error("Error al iniciar sesión", {
        description:
          (error as Error).message || "Las credenciales son incorrectas.",
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    } finally {
      setIsLoading(false);
    }

    console.log({ email, password });
  };

  return (
    <Card className="w-full max-w-md ">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          ¡Bienvenido de vuelta!
        </CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="paciente@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 py-6">
          <Button type="submit" className="w-full">
            Iniciar Sesión
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Regístrate aquí
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
