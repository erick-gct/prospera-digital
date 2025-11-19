/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useRouter } from "next/navigation";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { toast } from "sonner";
// Asegúrate de que este import coincida con el nombre real de tu archivo (cliente.ts o client.ts)
import { createClient } from "@/lib/supabase/cliente";

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

  // --- ESTADO LOCAL ---
  // 1. AQUÍ AGREGAMOS EL ESTADO DE CARGA QUE FALTABA
  const [isLoading, setIsLoading] = useState(false);

  const [paisesOptions, setPaisesOptions] = useState<ComboboxOption[]>([]);
  const [tiposSangreOptions, setTiposSangreOptions] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Estado del formulario
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
        // 1. Petición de Países
        const resPaises = await fetch("http://localhost:3001/common/paises");
        if (!resPaises.ok) throw new Error("Error cargando países");
        const dataPaises = await resPaises.json();

        if (Array.isArray(dataPaises)) {
          const paisesMapeados = dataPaises.map((p: any) => ({
            value: p.id.toString(),
            label: p.nombre,
          }));
          setPaisesOptions(paisesMapeados);
        } else {
          setPaisesOptions([]);
        }

        // 2. Petición de Tipos de Sangre
        const resSangre = await fetch(
          "http://localhost:3001/common/tipos-sangre"
        );
        if (!resSangre.ok) throw new Error("Error cargando tipos de sangre");
        const dataSangre = await resSangre.json();

        if (Array.isArray(dataSangre)) {
          setTiposSangreOptions(dataSangre);
        } else {
          setTiposSangreOptions([]);
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

  // Calcular índice actual y progreso
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

  // --- SUBMIT ---
  const handleFinalSubmit = async () => {
    // 2. USAMOS EL SETTER LOCAL, NO EL DEL STEPPER
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

      toast.success("¡Cuenta creada exitosamente!");

      if (data.session) {
        const { error: sessionError } = await supabase.auth.setSession(
          data.session
        );
        if (!sessionError) {
          router.push("/dashboard");
          return;
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      toast.error("Error al crear la cuenta", {
        description: (error as Error).message,
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    } finally {
      // 3. USAMOS EL SETTER LOCAL
      setIsLoading(false);
    }
  };

  return (
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
                  {/* Línea conectora */}
                  {index < stepper.all.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-1/2 top-5 h-0.5 w-full -z-10",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}

                  {/* Círculo del step */}
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

                  {/* Título del step */}
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

        {/* Contenido del Formulario */}
        <form className="space-y-4">
          {/* STEP 1: Información Personal */}
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
                        format(formData.fechaNacimiento, "PPP", { locale: es })
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

          {/* STEP 2: Cuenta */}
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

          {/* STEP 3: Ubicación */}
          {stepper.when("step-3", () => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                {loadingCatalogs ? (
                  <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                ) : (
                  <Combobox
                    options={paisesOptions}
                    value={formData.paisId?.toString() || ""}
                    onValueChange={handleCountryChange}
                    placeholder="Selecciona un país..."
                    searchPlaceholder="Buscar país..."
                    emptyPlaceholder="No se encontró el país."
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

          {/* STEP 4: Salud */}
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
        {/* Botones de navegación */}
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

          {/* Indicador de paginación en el centro */}
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
              onClick={handleFinalSubmit}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
  );
}
