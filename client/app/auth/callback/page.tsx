"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/cliente";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/update-password"; 
  const [errorMsg, setErrorMsg] = useState("");
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const supabase = createClient();
    
    // 1. Check for Hash (Implicit Flow) - Manual Handling
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      // Parse hash manually
      const params = new URLSearchParams(hash.substring(1)); // remove #
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const errorDescription = params.get("error_description");

      if (errorDescription) {
        setErrorMsg(`Error en hash: ${errorDescription}`);
        return;
      }

      if (accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        }).then(({ error }) => {
           if (error) {
             setErrorMsg("Error estableciendo sesión: " + error.message);
           } else {
             setTimeout(() => router.replace(next), 500);
           }
        });
        return;
      }
    }

    // 2. Fallback to standard flow (PKCE or existing session)
    const errorDescription = searchParams.get("error_description");

    const checkSessionAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setTimeout(() => router.replace(next), 1000); 
        return true;
      }
      return false;
    };

    checkSessionAndRedirect().then((hasSession) => {
      if (hasSession) return;

      if (errorDescription) {
        setErrorMsg(`Error recibido: ${errorDescription}`);
        return; 
      }

      // Supabase Auth Listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
           if (session) router.replace(next);
        }
      });

      // Timeout
      setTimeout(async () => {
         const retry = await checkSessionAndRedirect();
         if (!retry) {
            setErrorMsg("Tiempo de espera agotado. No se detectó sesión.");
         }
      }, 5000);
    });

  }, [router, next, searchParams]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col items-center gap-6 max-w-lg w-full bg-white p-8 rounded-lg shadow-sm border">
        {errorMsg ? (
           <div className="flex flex-col items-center gap-2 text-red-600">
             <AlertTriangle className="h-10 w-10" />
             <p className="font-semibold text-center">{errorMsg}</p>
           </div>
        ) : (
           <div className="flex flex-col items-center gap-2 text-primary">
             <Loader2 className="h-10 w-10 animate-spin" />
             <p className="font-medium">Procesando credenciales...</p>
           </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Iniciando...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
