import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Post('citas-pdf')
  async generateCitasPdf(@Body() dto: GenerateReportDto, @Res() res: Response) {
    const buffer = await this.reportsService.generateCitasPdf(dto.startDate, dto.endDate, dto.type);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=reporte-citas-${dto.type}-${dto.startDate}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
