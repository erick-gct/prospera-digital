import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [ConfigModule, MailModule, StorageModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule { }