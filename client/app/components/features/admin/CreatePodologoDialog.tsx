"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ApiRoutes } from "@/lib/api-routes";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";

interface CreatePodologoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono?: string;
  fecha_nacimiento?: string;
  pais_id?: string;
  tipo_sangre_id?: string;
}

interface Pais {
  id: number;
  nombre: string;
}

interface TipoSangre {
  id: number;
  nombre: string;
}

export function CreatePodologoDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePodologoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [tiposSangre, setTiposSangre] = useState<TipoSangre[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      nombres: "",
      apellidos: "",
      cedula: "",
      email: "",
      password: "",
      confirmPassword: "",
      telefono: "",
      fecha_nacimiento: "",
      pais_id: "",
      tipo_sangre_id: "",
    },
  });

  const password = watch("password");

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [paisesRes, tiposSangreRes] = await Promise.all([
          fetch(ApiRoutes.common.paises),
          fetch(ApiRoutes.common.tiposSangre),
        ]);

        if (paisesRes.ok) {
          const paisesData = await paisesRes.json();
          setPaises(paisesData);
        }

        if (tiposSangreRes.ok) {
          const tiposData = await tiposSangreRes.json();
          setTiposSangre(tiposData);
        }
      } catch (error) {
        console.error("Error loading catalogs:", error);
      }
    };

    if (open) {
      loadCatalogs();
    }
  }, [open]);

  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(ApiRoutes.admin.createPodologo, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres: data.nombres,
          apellidos: data.apellidos,
          cedula: data.cedula,
          email: data.email,
          password: data.password,
          telefono: data.telefono || undefined,
          fecha_nacimiento: data.fecha_nacimiento || undefined,
          pais_id: data.pais_id ? parseInt(data.pais_id) : undefined,
          tipo_sangre_id: data.tipo_sangre_id
            ? parseInt(data.tipo_sangre_id)
            : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al crear el podólogo");
      }

      toast.success(
        `Podólogo ${data.nombres} ${data.apellidos} creado exitosamente`
      );

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear el podólogo"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Crear Nuevo Podólogo
          </DialogTitle>
          <DialogDescription>
            Complete los datos para registrar un nuevo podólogo en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Información Personal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                placeholder="Ingrese nombres"
                {...register("nombres", {
                  required: "Los nombres son obligatorios",
                })}
                className={errors.nombres ? "border-red-500" : ""}
              />
              {errors.nombres && (
                <p className="text-xs text-red-500">{errors.nombres.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                placeholder="Ingrese apellidos"
                {...register("apellidos", {
                  required: "Los apellidos son obligatorios",
                })}
                className={errors.apellidos ? "border-red-500" : ""}
              />
              {errors.apellidos && (
                <p className="text-xs text-red-500">
                  {errors.apellidos.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cedula">Cédula *</Label>
              <Input
                id="cedula"
                placeholder="Ej: 1234567890"
                {...register("cedula", {
                  required: "La cédula es obligatoria",
                  minLength: { value: 6, message: "Mínimo 6 caracteres" },
                })}
                className={errors.cedula ? "border-red-500" : ""}
              />
              {errors.cedula && (
                <p className="text-xs text-red-500">{errors.cedula.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                placeholder="Ej: 0999999999"
                {...register("telefono")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register("email", {
                required: "El email es obligatorio",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email inválido",
                },
              })}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password", {
                    required: "La contraseña es obligatoria",
                    minLength: { value: 6, message: "Mínimo 6 caracteres" },
                  })}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword", {
                    required: "Confirme la contraseña",
                    validate: (value) =>
                      value === password || "Las contraseñas no coinciden",
                  })}
                  className={
                    errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"
                  }
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Datos Adicionales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                {...register("fecha_nacimiento")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pais_id">País</Label>
              <Select onValueChange={(value) => setValue("pais_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {paises.map((pais) => (
                    <SelectItem key={pais.id} value={pais.id.toString()}>
                      {pais.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tipo_sangre_id">Tipo de Sangre</Label>
            <Select
              onValueChange={(value) => setValue("tipo_sangre_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {tiposSangre.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Podólogo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
