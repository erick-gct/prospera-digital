import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';

@Global() // <--- ¡IMPORTANTE! Esto hace que no tengas que importar el módulo en cada sitio
@Module({
  imports: [ConfigModule],
  providers: [MailService],
  exports: [MailService], // Exportamos el servicio para que otros lo usen
})
export class MailModule {}
