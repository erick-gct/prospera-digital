import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto'; 

@Controller('auth') // Esto crea la ruta base: http://localhost:3001/auth
export class AuthController {
  constructor(private authService: AuthService) {}

  // Esto crea la ruta final: POST http://localhost:3001/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK) // Por defecto un POST devuelve 201, lo cambiamos a 200 (OK)
  signIn(@Body() signInDto: Record<string, any>) {
    // 1. Recibe el JSON del frontend (que tendrá 'email' y 'password')
    // (NOTA: 'Record<string, any>' es temporal, luego lo haremos más estricto)
    // 2. Llama al 'AuthService' (el cerebro) para hacer el trabajo
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

   // --- ¡ESTO ES LO QUE FALTABA! ---
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // Recibe los datos, los valida contra el DTO y llama al servicio
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.authService.register(registerDto);
  }
}
