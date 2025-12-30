import { Controller, Get, Query, Param } from '@nestjs/common';
import { HistorialService } from './historial.service';

@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) { }

  @Get('search')
  searchPatients(
    @Query('cedula') cedula: string,
    @Query('apellido') apellido: string,
  ) {
    return this.historialService.searchPatients(cedula || '', apellido || '');
  }

  @Get('patient/:id')
  getPatientHistory(@Param('id') id: string) {
    return this.historialService.getPatientHistory(id);
  }

  @Get('appointment/:id')
  getAppointmentDetail(@Param('id') id: string) {
    return this.historialService.getAppointmentFullDetail(parseInt(id, 10));
  }
}
