import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ConfigModule, MailModule], // Importamos ConfigModule y MailModule
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
