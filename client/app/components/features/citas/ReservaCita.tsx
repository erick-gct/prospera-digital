"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { defineStepper } from "@stepperize/react";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  CalendarIcon,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

// --- Definición de pasos con Stepperize ---
const { useStepper } = defineStepper(
  { id: "step-1", title: "Fecha" },
  { id: "step-2", title: "Hora y Detalles" },
  { id: "step-3", title: "Confirmación" }
);

// --- Generar slots de horarios (8 AM - 6 PM, cada 20 min) ---
const generateTimeSlots = () => {
  const slots: string[] = [];
  const startHour = 8;
  const endHour = 18;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 20) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
    }
  }

  return slots;
};

const timeSlots = generateTimeSlots();

export function AppointmentForm() {
  const stepper = useStepper();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // --- Estado del formulario ---
  const [appointmentData, setAppointmentData] = useState({
    fecha: undefined as Date | undefined,
    hora: "",
    observaciones: "",
  });

  // Calcular índice actual y progreso
  const currentStepIndex = stepper.all.findIndex(
    (step) => step.id === stepper.current?.id
  );
  const hasPrevStep = currentStepIndex > 0;
  const isLastStep = currentStepIndex === stepper.all.length - 1;
  const progressValue = ((currentStepIndex + 1) / stepper.all.length) * 100;

  // --- Manejadores ---
  const handleDateChange = (date: Date | undefined) => {
    setAppointmentData((prev) => ({ ...prev, fecha: date }));
  };

  const handleTimeSelect = (time: string) => {
    setAppointmentData((prev) => ({ ...prev, hora: time }));
  };

  const handleObservacionesChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setAppointmentData((prev) => ({ ...prev, observaciones: e.target.value }));
  };

  // Deshabilitar domingos y días pasados
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0;
  };

  // Combinar fecha y hora para enviar a la BD
  const getFechaHoraCombinada = () => {
    if (!appointmentData.fecha || !appointmentData.hora) return null;

    const [hours, minutes] = appointmentData.hora.split(":").map(Number);
    const fechaHora = new Date(appointmentData.fecha);
    fechaHora.setHours(hours, minutes, 0, 0);

    return fechaHora;
  };

  const handleConfirmAppointment = async () => {
    setIsLoading(true);
    
    try {
      const fechaHoraCombinada = getFechaHoraCombinada();

      // Validación adicional
      if (!fechaHoraCombinada) {
        throw new Error("Faltan datos requeridos para la cita");
      }

      console.log("Datos de la cita:", {
        fecha_hora: fechaHoraCombinada,
        observaciones: appointmentData.observaciones,
      });

      // Aquí va tu llamada real a la API
      // const response = await fetch('/api/appointments', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     fecha_hora: fechaHoraCombinada,
      //     observaciones: appointmentData.observaciones,
      //   }),
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Error al reservar la cita');
      // }

      // Simulación de carga (eliminar en producción)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Simulación de error aleatorio para testing (eliminar en producción)
      // if (Math.random() > 0.7) {
      //   throw new Error("La hora seleccionada ya no está disponible");
      // }

      setIsLoading(false);
      setShowConfirmDialog(false);

      // Toast de éxito
      toast.success("¡Cita confirmada exitosamente!", {
        description: `Tu cita para el ${format(appointmentData.fecha!, "PPP", {
          locale: es,
        })} a las ${appointmentData.hora} ha sido agendada.`,
        icon: <CheckCircle2 className="h-5 w-5" />,
        duration: 5000,
      });

      // Opcional: Resetear el formulario después de éxito
      resetForm();
      
    } catch (error) {
      setIsLoading(false);
      setShowConfirmDialog(false);

      // Manejo de diferentes tipos de errores
      let errorMessage = "No se pudo reservar la cita. Por favor, intenta nuevamente.";
      let errorDescription = "";

      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Puedes personalizar mensajes según el tipo de error
        if (error.message.includes("disponible")) {
          errorDescription = "Por favor, selecciona otro horario.";
        } else if (error.message.includes("red") || error.message.includes("network")) {
          errorDescription = "Verifica tu conexión a internet.";
        } else if (error.message.includes("servidor") || error.message.includes("server")) {
          errorDescription = "Estamos experimentando problemas técnicos.";
        }
      }

      // Toast de error
      toast.error(errorMessage, {
        description: errorDescription || "Si el problema persiste, contacta a soporte.",
        icon: <XCircle className="h-5 w-5" />,
        duration: 6000,
        action: {
          label: "Reintentar",
          onClick: () => setShowConfirmDialog(true),
        },
      });

      console.error("Error al confirmar cita:", error);
    }
  };

  // Función para resetear el formulario (opcional)
  const resetForm = () => {
    setAppointmentData({
      fecha: undefined,
      hora: "",
      observaciones: "",
    });
    stepper.reset?.(); // Si stepperize tiene método reset
  };

  const canProceedToStep2 = appointmentData.fecha !== undefined;
  const canProceedToStep3 = canProceedToStep2 && appointmentData.hora !== "";

  return (
    <>
      <Card className="w-full max-w-2xl min-w-[640px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Reserva tu Cita
          </CardTitle>
          <CardDescription>
            Completa los 3 pasos para agendar tu consulta.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Barra de Progreso */}
          <div className="space-y-2">
            <Progress value={progressValue} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Paso {currentStepIndex + 1} de {stepper.all.length}
            </p>
          </div>

          {/* Stepper Personalizado */}
          <div className="relative">
            <div className="flex items-center justify-between">
              {stepper.all.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center flex-1 relative"
                  >
                    {index < stepper.all.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-1/2 top-5 h-0.5 w-full -z-10",
                          isCompleted ? "bg-primary" : "bg-muted"
                        )}
                      />
                    )}

                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all border-2",
                        isCompleted &&
                          "bg-primary border-primary text-primary-foreground",
                        isActive &&
                          "border-primary text-primary bg-background ring-4 ring-primary/20",
                        !isActive &&
                          !isCompleted &&
                          "border-muted-foreground/30 text-muted-foreground bg-background"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    <p
                      className={cn(
                        "text-xs mt-2 text-center max-w-[100px] transition-colors",
                        isActive
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contenido del Formulario */}
          <div className="space-y-4">
            {/* STEP 1: Selección de Fecha */}
            {stepper.when("step-1", () => (
              <div className="animate-in fade-in duration-300 space-y-4">
                <div className="text-center space-y-2">
                  <CalendarIcon className="w-12 h-12 mx-auto text-primary" />
                  <h3 className="text-lg font-semibold">
                    Selecciona la fecha de tu cita
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Elige el día que prefieres para tu consulta
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
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <p className="text-sm font-medium">
                      Fecha seleccionada:{" "}
                      <span className="text-primary font-bold">
                        {format(appointmentData.fecha, "PPPP", { locale: es })}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* STEP 2: Selección de Hora y Observaciones */}
            {stepper.when("step-2", () => (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <Label className="text-base font-semibold">
                      Selecciona la hora
                    </Label>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[280px] overflow-y-auto p-2 border rounded-lg">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={
                          appointmentData.hora === time ? "default" : "outline"
                        }
                        className={cn(
                          "h-12 text-sm",
                          appointmentData.hora === time &&
                            "ring-2 ring-primary ring-offset-2"
                        )}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <Label
                      htmlFor="observaciones"
                      className="text-base font-semibold"
                    >
                      Observaciones (opcional)
                    </Label>
                  </div>
                  <Textarea
                    id="observaciones"
                    value={appointmentData.observaciones}
                    onChange={handleObservacionesChange}
                    placeholder="Ej: Primera consulta, dolor en pie derecho..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Puedes agregar cualquier detalle que consideres importante
                  </p>
                </div>
              </div>
            ))}

            {/* STEP 3: Resumen y Confirmación */}
            {stepper.when("step-3", () => (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
                  <h3 className="text-lg font-semibold">Resumen de tu cita</h3>
                  <p className="text-sm text-muted-foreground">
                    Verifica que todos los datos sean correctos
                  </p>
                </div>

                <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
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
                    <span className="font-semibold">Nota:</span> Recibirás un
                    correo de confirmación una vez que reserves tu cita.
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
                disabled={isLoading || !canProceedToStep3}
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
                  (currentStepIndex === 1 && !canProceedToStep3)
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
            <AlertDialogTitle>¿Confirmar reserva de cita?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Estás a punto de reservar una cita con los siguientes
                  detalles:
                </p>
                <div className="bg-muted p-3 rounded-md text-sm space-y-1 mt-2">
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
                </div>
                <p className="text-xs pt-2">
                  Una vez confirmada, recibirás los detalles por correo
                  electrónico.
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