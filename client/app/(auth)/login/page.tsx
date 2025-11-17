// En: client/app/(auth)/login/page.tsx
'use client'; // Marcamos como Client Component para manejar el estado del formulario

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría tu lógica de inicio de sesión
    console.log({ email, password });
  };

  return (
    <Card className="w-full max-w-md ">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          ¡Bienvenido de vuelta!
        </CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="paciente@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 py-6">
          <Button type="submit" className="w-full">
            Iniciar Sesión
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <Link
              href="/register"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Regístrate aquí
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}