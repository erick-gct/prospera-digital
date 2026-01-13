import { Module } from '@nestjs/common';
import { PodologoService } from './podologo.service';
import { PodologoController } from './podologo.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [PodologoController],
  providers: [PodologoService],
})
export class PodologoModule {}
