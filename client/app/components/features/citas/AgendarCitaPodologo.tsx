"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { defineStepper } from "@stepperize/react";
import { createClient } from "@/lib/supabase/cliente";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarIcon,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  User,
  Search,
  ChevronsUpDown
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ApiRoutes } from "@/lib/api-routes";
import { useRouter } from "next/navigation";

// --- Definición de pasos con Stepperize ---
const { useStepper } = defineStepper(
  { id: "step-1", title: "Seleccionar Paciente" },
  { id: "step-2", title: "Fecha y Motivo" },
  { id: "step-3", title: "Hora y Detalles" },
  { id: "step-4", title: "Confirmación" }
);

// --- Opciones de motivo de cita ---
const MOTIVO_OPTIONS = [
  { value: "primera_cita", label: "Primera cita" },
  { value: "rutina", label: "Rutina" },
  { value: "seguimiento", label: "Seguimiento de Tratamiento" },
  { value: "otro", label: "Otro" },
];

// --- Generar slots de horarios según día (L-V: 8AM-5PM, S-D: 8AM-4PM) ---
const generateTimeSlots = (selectedDate?: Date) => {
  const slots: string[] = [];
  const startHour = 8;
  
  let endHour = 17; // Por defecto lunes a viernes
  if (selectedDate) {
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      endHour = 16; // Fines de semana: hasta las 4pm
    }
  }

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
    }
  }
  return slots;
};

interface Patient {
    usuario_id: string;
    nombres: string;
    apellidos: string;
    cedula: string;
}

export default function AgendarCitaPodologo() {
  const router = useRouter();
  const stepper = useStepper();
  const [podologoId, setPodologoId] = useState<string | null>(null);

  // --- Estados de carga ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // --- Datos del Formulario ---
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");

  // --- Búsqueda de Pacientes ---
  const [openCombobox, setOpenCombobox] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)

  // --- Disponibilidad ---
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // --- Estado Confirmación ---
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 1. Obtener ID del Podólogo logueado
  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setPodologoId(user.id);
        }
    };
    fetchUser();
  }, []);

  // 2. Buscar Pacientes (Debounce manual simplificado)
  useEffect(() => {
    const searchPatients = async () => {
        if (searchQuery.length < 2) {
            setPatients([]);
            return;
        }

        setLoadingPatients(true);
        try {
            // Buscamos por apellido o cédula via API
            // Nota: ApiRoutes.pacientes.base acepta query params pero la interfaz de api-routes.ts es string
            // Construimos la URL manualmente para búsqueda
            // Asumimos que el backend soporta ?apellido=... o ?cedula=...
            // Probaremos buscando por cedula primero si es número, sino apellido
            
            const isNumber = /^\d+$/.test(searchQuery);
            const param = isNumber ? `cedula=${searchQuery}` : `apellido=${searchQuery}`;
            
            const res = await fetch(`${ApiRoutes.pacientes.base}?${param}`);
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
            }
        } catch (error) {
            console.error("Error buscando pacientes:", error);
        } finally {
            setLoadingPatients(false);
        }
    };

    const timeoutId = setTimeout(() => {
        if (openCombobox) searchPatients();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, openCombobox]);


  // 3. Buscar horarios ocupados (Globalmente)
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!date) return;
      
      setBookedSlots([]);
      setLoadingSlots(true);
      try {
        const dateStr = format(date, 'yyyy-MM-dd');
        // 'global' para bloquear todo el consultorio
        const res = await fetch(ApiRoutes.citas.byDate('global', dateStr));
        if (res.ok) {
          const citas = await res.json();
          const slots = citas.map((c: any) => 
            format(new Date(c.fecha_hora_inicio), 'HH:mm')
          );
          setBookedSlots(slots);
        }
      } catch (error) {
        console.error("Error cargando disponibilidad:", error);
        toast.error("Error verificando horarios disponibles");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [date]);


  // --- Navegación del Stepper ---
  const handleNext = () => {
    if (stepper.current.id === "step-1") {
        if (!selectedPatient) {
            toast.error("Seleccione un paciente");
            return;
        }
    }
    if (stepper.current.id === "step-2") {
      if (!date) {
        toast.error("Seleccione una fecha");
        return;
      }
      if (!motivo) {
        toast.error("Seleccione un motivo");
        return;
      }
    }
    if (stepper.current.id === "step-3") {
      if (!time) {
        toast.error("Seleccione una hora");
        return;
      }
    }
    
    stepper.next();
  };

  const handlePrev = () => {
    stepper.prev();
  };

  // --- Confirmación y Envío ---
  const handleConfirm = () => {
    setShowConfirmDialog(true);
  };

  const submitAppointment = async () => {
    if (!selectedPatient || !date || !time || !motivo || !podologoId) return;

    setIsSubmitting(true);
    setShowConfirmDialog(false);

    try {
      // Construir fecha ISO
      const [hours, minutes] = time.split(":").map(Number);
      const appointmentDate = new Date(date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      // Payload
      const payload = {
        userId: selectedPatient.usuario_id, // EL ID DEL PACIENTE SELECCIONADO
        podologoId: podologoId,             // EL PODÓLOGO LOGUEADO
        fechaHoraInicio: appointmentDate.toISOString(),
        motivo_cita: motivo === "otro" ? "Otro" : MOTIVO_OPTIONS.find(m => m.value === motivo)?.label || motivo,
        observaciones_paciente: observaciones || "Agendada por Dr/a.", 
      };

      const res = await fetch(ApiRoutes.citas.base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al reservar");
      }

      toast.success("Cita agendada exitosamente", {
        description: `Paciente: ${selectedPatient.nombres} ${selectedPatient.apellidos}`,
      });

      // Redirigir a agenda
      router.push("/agenda");

    } catch (error) {
      console.error("Error reservando:", error);
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-primary flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Agendar Cita a Paciente
        </CardTitle>
        <CardDescription>
            Complete los pasos para registrar una nueva cita en el sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stepper Header */}
        <nav aria-label="Progreso" className="mb-8">
            <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 sm:text-base">
                {stepper.all.map((step, index, array) => (
                    <li key={step.id} className={cn(
                        "flex items-center",
                        index < array.length - 1 ? "w-full after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10" : "",
                        stepper.current.id === step.id ? "text-primary" : ""
                    )}>
                        <span className="flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200">
                            {index + 1 < array.indexOf(stepper.current) + 1 ? (
                                <CheckCircle2 className="w-6 h-6 mr-2.5" />
                            ) : (
                                <span className={cn("mr-2.5", stepper.current.id === step.id && "font-bold")}>{index + 1}</span>
                            )}
                            {step.title}
                        </span>
                    </li>
                ))}
            </ol>
        </nav>

        {/* --- PASO 1: SELECCIONAR PACIENTE --- */}
        {stepper.current.id === "step-1" && (
            <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col gap-4">
                    <Label>Buscar Paciente</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="w-full justify-between"
                            >
                                {selectedPatient
                                    ? `${selectedPatient.nombres} ${selectedPatient.apellidos} (${selectedPatient.cedula})`
                                    : "Buscar por nombre o cédula..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                            <Command shouldFilter={false}>
                                <CommandInput 
                                    placeholder="Escriba nombre o cédula..." 
                                    value={searchQuery}
                                    onValueChange={setSearchQuery}
                                />
                                <CommandList>
                                    {loadingPatients && (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Buscando...
                                        </div>
                                    )}
                                    {!loadingPatients && patients.length === 0 && (
                                        <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
                                    )}
                                    {patients.map((patient: Patient) => (
                                        <CommandItem
                                            key={patient.usuario_id}
                                            value={patient.usuario_id} // Usamos ID como value unico
                                            onSelect={() => {
                                                setSelectedPatient(patient);
                                                setOpenCombobox(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedPatient?.usuario_id === patient.usuario_id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{patient.nombres} {patient.apellidos}</span>
                                                <span className="text-xs text-muted-foreground">CI: {patient.cedula}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    
                    {selectedPatient && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-blue-900">Paciente Seleccionado</h4>
                                    <p className="text-sm text-blue-700">{selectedPatient.nombres} {selectedPatient.apellidos}</p>
                                    <p className="text-xs text-blue-600">C.I: {selectedPatient.cedula}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {!selectedPatient && (
                        <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                            <p>Escriba al menos 2 caracteres para buscar.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- PASO 2: FECHA Y MOTIVO --- */}
        {stepper.current.id === "step-2" && (
          <div className="grid md:grid-cols-2 gap-8 py-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-4">
              <Label>Selecciona la fecha</Label>
              <div className="border rounded-md p-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={es}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today || date.getDay() === 0 && false; // Permitimos domingos si se quiere
                  }}
                  initialFocus
                  className="rounded-md border shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo de la consulta</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger id="motivo" className="w-full">
                    <SelectValue placeholder="Seleccione un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVO_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Detalles adicionales..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- PASO 3: HORA Y DETALLES --- */}
        {stepper.current.id === "step-3" && (
          <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Horarios Disponibles</h3>
                {date && <span className="text-sm text-muted-foreground">{format(date, "EEEE, d 'de' MMMM", { locale: es })}</span>}
            </div>
            
            {loadingSlots ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {generateTimeSlots(date).map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        return (
                            <Button
                                key={slot}
                                variant={time === slot ? "default" : "outline"}
                                className={cn(
                                    "text-sm h-10",
                                    isBooked && "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 decoration-slate-500"
                                )}
                                disabled={isBooked}
                                onClick={() => setTime(slot)}
                            >
                                {slot}
                            </Button>
                        );
                    })}
                </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <div className="w-3 h-3 bg-slate-100 border rounded-sm" />
                <span>No disponible</span>
                <div className="w-3 h-3 bg-primary rounded-sm ml-4" />
                <span>Seleccionado</span>
            </div>
          </div>
        )}

        {/* --- PASO 4: CONFIRMACIÓN --- */}
        {stepper.current.id === "step-4" && (
          <div className="py-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-slate-50 border rounded-lg p-6 max-w-md mx-auto space-y-6">
                <h3 className="font-semibold text-center text-lg text-primary">Resumen de la Cita</h3>
                
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Paciente</p>
                            <p className="text-base font-semibold">{selectedPatient?.nombres} {selectedPatient?.apellidos}</p>
                            <p className="text-xs text-muted-foreground">{selectedPatient?.cedula}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                            <p className="text-base font-semibold">
                                {date ? format(date, "EEEE, d 'de' MMMM yyyy", { locale: es }) : "-"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Hora</p>
                            <p className="text-base font-semibold">{time || "-"}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                            <p className="text-base font-semibold capitalize">
                                {motivo === "otro" ? "Otro" : MOTIVO_OPTIONS.find(m => m.value === motivo)?.label}
                            </p>
                            {observaciones && (
                                <p className="text-sm text-muted-foreground mt-1 italic">"{observaciones}"</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Al confirmar, se enviará un correo automático al paciente con los detalles de la cita.</p>
                </div>
             </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t p-6">
        <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={stepper.isFirst || isSubmitting}
            className="gap-2"
        >
            <ChevronLeft className="h-4 w-4" />
            Atrás
        </Button>

        {stepper.isLast ? (
             <Button 
                onClick={handleConfirm} 
                disabled={isSubmitting}
                className="gap-2 bg-green-600 hover:bg-green-700"
             >
                {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Check className="h-4 w-4" />
                )}
                Confirmar Cita
             </Button>
        ) : (
            <Button onClick={handleNext} disabled={isSubmitting} className="gap-2">
                Siguiente
                <ChevronRight className="h-4 w-4" />
            </Button>
        )}
      </CardFooter>

      {/* Dialogo de Confirmación Final */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar agendamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de agendar una cita para <strong>{selectedPatient?.nombres} {selectedPatient?.apellidos}</strong> el día <strong>{date ? format(date, "d 'de' MMMM", { locale: es }) : ""}</strong> a las <strong>{time}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => { e.preventDefault(); submitAppointment(); }}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sí, Agendar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
