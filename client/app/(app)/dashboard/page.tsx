"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/cliente";
import { DashboardPaciente } from "@/app/components/features/dashboard/DashboardPaciente";
import { DashboardPodologo } from "@/app/components/features/dashboard/DashboardPodologo";
import { DashboardAdmin } from "@/app/components/features/dashboard/DashboardAdmin";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Primero verificar si es administrador
        const { data: admins } = await supabase
          .from("administrador")
          .select("usuario_id")
          .eq("usuario_id", user.id)
          .limit(1);

        if (admins && admins.length > 0) {
          setRole("admin");
        } else {
          // Verificar si el usuario es paciente
          const { data: pacientes } = await supabase
            .from("paciente")
            .select("usuario_id")
            .eq("usuario_id", user.id)
            .limit(1);

          if (pacientes && pacientes.length > 0) {
            setRole("paciente");
          } else {
            // Verificar si es podólogo
            const { data: podologos } = await supabase
              .from("podologo")
              .select("usuario_id")
              .eq("usuario_id", user.id)
              .limit(1);

            if (podologos && podologos.length > 0) {
              setRole("podologo");
            } else {
              setRole("unknown");
            }
          }
        }
      }
      setIsLoading(false);
    };

    fetchRole();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === "paciente") {
    return <DashboardPaciente />;
  }

  if (role === "podologo") {
    return <DashboardPodologo />;
  }

  if (role === "admin") {
    return <DashboardAdmin />;
  }

  // Rol desconocido
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        No se pudo determinar tu rol en el sistema.
      </p>
    </div>
  );
}
