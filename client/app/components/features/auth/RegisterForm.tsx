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
// Quitamos imports de Command que ya no se usan directamente aquí
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
  CheckCircle2, // Importamos el icono de éxito
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { toast } from "sonner";
// Importamos el componente Combobox que creaste
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
// Aseguramos el nombre correcto del archivo de Supabase
import { createClient } from "@/lib/supabase/cliente";
// Importamos los componentes de Alert Dialog
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

// --- Definición de pasos con Stepperize ---
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

  // --- ESTADO PARA LOS CATÁLOGOS ---
  const [paisesOptions, setPaisesOptions] = useState<ComboboxOption[]>([]);
  const [tiposSangreOptions, setTiposSangreOptions] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // --- Estado del formulario ---
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

  // --- CARGAR DATOS DE LA API ---
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        // 1. Países
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

        // 2. Tipos de Sangre
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
        toast.error("Error de conexión", {
          description: "No se pudieron cargar las listas desplegables.",
        });
      } finally {
        setLoadingCatalogs(false);
      }
    };

    fetchCatalogs();
  }, []);

  // Variables de Progreso
  const currentStepIndex = stepper.all.findIndex(
    (step) => step.id === stepper.current?.id
  );
  const hasPrevStep = currentStepIndex > 0;
  const isLastStep = currentStepIndex === stepper.all.length - 1;
  const progressValue = ((currentStepIndex + 1) / stepper.all.length) * 100;

  // --- MANEJADORES ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, fechaNacimiento: date }));
  };

  const handleCountryChange = (valueAsString: string) => {
    setFormData((prev) => ({ ...prev, paisId: Number(valueAsString) }));
  };

  const handleBloodTypeChange = (valueAsString: string) => {
    setFormData((prev) => ({ ...prev, tipoSangreId: Number(valueAsString) }));
  };

  // --- HELPERS PARA EL RESUMEN ---
  const getPaisLabel = () => {
    return (
      paisesOptions.find((p) => Number(p.value) === formData.paisId)?.label ||
      "No seleccionado"
    );
  };

  const getTipoSangreLabel = () => {
    return (
      tiposSangreOptions.find((t) => t.id === formData.tipoSangreId)?.nombre ||
      "No seleccionado"
    );
  };

  // --- FLUJO DE ENVÍO ---

  // 1. Abrir Resumen
  const handleOpenSummary = () => {
    // Aquí puedes validar campos obligatorios si deseas
    setShowSummary(true);
  };

  // 2. Confirmar y Enviar a API
  const handleConfirmRegistration = async () => {
    setShowSummary(false);
    setIsLoading(true);
    const supabase = createClient();

    try {
      console.log("Enviando DTO:", formData);

      const response = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Error al registrar");

      // Guardar sesión si existe
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      setShowSuccess(true); // Mostrar éxito
    } catch (error) {
      toast.error("Error al crear la cuenta", {
        description: (error as Error).message,
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Redirigir
  const handleFinish = () => {
    setShowSuccess(false);
    router.push("/login");
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
          {/* Barra de Progreso */}
          <div className="space-y-2">
            <Progress value={progressValue} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Paso {currentStepIndex + 1} de {stepper.all.length}
            </p>
          </div>

          {/* Stepper Visual (Tu diseño original) */}
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

          {/* Formulario */}
          <form className="space-y-4">
            {/* STEP 1 */}
            {stepper.when("step-1", () => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Juan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    placeholder="Ej: Pérez"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input
                    id="cedula"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    placeholder="Ej: 0123456789"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.fechaNacimiento && "text-muted-foreground"
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
                        captionLayout="dropdown-buttons"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ))}

            {/* STEP 2 */}
            {stepper.when("step-2", () => (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
              </div>
            ))}

            {/* STEP 3 - AQUÍ ESTÁ EL CAMBIO CLAVE */}
            {stepper.when("step-3", () => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  {loadingCatalogs ? (
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                  ) : (
                    // USAMOS EL COMPONENTE COMBOBOX - SIN ERRORES
                    <Combobox
                      options={paisesOptions}
                      value={formData.paisId?.toString() || ""}
                      onValueChange={handleCountryChange}
                      placeholder="Selecciona un país..."
                      searchPlaceholder="Buscar país..."
                      emptyPlaceholder="País no encontrado."
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    placeholder="Ej: Quito"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Ej: Av. Principal 123"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej: +593 99 123 4567"
                  />
                </div>
              </div>
            ))}

            {/* STEP 4 */}
            {stepper.when("step-4", () => (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="tipoSangre">Tipo de Sangre</Label>
                  <Select
                    onValueChange={handleBloodTypeChange}
                    value={formData.tipoSangreId?.toString() || ""}
                  >
                    <SelectTrigger>
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

            {/* Indicador de Paginación (Tu versión de puntos) */}
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
                onClick={handleOpenSummary} // Abrir Resumen
                disabled={isLoading}
                className="gap-2"
              >
                Finalizar Registro
              </Button>
            ) : (
              <Button onClick={() => stepper.next()} className="gap-2">
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* --- DIÁLOGO DE RESUMEN (Todos los campos menos password) --- */}
      <AlertDialog open={showSummary} onOpenChange={setShowSummary}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Revisa tu información</AlertDialogTitle>
            <AlertDialogDescription>
              Verifica que los datos sean correctos antes de crear tu cuenta.
              (Podrás editar cierta información después).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-4 py-4 text-sm border rounded-lg p-4 bg-muted/20 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {/* Información Personal */}
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

              {/* Cuenta */}
              <div className="font-semibold text-muted-foreground">Email:</div>
              <div className="break-all">{formData.email}</div>

              {/* Ubicación */}
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

              {/* Salud */}
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

      {/* --- DIÁLOGO DE ÉXITO --- */}
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
