import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RecetaService } from './receta.service';

@Controller('recetas')
export class RecetaController {
  constructor(private readonly recetaService: RecetaService) {}

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: any) {
    const pdfBuffer = await this.recetaService.generateRecetaPdf(
      parseInt(id, 10),
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=receta-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
