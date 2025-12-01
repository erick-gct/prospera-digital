/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  CalendarIcon,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { toast } from "sonner";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { createClient } from "@/lib/supabase/cliente";
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

// --- Definición de pasos ---
const { useStepper } = defineStepper(
  { id: "step-1", title: "Información Personal" },
  { id: "step-2", title: "Cuenta" },
  { id: "step-3", title: "Ubicación" },
  { id: "step-4", title: "Salud" }
);

export function RegisterForm() {
  const stepper = useStepper();
  const router = useRouter();

  // --- ESTADOS ---
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Nuevo estado para errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [paisesOptions, setPaisesOptions] = useState<ComboboxOption[]>([]);
  const [tiposSangreOptions, setTiposSangreOptions] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    fechaNacimiento: undefined as Date | undefined,
    email: "",
    password: "",
    paisId: undefined as number | undefined,
    ciudad: "",
    direccion: "",
    telefono: "",
    tipoSangreId: undefined as number | undefined,
    enfermedades: "",
  });

  // --- CARGAR DATOS ---
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const resPaises = await fetch("http://localhost:3001/common/paises");
        if (resPaises.ok) {
          const dataPaises = await resPaises.json();
          if (Array.isArray(dataPaises)) {
            setPaisesOptions(
              dataPaises.map((p: any) => ({
                value: p.id.toString(),
                label: p.nombre,
              }))
            );
          }
        }

        const resSangre = await fetch(
          "http://localhost:3001/common/tipos-sangre"
        );
        if (resSangre.ok) {
          const dataSangre = await resSangre.json();
          if (Array.isArray(dataSangre)) {
            setTiposSangreOptions(dataSangre);
          }
        }
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      } finally {
        setLoadingCatalogs(false);
      }
    };
    fetchCatalogs();
  }, []);

  // --- HANDLERS ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error al escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, fechaNacimiento: date }));
    if (errors.fechaNacimiento && date) {
       setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.fechaNacimiento;
        return newErrors;
      });
    }
  };

  const handleCountryChange = (valueAsString: string) => {
    setFormData((prev) => ({ ...prev, paisId: Number(valueAsString) }));
    if (errors.paisId) {
        setErrors((prev) => { const n = {...prev}; delete n.paisId; return n; });
    }
  };

  const handleBloodTypeChange = (valueAsString: string) => {
    setFormData((prev) => ({ ...prev, tipoSangreId: Number(valueAsString) }));
    if (errors.tipoSangreId) {
        setErrors((prev) => { const n = {...prev}; delete n.tipoSangreId; return n; });
    }
  };

  // --- VALIDACIÓN ---
  const validateStep = (stepId: string) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (stepId === "step-1") {
      if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
      if (!formData.apellido.trim()) newErrors.apellido = "El apellido es obligatorio.";
      if (!formData.cedula.trim()) newErrors.cedula = "La cédula es obligatoria.";
      if (!formData.fechaNacimiento) newErrors.fechaNacimiento = "La fecha es obligatoria.";
    }

    if (stepId === "step-2") {
      // Validación de Email con Regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = "El email es obligatorio.";
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Ingresa un correo válido (ej: usuario@dominio.com).";
      }

      if (!formData.password) {
        newErrors.password = "La contraseña es obligatoria.";
      } else if (formData.password.length < 8) {
        newErrors.password = "La contraseña debe tener al menos 8 caracteres.";
      }
    }

    if (stepId === "step-3") {
      if (!formData.paisId) newErrors.paisId = "El país es obligatorio.";
      if (!formData.ciudad.trim()) newErrors.ciudad = "La ciudad es obligatoria.";
      if (!formData.direccion.trim()) newErrors.direccion = "La dirección es obligatoria.";
      if (!formData.telefono.trim()) newErrors.telefono = "El teléfono es obligatorio.";
    }

    if (stepId === "step-4") {
      if (!formData.tipoSangreId) newErrors.tipoSangreId = "El tipo de sangre es obligatorio.";
      // Enfermedades es opcional, no validamos nada aquí.
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
      toast.error("Por favor completa los campos requeridos.");
    } else {
      setErrors({}); // Limpiar errores si todo está bien
    }

    return isValid;
  };

  // --- NAVEGACIÓN ---
  const handleNext = () => {
    // Validar el paso actual antes de avanzar
    if (stepper.current && validateStep(stepper.current.id)) {
      stepper.next();
    }
  };

  const handleOpenSummary = () => {
    // Validar el último paso antes de abrir el resumen
    if (validateStep("step-4")) {
      setShowSummary(true);
    }
  };

  const handleConfirmRegistration = async () => {
    setShowSummary(false);
    setIsLoading(true);
    const supabase = createClient();

    try {
      const response = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Error al registrar");

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      setShowSuccess(true);
    } catch (error) {
      toast.error("Error al crear la cuenta", {
        description: (error as Error).message,
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    setShowSuccess(false);
    router.push("/login");
  };

  const currentStepIndex = stepper.all.findIndex(
    (step) => step.id === stepper.current?.id
  );
  const hasPrevStep = currentStepIndex > 0;
  const isLastStep = currentStepIndex === stepper.all.length - 1;
  const progressValue = ((currentStepIndex + 1) / stepper.all.length) * 100;

  // Helpers para el resumen
  const getPaisLabel = () =>
    paisesOptions.find((p) => Number(p.value) === formData.paisId)?.label || "No seleccionado";
  const getTipoSangreLabel = () =>
    tiposSangreOptions.find((t) => t.id === formData.tipoSangreId)?.nombre || "No seleccionado";

  // Componente Helper para mostrar error
  const ErrorMessage = ({ field }: { field: string }) => {
    return errors[field] ? (
      <p className="text-xs text-red-500 font-medium mt-1">{errors[field]}</p>
    ) : null;
  };

  return (
    <>
      <Card className="w-full max-w-2xl min-w-[640px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Crea tu cuenta
          </CardTitle>
          <CardDescription>
            Completa los 4 pasos para registrarte en el sistema.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Progress value={progressValue} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Paso {currentStepIndex + 1} de {stepper.all.length}
            </p>
          </div>

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
                        "text-xs mt-2 text-center max-w-[80px] transition-colors",
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

          <form className="space-y-4">
            {stepper.when("step-1", () => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className={errors.nombre ? "text-red-500" : ""}>Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Juan"
                    className={errors.nombre ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  <ErrorMessage field="nombre" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido" className={errors.apellido ? "text-red-500" : ""}>Apellido</Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    placeholder="Ej: Pérez"
                    className={errors.apellido ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                   <ErrorMessage field="apellido" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cedula" className={errors.cedula ? "text-red-500" : ""}>Cédula</Label>
                  <Input
                    id="cedula"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    placeholder="Ej: 0123456789"
                    className={errors.cedula ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                   <ErrorMessage field="cedula" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento" className={errors.fechaNacimiento ? "text-red-500" : ""}>Fecha de Nacimiento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.fechaNacimiento && "text-muted-foreground",
                          errors.fechaNacimiento && "border-red-500 text-red-500 hover:text-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.fechaNacimiento ? (
                          format(formData.fechaNacimiento, "PPP", {
                            locale: es,
                          })
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.fechaNacimiento}
                        onSelect={handleDateChange}
                        initialFocus
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <ErrorMessage field="fechaNacimiento" />
                </div>
              </div>
            ))}

            {stepper.when("step-2", () => (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ejemplo@correo.com"
                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  <ErrorMessage field="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className={errors.password ? "text-red-500" : ""}>Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                   <ErrorMessage field="password" />
                </div>
              </div>
            ))}

            {stepper.when("step-3", () => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="pais" className={errors.paisId ? "text-red-500" : ""}>País</Label>
                  {loadingCatalogs ? (
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                  ) : (
                    <div className={errors.paisId ? "border rounded-md border-red-500" : ""}>
                        <Combobox
                        options={paisesOptions}
                        value={formData.paisId?.toString() || ""}
                        onValueChange={handleCountryChange}
                        placeholder="Selecciona un país..."
                        searchPlaceholder="Buscar país..."
                        emptyPlaceholder="País no encontrado."
                        />
                    </div>
                  )}
                   <ErrorMessage field="paisId" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad" className={errors.ciudad ? "text-red-500" : ""}>Ciudad</Label>
                  <Input
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    placeholder="Ej: Quito"
                    className={errors.ciudad ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                   <ErrorMessage field="ciudad" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="direccion" className={errors.direccion ? "text-red-500" : ""}>Dirección</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Ej: Av. Principal 123"
                    className={errors.direccion ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                   <ErrorMessage field="direccion" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="telefono" className={errors.telefono ? "text-red-500" : ""}>Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej: +593 99 123 4567"
                    className={errors.telefono ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                   <ErrorMessage field="telefono" />
                </div>
              </div>
            ))}

            {stepper.when("step-4", () => (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="tipoSangre" className={errors.tipoSangreId ? "text-red-500" : ""}>Tipo de Sangre</Label>
                  <Select
                    onValueChange={handleBloodTypeChange}
                    value={formData.tipoSangreId?.toString() || ""}
                  >
                    <SelectTrigger className={errors.tipoSangreId ? "border-red-500 focus:ring-red-500" : ""}>
                      <SelectValue placeholder="Selecciona tu tipo de sangre" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposSangreOptions.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ErrorMessage field="tipoSangreId" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enfermedades">
                    Enfermedades o Alergias (opcional)
                  </Label>
                  <Textarea
                    id="enfermedades"
                    name="enfermedades"
                    value={formData.enfermedades}
                    onChange={handleChange}
                    placeholder="Ej: Alergia a la penicilina, Diabetes tipo 2..."
                    rows={4}
                  />
                </div>
              </div>
            ))}
          </form>
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
                onClick={handleOpenSummary}
                disabled={isLoading}
                className="gap-2"
              >
                Finalizar Registro
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showSummary} onOpenChange={setShowSummary}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Revisa tu información</AlertDialogTitle>
            <AlertDialogDescription>
              Verifica que los datos sean correctos antes de crear tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-4 py-4 text-sm border rounded-lg p-4 bg-muted/20 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="font-semibold text-muted-foreground">Nombre:</div>
              <div>
                {formData.nombre} {formData.apellido}
              </div>

              <div className="font-semibold text-muted-foreground">Cédula:</div>
              <div>{formData.cedula}</div>

              <div className="font-semibold text-muted-foreground">
                Fecha Nac:
              </div>
              <div>
                {formData.fechaNacimiento
                  ? format(formData.fechaNacimiento, "PPP", { locale: es })
                  : "-"}
              </div>

              <div className="font-semibold text-muted-foreground">Email:</div>
              <div className="break-all">{formData.email}</div>

              <div className="font-semibold text-muted-foreground">País:</div>
              <div>{getPaisLabel()}</div>

              <div className="font-semibold text-muted-foreground">Ciudad:</div>
              <div>{formData.ciudad}</div>

              <div className="font-semibold text-muted-foreground">
                Dirección:
              </div>
              <div className="break-words">{formData.direccion}</div>

              <div className="font-semibold text-muted-foreground">
                Teléfono:
              </div>
              <div>{formData.telefono}</div>

              <div className="font-semibold text-muted-foreground">Sangre:</div>
              <div>{getTipoSangreLabel()}</div>

              <div className="font-semibold text-muted-foreground">
                Enfermedades:
              </div>
              <div className="break-words col-span-2 sm:col-span-1">
                {formData.enfermedades || "Ninguna"}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRegistration}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccess}>
        <AlertDialogContent className="max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl text-green-700">
              ¡Felicidades!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              Creaste tu cuenta exitosamente. Bienvenido a nuestro consultorio.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 text-muted-foreground text-sm">
            <p>
              Ahora, por favor revisa tu correo electrónico para activar tu
              cuenta y poder iniciar sesión.
            </p>
          </div>

          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={handleFinish}
              className="w-full sm:w-auto"
            >
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}