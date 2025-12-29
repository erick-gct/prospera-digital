import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

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
}