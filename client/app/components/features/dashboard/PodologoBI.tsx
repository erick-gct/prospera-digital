"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pill, Activity, Footprints, Flame, Users, CalendarClock, UserMinus } from "lucide-react";

interface BIAnalytics {
  topPatologias: { name: string; value: number }[];
  topMedicamentos: { name: string; value: number }[];
  distribucionMotivos: { name: string; value: number }[];
  semanalHeatmap: { day: string; hour: number; value: number }[];
  tasaRetencion: number;
  tasaAusentismo: number;
}

interface PodologoBIProps {
  data: BIAnalytics;
}

// ... existing code ...

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];
const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 8am to 6pm
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function PodologoBI({ data }: PodologoBIProps) {
  if (!data) return null;

  // Helper para mapa de calor
  const getDensityColor = (count: number) => {
    if (count === 0) return 'bg-slate-50';
    if (count < 3) return 'bg-blue-100';
    if (count < 5) return 'bg-blue-300';
    return 'bg-blue-500 text-white';
  };

  const getHeatmapValue = (day: string, hour: number) => {
    const found = data.semanalHeatmap?.find(d => d.day === day && d.hour === hour);
    return found ? found.value : 0;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* KPI Tasa de Retención (Nueva) */}
      <Card className="col-span-1 shadow-sm border-indigo-100/50 bg-gradient-to-br from-white to-indigo-50/30">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                Tasa de Retención
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-indigo-600">{data.tasaRetencion}%</span>
                <span className="text-xs text-muted-foreground">Pacientes recurrentes</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${data.tasaRetencion}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Aproximadamente el <span className="font-medium text-indigo-600">{data.tasaRetencion}%</span> de los pacientes han regresado al consultorio por otra cita.
            </p>
        </CardContent>
      </Card>

      {/* KPI Tasa de Ausentismo (Nueva) */}
      <Card className="col-span-1 shadow-sm border-orange-100/50 bg-gradient-to-br from-white to-orange-50/30">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-orange-500" />
                Tasa de Ausentismo (Global)
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600">{data.tasaAusentismo}%</span>
                <span className="text-xs text-muted-foreground">Citas no asistidas</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${data.tasaAusentismo}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                El <span className="font-medium text-orange-600">{data.tasaAusentismo}%</span> de las citas del consultorio resultaron en ausencia.
            </p>
        </CardContent>
      </Card>

      {/* 1. Top Patologías (Bar Chart) - Fits in 2 cols */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-sm border-blue-100/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-primary">
            <Footprints className="h-5 w-5" />
            Patologías Más Frecuentes
          </CardTitle>
          <CardDescription>Basado en fichas de evaluación (Global)</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.topPatologias}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                tick={{ fontSize: 12 }} 
                tickLine={false}
              />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Distribución de Motivos (Pie Chart) - Fits in remaining col */}
      <Card className="col-span-1 md:col-span-1 lg:col-span-2 shadow-sm border-blue-100/50">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Motivos de Visita</CardTitle>
          <CardDescription>Distribución global del consultorio</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.distribucionMotivos}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {data.distribucionMotivos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4. Mapa de Calor (Nuevo) */}
      <Card className="col-span-1 md:col-span-1 lg:col-span-2 shadow-sm border-orange-100/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
                <Flame className="h-5 w-5 text-orange-500" />
                Mapa de Calor (Horarios Pico)
            </CardTitle>
            <CardDescription>Intensidad Global (Trimestre hasta mes seleccionado)</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="grid grid-cols-[auto_repeat(6,1fr)] gap-1 text-xs">
                {/* Header Días */}
                <div className="col-start-2 col-span-6 grid grid-cols-6 text-center text-muted-foreground mb-1 font-medium">
                    {DAYS.map(d => <div key={d}>{d.substring(0, 3)}</div>)}
                </div>

                {/* Filas Horas */}
                {HOURS.map(hour => (
                    <React.Fragment key={hour}>
                        <div className="text-right pr-2 text-slate-400 py-1">{hour}:00</div>
                        {DAYS.map(day => {
                            const val = getHeatmapValue(day, hour);
                            return (
                                <div 
                                    key={`${day}-${hour}`} 
                                    className={`rounded-sm flex items-center justify-center text-[10px] ${getDensityColor(val)} transition-colors hover:ring-2 ring-blue-400`}
                                    title={`${day} ${hour}:00 - ${val} citas`}
                                >
                                    {val > 0 && val}
                                </div>
                            )
                        })}
                    </React.Fragment>
                ))}
             </div>
             <div className="flex justify-end items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 rounded-sm"></div> Baja</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-300 rounded-sm"></div> Media</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Alta</div>
             </div>
        </CardContent>
      </Card>

      {/* 3. Top Medicamentos (List Version) - Full Width */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-4 shadow-sm border-blue-100/50 bg-slate-50/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
                <Pill className="h-5 w-5" />
                Medicamentos Recetados (Top 5)
            </CardTitle>
        </CardHeader>

        <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {data.topMedicamentos.map((med, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition-shadow">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-400 to-blue-600`}>
                            #{index + 1}
                        </div>
                        <span className="font-medium text-sm text-slate-700 line-clamp-2 min-h-[40px] flex items-center">{med.name}</span>
                        <div className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">
                            {med.value} Recetas
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
