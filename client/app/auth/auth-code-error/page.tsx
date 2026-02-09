"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center border-red-200">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-xl text-red-700">Link Inválido o Expirado</CardTitle>
          <CardDescription className="mt-2 text-red-600/80">
            No pudimos verificar tu solicitud de recuperación.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground bg-red-50/50 p-4 rounded-md mx-6 mb-4">
          <p className="font-medium mb-1">Detalles del error:</p>
          <p>{errorDescription?.replaceAll("+", " ") || "El enlace ya ha sido usado o ha expirado."}</p>
          {errorCode && <p className="text-xs mt-1 text-muted-foreground/80">Código: {errorCode}</p>}
        </CardContent>
        <CardFooter className="flex justify-center flex-col gap-3">
          <Link href="/forgot-password">
            <Button className="w-full">Generar nuevo enlace</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="w-full">
               <ArrowLeft className="mr-2 h-4 w-4" /> Ir al Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
