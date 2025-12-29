import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '../mail/mail.module'; // Importante para enviar correos

@Module({
  imports: [ConfigModule, MailModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}