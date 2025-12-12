'use client';

import React, { useState } from 'react';
import { 
  Clock, MapPin, BellRing, Smartphone, 
  CalendarCheck, Download, FileText, 
  CheckCircle2, AlertCircle, XCircle, ChevronRight, History
} from 'lucide-react';

// --- DATOS DE EJEMPLO (MOCK DATA) ---
// Aquí simulamos que la base de datos devuelve dos tipos de citas
const allAppointments = [
  // --- PRÓXIMAS CITAS (FUTURE) ---
  {
    id: 1,
    type: 'upcoming', // Identificador clave para el filtro
    treatment: 'Corte Profiláctico y Limpieza',
    doctor: 'Dr. Alejandro Martínez',
    date: '12 Oct',
    year: '2025',
    time: '10:00 AM',
    status: 'confirmed', 
    location: 'Consultorio 405',
    notes: 'Recordatorio enviado por WhatsApp'
  },
  {
    id: 2,
    type: 'upcoming',
    treatment: 'Revisión de Plantillas',
    doctor: 'Dr. Alejandro Martínez',
    date: '28 Oct',
    year: '2025',
    time: '04:30 PM',
    status: 'pending',
    location: 'Consultorio 405',
    notes: 'Esperando confirmación'
  },
  // --- HISTORIAL CLÍNICO (PAST) ---
  {
    id: 3,
    type: 'history', // Identificador clave para el filtro
    treatment: 'Cirugía de Uña Encarnada',
    doctor: 'Dr. Alejandro Martínez',
    date: '15 Sep',
    year: '2025',
    time: '09:00 AM',
    status: 'completed',
    location: 'Consultorio 405',
    notes: 'Paciente dado de alta satisfactoriamente'
  },
  {
    id: 4,
    type: 'history',
    treatment: 'Consulta General',
    doctor: 'Dr. Alejandro Martínez',
    date: '10 Ago',
    year: '2025',
    time: '11:00 AM',
    status: 'cancelled',
    location: 'Consultorio 405',
    notes: 'Cancelada por el paciente'
  }
];

export default function MisCitasPage() {
  const [activeTab, setActiveTab] = useState('upcoming');

  // --- LÓGICA DE FILTRADO ---
  // Esta constante se recalcula cada vez que cambias de pestaña (activeTab)
  const displayedAppointments = allAppointments.filter(app => app.type === activeTab);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER CON WIDGET DE ESTADO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mis Citas</h1>
            <p className="text-gray-500 mt-1">Gestión inteligente de sus tratamientos.</p>
          </div>

          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="bg-[#20aca2]/10 p-2 rounded-full">
                <BellRing className="w-4 h-4 text-[#20aca2]" />
              </div>
              <span className="font-medium hidden sm:inline">Notificaciones:</span>
              <span className="text-[#20aca2] font-bold">ACTIVAS</span>
            </div>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <button className="text-xs font-medium text-[#2563eb] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center">
              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
              Configurar
            </button>
          </div>
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div className="flex items-center gap-8 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 text-sm font-bold transition-all relative px-2 ${
              activeTab === 'upcoming' ? 'text-[#20aca2]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Próximas Sesiones
            {activeTab === 'upcoming' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#20aca2] rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-bold transition-all relative px-2 ${
              activeTab === 'history' ? 'text-[#20aca2]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Historial Clínico
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#20aca2] rounded-t-full"></span>
            )}
          </button>
        </div>

        {/* CONTENIDO DE LA LISTA */}
        <div className="space-y-5">
          {displayedAppointments.length > 0 ? (
            displayedAppointments.map((cita) => (
              <div 
                key={cita.id}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#20aca2]/30 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* 1. INFORMACIÓN (Común para ambos) */}
                  <div className="flex items-start gap-5">
                    {/* Caja de Fecha: Turquesa para Próximas, Gris para Historial */}
                    <div className={`
                      flex flex-col items-center justify-center rounded-2xl w-20 h-20 shrink-0 border
                      ${activeTab === 'upcoming' 
                        ? 'bg-[#20aca2]/5 border-[#20aca2]/20 text-[#20aca2]' 
                        : 'bg-gray-50 border-gray-200 text-gray-500'}
                    `}>
                      <span className="text-xs font-bold uppercase tracking-wider mt-1">{cita.date.split(' ')[1]}</span>
                      <span className="text-3xl font-bold leading-none">{cita.date.split(' ')[0]}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`text-xl font-bold ${activeTab === 'history' ? 'text-gray-700' : 'text-gray-900'}`}>
                          {cita.treatment}
                        </h3>
                        
                        {/* BADGES DE ESTADO DINÁMICOS */}
                        {cita.status === 'confirmed' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#20aca2]/10 text-[#20aca2] text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Confirmada
                          </span>
                        )}
                        {cita.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                        {cita.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Finalizada
                          </span>
                        )}
                        {cita.status === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Cancelada
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-500 text-sm flex items-center gap-4 mb-2">
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5 opacity-60"/> {cita.time}</span>
                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5 opacity-60"/> {cita.location}</span>
                      </p>

                      {/* Nota sutil */}
                      <p className="text-xs text-gray-400 italic">
                        {cita.notes}
                      </p>
                    </div>
                  </div>

                  {/* 2. ACCIONES (DIFERENTES SEGÚN LA PESTAÑA) */}
                  <div className="flex items-center gap-3 md:border-l md:border-gray-100 md:pl-6">
                    
                    {activeTab === 'upcoming' ? (
                      // --- BOTONES PARA PRÓXIMAS CITAS ---
                      <>
                        <button 
                          className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-gray-50 hover:bg-[#2563eb]/5 text-gray-400 hover:text-[#2563eb] transition-all group/btn"
                          title="Sincronizar Calendario"
                        >
                          <CalendarCheck className="w-6 h-6 mb-1 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-medium">Sincronizar</span>
                        </button>
                        <button 
                          className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-gray-50 hover:bg-[#20aca2]/5 text-gray-400 hover:text-[#20aca2] transition-all group/btn"
                          title="Ver QR / Recibo"
                        >
                          <Download className="w-6 h-6 mb-1 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-medium">Pase</span>
                        </button>
                      </>
                    ) : (
                      // --- BOTONES PARA HISTORIAL (DIFERENTES) ---
                      <>
                        <button 
                          className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-gray-50 hover:bg-[#2563eb]/5 text-gray-400 hover:text-[#2563eb] transition-all group/btn"
                          title="Ver Diagnóstico"
                        >
                          <FileText className="w-6 h-6 mb-1 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-medium">Diagnóstico</span>
                        </button>
                         {/* Botón de volver a agendar (Re-booking) */}
                         <button 
                          className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-gray-50 hover:bg-[#20aca2]/5 text-gray-400 hover:text-[#20aca2] transition-all group/btn"
                          title="Agendar de nuevo"
                        >
                          <History className="w-6 h-6 mb-1 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-medium">Repetir</span>
                        </button>
                      </>
                    )}

                  </div>
                </div>
              </div>
            ))
          ) : (
            // --- EMPTY STATE (ESTADO VACÍO) ---
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'upcoming' ? 'No tienes citas próximas' : 'El historial está vacío'}
              </h3>
              <p className="text-gray-500 text-sm">
                {activeTab === 'upcoming' 
                  ? 'Todas tus consultas aparecerán aquí automáticamente.' 
                  : 'Tus tratamientos pasados se archivarán en esta sección.'}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER CONDICIONAL */}
        {activeTab === 'upcoming' && (
          <div className="mt-8 bg-blue-50/50 border-l-4 border-[#2563eb] rounded-r-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#2563eb] shrink-0" />
            <p className="text-sm text-gray-600">
              Puede reprogramar automáticamente hasta 24h antes. 
              <a href="#" className="text-[#2563eb] font-bold hover:underline ml-1">Gestionar cambios</a>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}