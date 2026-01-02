import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // Recibe los datos, los valida contra el DTO y llama al servicio
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.authService.register(registerDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { userId: string; email: string }) {
    return this.authService.logLogout(body.userId, body.email);
  }
}
