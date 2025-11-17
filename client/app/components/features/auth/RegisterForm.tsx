"use client";

import React, { useState } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// --- Definición de pasos con Stepperize ---
const { useStepper } = defineStepper(
  { id: "step-1", title: "Información Personal" },
  { id: "step-2", title: "Cuenta" },
  { id: "step-3", title: "Ubicación" },
  { id: "step-4", title: "Salud" }
);

// --- Lista de países para el Combobox ---
const countries = [
  { value: "ec", label: "Ecuador" },
  { value: "co", label: "Colombia" },
  { value: "pe", label: "Perú" },
  { value: "ar", label: "Argentina" },
  { value: "cl", label: "Chile" },
  { value: "mx", label: "México" },
  { value: "es", label: "España" },
  { value: "us", label: "Estados Unidos" },
  { value: "br", label: "Brasil" },
  { value: "uy", label: "Uruguay" },
];

export function RegisterForm() {
  const stepper = useStepper();
  const [isLoading, setIsLoading] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);

  // --- Estado del formulario ---
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    fechaNacimiento: undefined as Date | undefined,
    email: "",
    password: "",
    pais: "",
    ciudad: "",
    direccion: "",
    telefono: "",
    tipoSangre: "",
    enfermedades: "",
  });

  // Calcular índice actual y progreso
  const currentStepIndex = stepper.all.findIndex(
    (step) => step.id === stepper.current?.id
  );
  const hasPrevStep = currentStepIndex > 0;
  const isLastStep = currentStepIndex === stepper.all.length - 1;
  const progressValue = ((currentStepIndex + 1) / stepper.all.length) * 100;

  // --- Manejadores ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, fechaNacimiento: date }));
  };

  const handleBloodTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tipoSangre: value }));
  };

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, pais: value }));
    setOpenCountry(false);
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    console.log("Enviando formulario:", formData);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
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

        {/* Stepper Personalizado con líneas conectoras */}
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
                      captionLayout="dropdown"
                      fromYear={1930}
                      toYear={new Date().getFullYear()}
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
                <Popover open={openCountry} onOpenChange={setOpenCountry}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCountry}
                      className="w-full justify-between"
                    >
                      {formData.pais
                        ? countries.find(
                            (country) => country.value === formData.pais
                          )?.label
                        : "Selecciona un país..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar país..." />
                      <CommandList>
                        <CommandEmpty>No se encontró el país.</CommandEmpty>
                        <CommandGroup>
                          {countries.map((country) => (
                            <CommandItem
                              key={country.value}
                              value={country.value}
                              onSelect={() =>
                                handleCountryChange(country.value)
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.pais === country.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {country.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  value={formData.tipoSangre}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu tipo de sangre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
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
