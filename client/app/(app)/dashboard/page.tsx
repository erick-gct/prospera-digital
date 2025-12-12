'use client';

import React from 'react';
import { 
  Calendar, Activity, FileText, ArrowRight, 
  CreditCard, TrendingUp, Smile, Frown, Meh, 
  ShoppingBag, Bell, ChevronRight, Zap 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const patientName = "Alejandro";

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-8">
      
      {/* --- 1. ENCABEZADO CON "CHECK-IN" EMOCIONAL --- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hola, {patientName}
          </h1>
          <p className="text-gray-500 mt-1">
            Resumen de su salud al 07 de Octubre, 2025.
          </p>
        </div>

        {/* Widget interactivo de "Cómo te sientes hoy" */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-600 pl-2">¿Cómo sienten sus pies hoy?</span>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-green-50 rounded-xl transition-colors group" title="Bien">
              <Smile className="w-6 h-6 text-gray-400 group-hover:text-[#20aca2]" />
            </button>
            <button className="p-2 hover:bg-yellow-50 rounded-xl transition-colors group" title="Molestia leve">
              <Meh className="w-6 h-6 text-gray-400 group-hover:text-yellow-500" />
            </button>
            <button className="p-2 hover:bg-red-50 rounded-xl transition-colors group" title="Dolor">
              <Frown className="w-6 h-6 text-gray-400 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* --- 2. GRID DE KPI's (Indicadores Clave) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Próxima Cita (Mini) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-16 h-16 text-[#2563eb]" />
          </div>
          <div className="relative z-10">
            <div className="text-xs font-bold text-[#2563eb] uppercase tracking-wider mb-1">Próxima Visita</div>
            <div className="text-2xl font-bold text-gray-900">12 Oct</div>
            <div className="text-sm text-gray-500">en 5 días</div>
            <Link href="/mis-citas" className="mt-4 inline-flex items-center text-xs font-bold text-[#2563eb] hover:underline">
              Ver detalles <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* KPI 2: Progreso General */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-[#20aca2]" />
          </div>
          <div className="relative z-10">
            <div className="text-xs font-bold text-[#20aca2] uppercase tracking-wider mb-1">Recuperación</div>
            <div className="text-2xl font-bold text-gray-900">85%</div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div className="bg-[#20aca2] h-1.5 rounded-full w-[85%]"></div>
            </div>
            <span className="mt-4 block text-xs text-gray-400">Excelente evolución</span>
          </div>
        </div>

        {/* KPI 3: Finanzas (Nuevo) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-16 h-16 text-purple-600" />
          </div>
          <div className="relative z-10">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Estado de Cuenta</div>
            <div className="text-2xl font-bold text-gray-900">$0.00</div>
            <div className="text-sm text-gray-500">Todo pagado</div>
            <button className="mt-4 inline-flex items-center text-xs font-bold text-purple-600 hover:underline">
              Historial de Pagos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 4: Notificaciones */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Avisos</div>
              <div className="text-lg font-bold text-gray-900 leading-tight">Clínica Cerrada</div>
              <div className="text-xs text-orange-800 mt-1">El Lunes 15 por feriado.</div>
            </div>
            <Bell className="w-6 h-6 text-orange-500" />
          </div>
        </div>
      </div>

      {/* --- 3. SECCIÓN PRINCIPAL DIVIDIDA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA (Grande): Evolución y Actividad */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Gráfico de Evolución (Estilizado con CSS) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#20aca2]" />
                Evolución del Dolor (Últimos 6 meses)
              </h3>
              <select className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1 text-gray-600 focus:ring-0">
                <option>Últimos 6 meses</option>
                <option>Último año</option>
              </select>
            </div>
            
            {/* Simulación visual de gráfico */}
            <div className="h-48 flex items-end justify-between gap-2 px-4">
              {[80, 65, 50, 40, 25, 10].map((height, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                  <div 
                    className="w-full bg-[#20aca2]/20 rounded-t-lg group-hover:bg-[#20aca2] transition-colors relative"
                    style={{ height: `${height}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded">
                      Nivel {height/10}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Mes {i+1}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">Nivel de dolor reportado (Escala 1-10)</p>
          </div>

          {/* Banner de Promoción (Marketing) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white p-8 shadow-lg">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block">
                  Promo del Mes
                </span>
                <h3 className="text-2xl font-bold mb-2">Estudio de Pisada 3D</h3>
                <p className="text-blue-100 text-sm max-w-md">
                  Renueve sus plantillas con nuestra nueva tecnología de escaneo láser. 20% de descuento para pacientes recurrentes.
                </p>
              </div>
              <button className="bg-white text-[#2563eb] px-6 py-2.5 rounded-xl font-bold text-sm shadow hover:bg-gray-50 transition-colors whitespace-nowrap">
                Solicitar Info
              </button>
            </div>
            {/* Decoración de fondo */}
            <Zap className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
          </div>

        </div>

        {/* COLUMNA DERECHA (Pequeña): Accesos Rápidos y Recursos */}
        <div className="space-y-6">
          
          {/* Widget de Documentos Recientes */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Documentos Recientes
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                <div className="bg-red-50 p-2 rounded-lg shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Receta Médica.pdf</h4>
                  <p className="text-xs text-gray-500">12 Oct 2025 • Dr. Martínez</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                <div className="bg-blue-50 p-2 rounded-lg shrink-0">
                  <Activity className="w-5 h-5 text-[#2563eb]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Informe Biomecánico.pdf</h4>
                  <p className="text-xs text-gray-500">28 Ago 2025 • Laboratorio</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 text-center text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
              Ver todos los archivos
            </button>
          </div>

          {/* Widget de Tienda / Productos (Upselling) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center justify-between">
              Recomendados
              <ShoppingBag className="w-4 h-4 text-gray-400" />
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 shadow-sm flex items-center justify-center">
                <span className="text-2xl">🧴</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900">Crema Urea 20%</h4>
              <p className="text-xs text-gray-500 mt-1 mb-3">Ideal para talones secos</p>
              <button className="text-xs font-bold text-[#20aca2] hover:underline">
                Ver producto
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}