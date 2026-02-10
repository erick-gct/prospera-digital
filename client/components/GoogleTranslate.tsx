"use client";

import { useEffect, useState } from "react";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export function GoogleTranslate() {
  const [currentLang, setCurrentLang] = useState("es");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // --- 1. PATCH: Solución al error "removeChild" de React ---
    // Google Translate inserta nudos de texto y <font> que React desconoce.
    // Al navegar, React intenta eliminar nodos que ya han cambiado de padre, provocando el crash.
    // Este parche intercepta el error y permite continuar.
    if (typeof Node !== 'undefined' && Node.prototype) {
        const originalRemoveChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function <T extends Node>(child: T): T {
            try {
                return originalRemoveChild.call(this, child) as T;
            } catch (error) {
                console.warn("Google Translate Fix: Prevenimos crash por removeChild", error);
                if (child.parentNode) {
                    child.parentNode.removeChild(child);
                }
                return child;
            }
        };

        const originalInsertBefore = Node.prototype.insertBefore;
        Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
            try {
                return originalInsertBefore.call(this, newNode, referenceNode) as T;
            } catch (error) {
                console.warn("Google Translate Fix: Prevenimos crash por insertBefore", error);
                if (referenceNode && referenceNode.parentNode) {
                   // Fallback seguro o ignorar
                }
                return newNode;
            }
        };
    }
    // -----------------------------------------------------------

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "es",
            includedLanguages: "en,es",
            autoDisplay: false, 
          },
          "google_translate_element"
        );
        setScriptLoaded(true);
      }
    };

    const scriptId = "google-translate-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
        setScriptLoaded(true);
    }
  }, []);

  // Función para cambiar el idioma programáticamente
  const changeLanguage = (langCode: string) => {
    // Definir dominios para cookies (incluyendo subdominios para asegurar limpieza)
    const domain = window.location.hostname;
    const cookieDomain = domain === 'localhost' ? '' : `; domain=.${domain}`;
    
    // 1. SIEMPRE Limpiar cookies existentes para evitar conflictos o estados corruptos
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${cookieDomain}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // 2. Si el idioma deseado es Inglés, establecemos la cookie mágica que Google lee
    if (langCode === "en") {
        document.cookie = `googtrans=/auto/en; path=/;${cookieDomain}`;
        document.cookie = `googtrans=/auto/en; path=/;`; // Fallback sin dominio explícito
    }

    // 3. Recargamos la página.
    // Aunque no es "SPA-friendly", es la ÚNICA forma de garantizar que el script de Google
    // se reinicialice correctamente en todas las páginas y elimine la barra superior.
    window.location.reload();
  };

  // Verificamos cookie de google translate para sincronizar estado inicial (opcional)
  useEffect(() => {
      const match = document.cookie.match(/googtrans=\/([^/]+)\/([^;]+)/);
      if (match && match[2]) {
          setCurrentLang(match[2]);
      }
  }, [scriptLoaded]);

  // Si no está cargado, no mostramos nada (o un spinner)
  if (!scriptLoaded) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden flex flex-col items-end">
      {/* 
        Contenedor ORIGINAL de Google (OCULTO).
        No usar display:none porque Google deja de funcionar.
        Usamos opacity-0 y pointer-events-none para esconderlo pero mantenerlo activo.
      */}
      <div 
        id="google_translate_element" 
        className="absolute bottom-0 right-0 opacity-0 pointer-events-none h-0 w-0 overflow-hidden" 
      />

      {/* UI PERSONALIZADA (Botón Flotante Elegante) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-xl bg-white/90 backdrop-blur-sm border border-slate-200 hover:bg-slate-50 hover:scale-105 transition-all duration-200"
            title="Cambiar idioma / Change language"
          >
             <Globe className="h-6 w-6 text-primary" />
             <span className="sr-only">Cambiar idioma</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px] p-2 bg-white/95 backdrop-blur-sm">
           <DropdownMenuItem 
                onClick={() => changeLanguage('es')} 
                className={cn(
                    "justify-between cursor-pointer py-2 rounded-md",
                    currentLang === 'es' ? "bg-slate-100 font-medium" : ""
                )}
           >
              <div className="flex items-center gap-2">
                <span className="text-lg">🇪🇸</span>
                <span>Español</span>
              </div>
              {currentLang === 'es' && <Check className="h-4 w-4 text-green-600" />}
           </DropdownMenuItem>
           <DropdownMenuItem 
                onClick={() => changeLanguage('en')} 
                className={cn(
                    "justify-between cursor-pointer py-2 rounded-md",
                    currentLang === 'en' ? "bg-slate-100 font-medium" : ""
                )}
           >
              <div className="flex items-center gap-2">
                 <span className="text-lg">🇺🇸</span>
                 <span>English</span>
              </div>
              {currentLang === 'en' && <Check className="h-4 w-4 text-green-600" />}
           </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
