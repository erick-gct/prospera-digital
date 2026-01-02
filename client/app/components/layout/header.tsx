"use client";
import { useRouter } from "next/navigation"; // 1. Importamos router

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, Loader2, Shield } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/cliente"; // 2. Importamos cliente Supabase
import { toast } from "sonner";
import { ApiRoutes } from "@/lib/api-routes";
// 1. Importamos los componentes del Alert Dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AuditModal } from "../features/auditoria/AuditModal"


export function AppHeader() {
  const [time, setTime] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Estado para loading
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [userRole, setUserRole] = useState<"podologo" | "paciente" | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState("")
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
  const update = () => {
    const now = new Date();
    setTime(
      now.toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // Mostrar inmediatamente la hora (sin segundos)
  update();

  // Calcular ms hasta el inicio del siguiente minuto
  const now = new Date();
  const msUntilNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  let intervalId: ReturnType<typeof setInterval> | null = null;
  const timeoutId = setTimeout(() => {
    // Al llegar al siguiente minuto: actualizar y luego hacerlo cada 60s
    update();
    intervalId = setInterval(update, 60 * 1000);
  }, msUntilNextMinute);

  return () => {
    clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
  };
}, []);

  // Detectar rol del usuario
  useEffect(() => {
    const detectUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email || "")
      setUserId(user.id)

      // Verificar si es podólogo (usando limit 1 en lugar de single para evitar error 406)
      const { data: podologos } = await supabase
        .from('podologo')
        .select('usuario_id')
        .eq('usuario_id', user.id)
        .limit(1)

      if (podologos && podologos.length > 0) {
        setUserRole('podologo')
      } else {
        setUserRole('paciente')
      }
    }

    detectUserRole()
  }, [supabase])

     // Esta función solo abre el diálogo
  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  // 3. Esta función ejecuta la lógica real (se llama al confirmar)
  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // Registrar logout en historial (no bloqueante)
      if (userId && userEmail) {
        try {
          await fetch(ApiRoutes.auth.logout, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, email: userEmail }),
          })
        } catch (e) {
          console.warn('No se pudo registrar logout:', e)
        }
      }
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      toast.success("Sesión cerrada correctamente")
      router.push("/login")
      router.refresh()

    } catch (error) {
      console.error("Error al salir:", error)
      toast.error("Error al cerrar sesión")
      setIsLoggingOut(false) // Solo reseteamos si falló
    } finally {
      setShowLogoutDialog(false)
    }
  }

  // --- FUNCIÓN DE CERRAR SESIÓN ---
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // 1. Cerrar sesión en Supabase (borra cookies y tokens)
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // 2. Feedback visual
      toast.success("Sesión cerrada correctamente");

      // 3. Redirigir al login
      router.push("/login");
      router.refresh(); // Importante: refresca para limpiar caché de rutas protegidas
    } catch (error) {
      console.error("Error al salir:", error);
      toast.error("Error al cerrar sesión");
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between gap-4 bg-background px-6">
        {/* Lado Izquierdo: Hora */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{time}</span>
        </div>

        {/* Lado Derecho: Botones */}
        <div className="flex items-center gap-2">
          {/* Botón de Auditoría (solo para podólogos) */}
          {userRole === 'podologo' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuditModal(true)}
              className="text-muted-foreground hover:text-primary"
              title="Auditoría del sistema"
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <Separator />
    
    {/* 4. El componente Alert Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de salir del sistema. Tendrás que ingresar tus credenciales nuevamente para acceder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLogout} 
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, salir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Auditoría */}
      <AuditModal
        open={showAuditModal}
        onOpenChange={setShowAuditModal}
        userEmail={userEmail}
      />
    </>
  );
}
