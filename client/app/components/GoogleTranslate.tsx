"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export function GoogleTranslate() {
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {
    // 1. Definir la función de inicialización global
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "es",
            includedLanguages: "en,es", // Solo Español e Inglés
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
        setIsApiLoaded(true);
      }
    };

    // 2. Cargar el script de Google si no existe
    const scriptId = "google-translate-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
        // Si ya existe, inicializar manualmente si es necesario (casos de re-render)
        // Aunque generalmente el script corre una sola vez.
        setIsApiLoaded(true);
    }

    return () => {
        // Cleanup opcional
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 print:hidden">
      {/* Contenedor del Widget de Google - Lo ocultamos visualmente pero dejamos que funcione */}
      <div 
        id="google_translate_element" 
        className="transition-all duration-300 overflow-hidden bg-white rounded-lg shadow-lg border border-slate-200"
        style={{ minWidth: isApiLoaded ? 'auto' : '0' }}
      />
      
      {!isApiLoaded && (
          <div className="bg-white px-3 py-2 rounded-lg shadow border text-xs text-slate-500 animate-pulse">
              Cargando traducción...
          </div>
      )}
    </div>
  );
}
