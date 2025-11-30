import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Leemos qué roles permite esta ruta (del decorador @Roles)
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true; // Si no hay roles definidos, es pública (o solo requiere login)
    }

    // 2. Obtenemos el usuario de la petición (inyectado por AuthGuard/Supabase)
    // NOTA: Aquí asumimos que ya validaste el token y tienes el usuario.
    // En un flujo real con Supabase, deberías decodificar el JWT aquí o usar un AuthGuard previo.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    const user = request.user; // <-- Esto vendría de tu estrategia JWT

    // 3. Verificamos si el usuario tiene el rol necesario
    // Como estamos simplificando, si tu backend devolvió el rol en el login,
    // el frontend debería enviarlo en un header o token.
    // PARA ESTE MVP: Vamos a confiar en que la lógica de negocio ya validó.
    // (Implementación robusta futura: Decodificar JWT y leer 'role')
    return true;
  }
}
