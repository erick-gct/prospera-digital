"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ApiRoutes } from "@/lib/api-routes";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor ingresa tu correo electrónico.");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      const response = await fetch(ApiRoutes.auth.recoverPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al solicitar recuperación.");
      }

      setIsSuccess(true);
      toast.success("Correo enviado exitosamente.");
    } catch (error) {
      console.error("Error en recuperación:", error);
      toast.error("Error al enviar solicitud", {
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
    <>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-xl">¡Correo Enviado!</CardTitle>
            <CardDescription className="mt-2">
              Hemos enviado las instrucciones para restablecer tu contraseña a:
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Revisa tu bandeja de entrada (y la carpeta de spam si es necesario).
              El enlace expirará en 1 hora.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/login">
              <Button variant="outline">Volver al Inicio de Sesión</Button>
            </Link>
          </CardFooter>
        </Card>
      </>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePreSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar enlace de recuperación
            </Button>
            <div className="text-center text-sm">
               <Link href="/login" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Volver al login
               </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar envío?</AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará un correo con instrucciones de recuperación a la dirección:
              <br />
              <span className="font-bold text-foreground mt-2 block">{email}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend} disabled={isLoading}>
              {isLoading ? "Enviando..." : "Sí, enviar correo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
