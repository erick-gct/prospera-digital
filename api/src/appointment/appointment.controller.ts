import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDetailDto } from './dto/update-appointment-detail.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) { }

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  findByPodologo(
    @Query('podologoId') podologoId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentService.findByPodologo(podologoId, startDate, endDate);
  }

  @Get('by-date')
  findByDate(
    @Query('podologoId') podologoId: string,
    @Query('date') date: string, // Formato: YYYY-MM-DD
  ) {
    return this.appointmentService.findByDate(podologoId, date);
  }

  @Get(':id/detail')
  getDetail(@Param('id') id: string) {
    return this.appointmentService.getAppointmentDetail(parseInt(id, 10));
  }
  @Patch(':id/detail')
  updateDetail(
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentDetailDto,
  ) {
    return this.appointmentService.updateAppointmentDetail(parseInt(id, 10), updateDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('estadoId') estadoId: number,
  ) {
    return this.appointmentService.updateStatus(parseInt(id, 10), estadoId);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body('nuevaFechaHora') nuevaFechaHora: string,
  ) {
    return this.appointmentService.reschedule(parseInt(id, 10), nuevaFechaHora);
  }
}