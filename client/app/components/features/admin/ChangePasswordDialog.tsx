import { useState } from "react";
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
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ApiRoutes } from "@/lib/api-routes";
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

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string | null; // Para mostrar a quién se le cambia
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: ChangePasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isLengthValid = password.length >= 6;

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch || !isLengthValid) {
      toast.error("Las contraseñas no coinciden o son muy cortas", {
        description: "Asegurate de que ambas tengan al menos 6 caracteres y sean iguales.",
      });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmChange = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const res = await fetch(ApiRoutes.admin.usuarios.changePassword(userId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        throw new Error("Error al cambiar contraseña");
      }

      toast.success("Contraseña actualizada exitosamente", {
        description: `La contraseña para ${userName} ha sido modificada.`,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar contraseña", {
        description: "Ocurrió un problema al intentar actualizar la contraseña.",
      });
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setShowConfirm(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Cambiar Contraseña
            </DialogTitle>
            <DialogDescription>
              Ingresa la nueva contraseña para el usuario <strong>{userName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInitialSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={
                    confirmPassword && !passwordsMatch ? "border-red-500 focus-visible:ring-red-500" : ""
                }
                required
              />
              {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Las contraseñas no coinciden
                  </p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!passwordsMatch || !isLengthValid || isLoading}
              >
                Cambiar Contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alerta de Confirmación */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cambiar la contraseña de <strong>{userName}</strong>. 
              El usuario deberá usar esta nueva contraseña para acceder al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleConfirmChange} 
                className="bg-primary hover:bg-primary/90"
                disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                </>
              ) : (
                "Confirmar Cambio"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
