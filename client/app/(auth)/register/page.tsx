import { RegisterForm } from "../../components/features/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    // El layout (auth)/layout.tsx ya se encarga de centrar esto.
    // Añadimos un contenedor flexible para el enlace de "Volver"
    <div className="flex flex-col gap-4 items-center">
      <RegisterForm />
      <div className="text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
}
