import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { PatientModule } from './patient/patient.module';
import { PodologoModule } from './podologo/podologo.module';
import { AppointmentModule } from './appointment/appointment.module';
import { StorageModule } from './storage/storage.module';
import { HistorialModule } from './historial/historial.module';
import { RecetaModule } from './receta/receta.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    CommonModule,
    PatientModule,
    PodologoModule,
    MailModule,
    AppointmentModule,
    StorageModule,
    HistorialModule,
    RecetaModule,
    DashboardModule,
    AuditModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
