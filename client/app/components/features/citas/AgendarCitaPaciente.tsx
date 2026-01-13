"use client";

import { useState, useEffect } from "react";
import { defineStepper } from "@stepperize/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  User,
  Loader2,
  Check,
  CheckCircle2,
  Users,
  Search,
} from "lucide-react";
import { ApiRoutes } from "@/lib/api-routes";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/cliente";

// Definimos los pasos del stepper
const { useStepper } = defineStepper(
  { id: "step-1", title: "Seleccionar Paciente" },
  { id: "step-2", title: "Fecha y Motivo" },
  { id: "step-3", title: "Hora y Detalles" },
  { id: "step-4", title: "Confirmación" }
);

// Opciones de motivo de cita
const MOTIVO_OPTIONS = [
  { value: "Consulta general", label: "Consulta general" },
  { value: "Control", label: "Control de tratamiento" },
  { value: "Uña encarnada", label: "Uña encarnada" },
  { value: "Callosidades", label: "Callosidades" },
  { value: "Pie diabético", label: "Pie diabético" },
  { value: "Hongos", label: "Hongos en uñas/pies" },
  { value: "Dolor en el pie", label: "Dolor en el pie" },
  { value: "Otro", label: "Otro (especificar)" },
];

// Genera los time slots según el día
function generateTimeSlots(selectedDate: Date | undefined) {
  if (!selectedDate) return [];
  const dayOfWeek = selectedDate.getDay(); // 0=Dom, 6=Sab
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const startHour = 8;
  const endHour = isWeekend ? 16 : 17;

  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

interface Patient {
  usuario_id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  email?: string;
  celular?: string;
}

interface AppointmentData {
  pacienteId: string;
  fecha: Date | undefined;
  hora: string;
  motivo: string;
  motivoOtro: string;
  observaciones: string;
}

export function AgendarCitaPaciente() {
  const stepper = useStepper();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de pacientes
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [cedulaSearch, setCedulaSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Estados del podólogo logueado
  const [podologoId, setPodologoId] = useState<string | null>(null);
  const [podologoName, setPodologoName] = useState<string>("");

  // Estados de cita
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Datos del formulario
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    pacienteId: "",
    fecha: undefined,
    hora: "",
    motivo: "",
    motivoOtro: "",
    observaciones: "",
  });

  // Fechas deshabilitadas (pasadas y muy futuras)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  const disabledDays = [{ before: today }, { after: maxDate }];

  // Obtener podólogo logueado al montar
  useEffect(() => {
    const fetchPodologo = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setPodologoId(user.id);

          // Obtener datos del podólogo
          const res = await fetch(ApiRoutes.podologos.byId(user.id));
          if (res.ok) {
            const podologo = await res.json();
            setPodologoName(`${podologo.nombres} ${podologo.apellidos}`);
          }
        }
      } catch (error) {
        console.error("Error al obtener podólogo:", error);
      }
    };
    fetchPodologo();
  }, []);

  // Buscar pacientes por cédula
  useEffect(() => {
    const searchPatients = async () => {
      if (cedulaSearch.length < 2) {
        setPatients([]);
        return;
      }

      setLoadingPatients(true);
      try {
        const params = new URLSearchParams();
        params.append("cedula", cedulaSearch);
        params.append("estado", "activo");

        const res = await fetch(
          `${ApiRoutes.pacientes.base}?${params.toString()}`
        );
        if (!res.ok) throw new Error("Error al buscar pacientes");

        const data = await res.json();
        setPatients(data);
      } catch (error) {
        console.error("Error buscando pacientes:", error);
        toast.error("Error al buscar pacientes");
      } finally {
        setLoadingPatients(false);
      }
    };

    const timer = setTimeout(searchPatients, 400);
    return () => clearTimeout(timer);
  }, [cedulaSearch]);

  // Generar time slots cuando cambia la fecha
  useEffect(() => {
    if (appointmentData.fecha) {
      setTimeSlots(generateTimeSlots(appointmentData.fecha));
    }
  }, [appointmentData.fecha]);

  // Obtener slots ocupados cuando cambia la fecha y hay podólogo
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!appointmentData.fecha || !podologoId) return;

      setLoadingSlots(true);
      try {
        const dateStr = format(appointmentData.fecha, "yyyy-MM-dd");
        const res = await fetch(ApiRoutes.citas.byDate(podologoId, dateStr));

        if (!res.ok) throw new Error("Error al cargar disponibilidad");

        const citas = await res.json();
        // Filtrar citas canceladas (estado_id !== 3)
        const slots = citas
          .filter((c: { estado_id: number }) => c.estado_id !== 3)
          .map((c: { fecha_hora_inicio: string }) =>
            format(new Date(c.fecha_hora_inicio), "HH:mm")
          );
        setBookedSlots(slots);
      } catch (error) {
        console.error("Error al cargar slots:", error);
        toast.error("Error al verificar disponibilidad");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [appointmentData.fecha, podologoId]);

  // Handlers
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setAppointmentData((prev) => ({ ...prev, pacienteId: patient.usuario_id }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setAppointmentData((prev) => ({
      ...prev,
      fecha: date,
      hora: "", // Reset hora al cambiar fecha
    }));
    setBookedSlots([]);
  };

  const handleTimeSelect = (time: string) => {
    setAppointmentData((prev) => ({ ...prev, hora: time }));
  };

  const handleMotivoChange = (value: string) => {
    setAppointmentData((prev) => ({
      ...prev,
      motivo: value,
      motivoOtro: value !== "Otro" ? "" : prev.motivoOtro,
    }));
  };

  const handleObservacionesChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setAppointmentData((prev) => ({ ...prev, observaciones: e.target.value }));
  };

  const getMotivoFinal = () => {
    return appointmentData.motivo === "Otro"
      ? appointmentData.motivoOtro || "Otro"
      : appointmentData.motivo;
  };

  // Combinar fecha y hora
  const getFechaHoraCombinada = () => {
    if (!appointmentData.fecha || !appointmentData.hora) return null;
    const [hours, minutes] = appointmentData.hora.split(":").map(Number);
    const combined = new Date(appointmentData.fecha);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  };

  // Validaciones
  const canProceedToStep2 = !!selectedPatient;
  const canProceedToStep3 =
    !!appointmentData.fecha &&
    !!appointmentData.motivo &&
    (appointmentData.motivo !== "Otro" || !!appointmentData.motivoOtro.trim());
  const canProceedToStep4 = !!appointmentData.hora;

  // Confirmar cita
  const handleConfirmAppointment = async () => {
    if (!podologoId || !selectedPatient) return;

    const fechaHoraCombinada = getFechaHoraCombinada();
    if (!fechaHoraCombinada) return;

    setIsLoading(true);
    try {
      const payload = {
        fechaHoraInicio: fechaHoraCombinada.toISOString(),
        motivo_cita: getMotivoFinal(),
        observaciones_paciente: appointmentData.observaciones,
        userId: selectedPatient.usuario_id,
        podologoId: podologoId,
      };

      const res = await fetch(ApiRoutes.citas.base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al agendar la cita");
      }

      toast.success("¡Cita agendada exitosamente!", {
        description: `Cita programada para ${selectedPatient.nombres} ${selectedPatient.apellidos}`,
      });

      // Reset form
      resetForm();
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error al confirmar cita:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al agendar la cita"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setCedulaSearch("");
    setPatients([]);
    setAppointmentData({
      pacienteId: "",
      fecha: undefined,
      hora: "",
      motivo: "",
      motivoOtro: "",
      observaciones: "",
    });
    setTimeSlots([]);
    setBookedSlots([]);
    stepper.reset();
  };

  // Calcular progreso
  const currentStepIndex = stepper.all.findIndex(
    (step) => step.id === stepper.current.id
  );
  const progress = ((currentStepIndex + 1) / stepper.all.length) * 100;
  const hasPrevStep = !stepper.isFirst;
  const isLastStep = stepper.isLast;

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">
                Agendar cita para paciente
              </CardTitle>
              <CardDescription>
                {podologoName && `Agendando como: Dr. ${podologoName}`}
              </CardDescription>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              Paso {currentStepIndex + 1} de {stepper.all.length}
            </div>
          </div>
          <Progress value={progress} className="mt-2" />

          {/* Indicadores de pasos */}
          <div className="flex items-center justify-between mt-6">
            {stepper.all.map((step, index) => (
              <div
                key={step.id}
                className="flex flex-col items-center gap-2 flex-1"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                    index < currentStepIndex
                      ? "bg-primary border-primary text-primary-foreground"
                      : index === currentStepIndex
                      ? "border-primary text-primary bg-primary/10"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {index < currentStepIndex ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs text-center hidden sm:block",
                    index <= currentStepIndex
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-2">
          <div className="min-h-[400px]">
            {/* STEP 1: Seleccionar Paciente */}
            {stepper.when("step-1", () => (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                  <div className="text-center space-y-2">
                    <Users className="w-10 h-10 mx-auto text-primary" />
                    <h3 className="text-lg font-semibold">
                      Selecciona el paciente
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Busca por número de cédula
                    </p>
                  </div>

                  {/* Buscador */}
                  <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Ingresa la cédula del paciente..."
                      value={cedulaSearch}
                      onChange={(e) => setCedulaSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Resultados de búsqueda */}
                  {loadingPatients && (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Buscando pacientes...
                      </p>
                    </div>
                  )}

                  {!loadingPatients && patients.length > 0 && (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {patients.map((patient) => (
                        <div
                          key={patient.usuario_id}
                          onClick={() => handlePatientSelect(patient)}
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                            selectedPatient?.usuario_id === patient.usuario_id
                              ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                              : "border-border"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {patient.nombres} {patient.apellidos}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Cédula: {patient.cedula}
                              </p>
                              {patient.email && (
                                <p className="text-xs text-muted-foreground">
                                  {patient.email}
                                </p>
                              )}
                            </div>
                            {selectedPatient?.usuario_id ===
                              patient.usuario_id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!loadingPatients &&
                    cedulaSearch.length >= 2 &&
                    patients.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>No se encontraron pacientes con esa cédula</p>
                      </div>
                    )}

                  {cedulaSearch.length < 2 && !selectedPatient && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Ingresa al menos 2 dígitos de la cédula para buscar</p>
                    </div>
                  )}

                  {/* Paciente seleccionado */}
                  {selectedPatient && (
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <p className="text-sm font-medium text-center">
                        <Check className="w-4 h-4 inline mr-1 text-primary" />
                        Paciente seleccionado: {selectedPatient.nombres}{" "}
                        {selectedPatient.apellidos}
                      </p>
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        Cédula: {selectedPatient.cedula}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* STEP 2: Fecha y Motivo */}
            {stepper.when("step-2", () => (
              <div className="animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sección de Motivo */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                    <div className="text-center space-y-2">
                      <ClipboardList className="w-10 h-10 mx-auto text-primary" />
                      <h3 className="text-lg font-semibold">
                        Motivo de la cita
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ¿Por qué viene el paciente?
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Select
                        value={appointmentData.motivo}
                        onValueChange={handleMotivoChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOTIVO_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {appointmentData.motivo === "Otro" && (
                        <Input
                          placeholder="Especifica el motivo..."
                          value={appointmentData.motivoOtro}
                          onChange={(e) =>
                            setAppointmentData((prev) => ({
                              ...prev,
                              motivoOtro: e.target.value,
                            }))
                          }
                        />
                      )}

                      {appointmentData.motivo && (
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-center">
                            <Check className="w-4 h-4 inline mr-1 text-primary" />
                            {getMotivoFinal()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sección de Fecha */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                    <div className="text-center space-y-2">
                      <CalendarIcon className="w-10 h-10 mx-auto text-primary" />
                      <h3 className="text-lg font-semibold">
                        Fecha de la cita
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Elige el día de la consulta
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={appointmentData.fecha}
                        onSelect={handleDateChange}
                        disabled={disabledDays}
                        locale={es}
                        className="rounded-md border"
                      />
                    </div>

                    {appointmentData.fecha && (
                      <div className="bg-primary/10 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium">
                          <Check className="w-4 h-4 inline mr-1 text-primary" />
                          {format(appointmentData.fecha, "PPP", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {appointmentData.fecha.getDay() === 0 ||
                          appointmentData.fecha.getDay() === 6
                            ? "8:00 AM - 4:00 PM"
                            : "8:00 AM - 5:00 PM"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* STEP 3: Hora y Observaciones */}
            {stepper.when("step-3", () => (
              <div className="animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Sección de Hora */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                    <div className="text-center space-y-2">
                      <Clock className="w-10 h-10 mx-auto text-primary" />
                      <h3 className="text-lg font-semibold">
                        Horario disponible
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {appointmentData.fecha
                          ? format(appointmentData.fecha, "EEEE d 'de' MMMM", {
                              locale: es,
                            })
                          : "Selecciona una hora"}
                      </p>
                      {bookedSlots.length > 0 && (
                        <p className="text-xs text-orange-600">
                          {bookedSlots.length} horario(s) no disponible(s)
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[240px] overflow-y-auto p-2 border rounded-lg bg-background">
                      {loadingSlots ? (
                        <div className="col-span-full text-center py-4 text-muted-foreground">
                          Cargando disponibilidad...
                        </div>
                      ) : (
                        timeSlots.map((time) => {
                          const isBooked = bookedSlots.includes(time);
                          return (
                            <Button
                              key={time}
                              type="button"
                              variant={
                                appointmentData.hora === time
                                  ? "default"
                                  : isBooked
                                  ? "ghost"
                                  : "outline"
                              }
                              disabled={isBooked}
                              className={cn(
                                "h-10 text-sm",
                                appointmentData.hora === time &&
                                  "ring-2 ring-primary ring-offset-2",
                                isBooked &&
                                  "opacity-50 cursor-not-allowed line-through bg-muted text-muted-foreground"
                              )}
                              onClick={() =>
                                !isBooked && handleTimeSelect(time)
                              }
                            >
                              {time}
                            </Button>
                          );
                        })
                      )}
                    </div>
                    {appointmentData.hora && (
                      <div className="bg-primary/10 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium">
                          <Check className="w-4 h-4 inline mr-1 text-primary" />
                          Hora seleccionada: {appointmentData.hora}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sección de Observaciones */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                    <div className="text-center space-y-2">
                      <FileText className="w-10 h-10 mx-auto text-primary" />
                      <h3 className="text-lg font-semibold">Observaciones</h3>
                      <p className="text-sm text-muted-foreground">
                        Información adicional (opcional)
                      </p>
                    </div>
                    <Textarea
                      id="observaciones"
                      value={appointmentData.observaciones}
                      onChange={handleObservacionesChange}
                      placeholder="Ej: Paciente con diabetes, requiere atención especial..."
                      rows={6}
                      className="resize-none bg-background"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Añade notas relevantes para la consulta
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* STEP 4: Resumen y Confirmación */}
            {stepper.when("step-4", () => (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
                  <h3 className="text-lg font-semibold">Resumen de la cita</h3>
                  <p className="text-sm text-muted-foreground">
                    Verifica que todos los datos sean correctos
                  </p>
                </div>

                <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Paciente
                      </p>
                      <p className="text-base font-semibold">
                        {selectedPatient
                          ? `${selectedPatient.nombres} ${selectedPatient.apellidos}`
                          : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cédula: {selectedPatient?.cedula}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Fecha
                      </p>
                      <p className="text-base font-semibold">
                        {appointmentData.fecha
                          ? format(appointmentData.fecha, "PPPP", {
                              locale: es,
                            })
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Hora
                      </p>
                      <p className="text-base font-semibold">
                        {appointmentData.hora || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duración: 20 minutos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ClipboardList className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Motivo de la cita
                      </p>
                      <p className="text-base font-semibold">
                        {getMotivoFinal()}
                      </p>
                    </div>
                  </div>

                  {appointmentData.observaciones && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Observaciones
                        </p>
                        <p className="text-sm">
                          {appointmentData.observaciones}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <span className="font-semibold">Nota:</span> El paciente
                    recibirá un correo de confirmación con los detalles de su
                    cita.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="flex w-full justify-between items-center">
            <Button
              variant="outline"
              onClick={() => stepper.prev()}
              disabled={!hasPrevStep || isLoading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </Button>

            <div className="flex items-center gap-1">
              {stepper.all.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === currentStepIndex
                      ? "w-8 bg-primary"
                      : index < currentStepIndex
                      ? "w-2 bg-primary/60"
                      : "w-2 bg-muted"
                  )}
                />
              ))}
            </div>

            {isLastStep ? (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isLoading || !canProceedToStep4}
                className="gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar Cita
              </Button>
            ) : (
              <Button
                onClick={() => stepper.next()}
                disabled={
                  (currentStepIndex === 0 && !canProceedToStep2) ||
                  (currentStepIndex === 1 && !canProceedToStep3) ||
                  (currentStepIndex === 2 && !canProceedToStep4)
                }
                className="gap-2"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Alert Dialog de Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cita?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Estás a punto de agendar una cita con los siguientes detalles:
                </p>
                <div className="bg-muted p-3 rounded-md text-sm space-y-1 mt-2">
                  <p>
                    <span className="font-semibold">Paciente:</span>{" "}
                    {selectedPatient
                      ? `${selectedPatient.nombres} ${selectedPatient.apellidos}`
                      : "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Fecha:</span>{" "}
                    {appointmentData.fecha
                      ? format(appointmentData.fecha, "PPP", { locale: es })
                      : "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Hora:</span>{" "}
                    {appointmentData.hora}
                  </p>
                  <p>
                    <span className="font-semibold">Motivo:</span>{" "}
                    {getMotivoFinal()}
                  </p>
                </div>
                <p className="text-xs pt-2">
                  El paciente recibirá una notificación por correo electrónico.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAppointment}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sí, confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
