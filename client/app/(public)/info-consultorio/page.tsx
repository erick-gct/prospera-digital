import React from 'react';
import Image from 'next/image';
import { MapPin, Clock, Phone, Mail, Car, Accessibility, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ClinicInfoPage() {
  // COLORES DE REFERENCIA:
  // Principal (Turquesa): #20aca2
  // Acción (Azul): #2563eb
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* --- TÍTULO DE LA SECCIÓN --- */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Visite Nuestro Consultorio
          </h2>
          <div className="h-1 w-24 bg-[#20aca2] mx-auto rounded-full"></div>
          <p className="mt-4 text-lg text-gray-600">
            Un espacio diseñado para su comodidad y seguridad sanitaria.
          </p>
        </div>

        {/* --- GRID PRINCIPAL: DATOS Y MAPA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* COLUMNA IZQUIERDA: Tarjetas de Información */}
          <div className="space-y-6">
            
            {/* Tarjeta de Dirección */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#20aca2] flex items-start">
              <div className="bg-[#20aca2]/10 p-3 rounded-full mr-4 shrink-0">
                <MapPin className="w-6 h-6 text-[#20aca2]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Ubicación</h3>
                <p className="text-gray-600 mb-2">
                  Av. Principal 123, Edificio Médico "Salud Integral"<br />
                  Piso 4, Consultorio 405
                </p>
                <a href="#" className="text-[#20aca2] font-semibold text-sm hover:underline flex items-center">
                  Ver en Google Maps <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>

            {/* Tarjeta de Horarios */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#20aca2] flex items-start">
              <div className="bg-[#20aca2]/10 p-3 rounded-full mr-4 shrink-0">
                <Clock className="w-6 h-6 text-[#20aca2]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Horarios de Atención</h3>
                <div className="space-y-1 text-gray-600 text-sm">
                  <div className="flex justify-between w-48">
                    <span>Lunes - Viernes:</span>
                    <span className="font-medium text-gray-900">9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex justify-between w-48">
                    <span>Sábados:</span>
                    <span className="font-medium text-gray-900">9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between w-48 text-gray-400">
                    <span>Domingos:</span>
                    <span>Cerrado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Contacto */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#20aca2] flex items-start">
              {/* Nota: Aquí uso el AZUL (#2563eb) para resaltar la acción de llamar */}
              <div className="bg-blue-50 p-3 rounded-full mr-4 shrink-0">
                <Phone className="w-6 h-6 text-[#20aca2]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Contacto Directo</h3>
                <p className="text-gray-600 mb-3 text-sm">
                  Agende su cita vía telefónica o WhatsApp.
                </p>
                <div className="space-y-2">
                  <p className="font-bold text-xl text-[#20aca2] tracking-wide">
                    (555) 123-4567
                  </p>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Mail className="w-4 h-4 mr-2" />
                    info@consultoriopodologico.com
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: Mapa Visual (Placeholder) */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full min-h-[400px] relative border border-gray-100 group">
            <Image 
              src="/assets/consultorio.jpg" 
              alt="Fachada del Consultorio" 
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <div className="text-white">
                 <h3 className="font-bold text-xl mb-1">Visítenos</h3>
                 <p className="text-gray-200 text-sm">Contamos con instalaciones modernas y equipamiento de última generación.</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN DE COMODIDADES (AMENITIES) --- */}
        <div className="bg-[#20aca2]/5 rounded-3xl p-8 sm:p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Instalaciones y Servicios
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Comodidad 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <ShieldCheck className="w-8 h-8 text-[#20aca2]" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Bioseguridad Total</h4>
              <p className="text-sm text-gray-600">
                Protocolos estrictos de esterilización y desinfección de grado hospitalario en cada consulta.
              </p>
            </div>

            {/* Comodidad 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Accessibility className="w-8 h-8 text-[#20aca2]" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Acceso Universal</h4>
              <p className="text-sm text-gray-600">
                Consultorio ubicado en planta baja / con elevador, facilitando el acceso a adultos mayores.
              </p>
            </div>

            {/* Comodidad 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Car className="w-8 h-8 text-[#20aca2]" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Estacionamiento</h4>
              <p className="text-sm text-gray-600">
                Zona de parqueo disponible frente al edificio o convenio con estacionamiento cercano.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}