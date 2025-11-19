import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config'; // Importamos ConfigModule

@Module({
  imports: [ConfigModule], // Importamos ConfigModule para que el Servicio pueda leer el .env
  controllers: [AuthController], // Le dice a NestJS que este módulo tiene Controladores
  providers: [AuthService], // Le dice a NestJS que este módulo tiene Servicios (la lógica)
})
export class AuthModule {}
