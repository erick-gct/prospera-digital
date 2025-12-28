import React from 'react';
import { GraduationCap, Award, Stethoscope, HeartHandshake, MapPin, Phone, Clock } from 'lucide-react';

export default function AboutPodiatristPage() {
 
  // Turquesa (Color del bloque): text-[#20aca2] / bg-[#20aca2]
  // Azul (Color del botón): text-[#2563eb]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* --- ENCABEZADO --- */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Trayectoria y Compromiso
          </h1>
          {/* Línea decorativa en el Turquesa de tu imagen */}
          <div className="h-1 w-20 bg-[#20aca2] mx-auto rounded-full"></div>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Conozca al profesional detrás de la salud de sus pies.
          </p>
        </div>

        {/* --- SECCIÓN PRINCIPAL: BIO --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="md:flex">
            {/* Espacio para la FOTO */}
            <div className="md:shrink-0 md:w-1/3 bg-slate-100 relative min-h-[320px] flex items-center justify-center">
              {/* Placeholder para la imagen */}
              <div className="text-center p-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center text-gray-400">
                  <span className="text-xs">Foto</span>
                </div>
                <span className="text-sm text-gray-500 block">
                  Inserte imagen aquí<br/>
                  (Recomendado: 400x500px)
                </span>
              </div>
            </div>

            {/* Texto de la Bio */}
            <div className="p-8 md:p-12 md:w-2/3 flex flex-col justify-center">
              {/* Etiqueta en Azul del botón para contraste */}
              <div className="uppercase tracking-wide text-xs text-[#20aca2] font-bold mb-2">
                Perfil Profesional
              </div>
              <h2 className="text-3xl font-serif text-gray-900 mb-6">
                Dr. [Nombre y Apellido]
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-justify">
                Como especialista en podología clínica, he dedicado mi carrera a entender la biomecánica del pie y su impacto en la salud general. Mi enfoque integra la medicina preventiva con tratamientos correctivos avanzados, asegurando que cada paciente reciba una solución adaptada a su estilo de vida.
              </p>
              
              <div className="mt-2 pt-6 border-t border-gray-100">
                <p className="text-gray-800 font-medium italic font-serif">
                  "Un diagnóstico preciso es el primer paso hacia una recuperación efectiva."
                </p>
                <p className="text-gray-400 text-sm mt-2">- Dr. [Apellido]</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- GRID DE INFORMACIÓN --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Formación */}
          <div className="bg-white p-8 rounded-xl border-t-4 border-[#20aca2] shadow-sm hover:shadow-md transition-shadow">
            {/* Icono en Turquesa */}
            <GraduationCap className="w-10 h-10 text-[#20aca2] mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-3">Formación Académica</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2 text-[#20aca2]">•</span>
                Licenciado en Podología
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#20aca2]">•</span>
                Máster en Biomecánica Clínica
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#20aca2]">•</span>
                Certificación en Pie Diabético
              </li>
            </ul>
          </div>

          {/* Especialidades */}
          <div className="bg-white p-8 rounded-xl border-t-4 border-[#20aca2] shadow-sm hover:shadow-md transition-shadow">
            <Award className="w-10 h-10 text-[#20aca2] mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-3">Especialidades</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2 text-[#20aca2]">•</span>
                Cirugía de uña encarnada
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#20aca2]">•</span>
                Tratamiento láser de hongos
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#20aca2]">•</span>
                Podología deportiva
              </li>
            </ul>
          </div>

          {/* Filosofía */}
          <div className="bg-white p-8 rounded-xl border-t-4 border-[#20aca2] shadow-sm hover:shadow-md transition-shadow">
            <HeartHandshake className="w-10 h-10 text-[#20aca2] mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-3">Ética Médica</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Comprometido con la actualización constante y el trato humano. Cada consulta se realiza bajo estrictos protocolos de esterilización y con la tecnología más reciente del sector.
            </p>
          </div>
        </div>

        {/* --- SECCIÓN FINAL: CONTACTO --- */}
        <div className="border-t border-gray-200 pt-10 mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            
            {/* Ubicación */}
            <div className="flex flex-col items-center md:items-start">
              {/* Fondo suave del turquesa con opacidad */}
              <div className="bg-[#20aca2]/10 p-3 rounded-full mb-3">
                <MapPin className="w-5 h-5 text-[#20aca2]" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">Ubicación de la Clínica</h4>
              <p className="text-gray-500 text-sm mt-1">
                Av. Principal 123, Edificio Médico<br />
                Consultorio 405
              </p>
            </div>

            {/* Horarios */}
            <div className="flex flex-col items-center md:items-start">
              <div className="bg-[#20aca2]/10 p-3 rounded-full mb-3">
                <Clock className="w-5 h-5 text-[#20aca2]" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">Horarios de Atención</h4>
              <p className="text-gray-500 text-sm mt-1">
                Lun - Vie: 9:00 AM - 6:00 PM<br />
                Sáb: 9:00 AM - 1:00 PM
              </p>
            </div>

            {/* Contacto Directo */}
            <div className="flex flex-col items-center md:items-start">
              {/* Aquí usamos el Azul del botón para destacar el contacto telefónico */}
              <div className="bg-blue-50 p-3 rounded-full mb-3">
                <Phone className="w-5 h-5 text-[#20aca2]" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">Contacto</h4>
              <p className="text-gray-500 text-sm mt-1">
                Tel: (555) 123-4567<br />
                info@tudominio.com
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}