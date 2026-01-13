import { Module } from '@nestjs/common';
import { RecetaController } from './receta.controller';
import { RecetaService } from './receta.service';

@Module({
  controllers: [RecetaController],
  providers: [RecetaService],
  exports: [RecetaService],
})
export class RecetaModule {}
