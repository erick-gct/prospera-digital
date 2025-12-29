import { Controller, Post, Body } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments') // Ruta base: http://localhost:3001/appointments
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.create(createAppointmentDto);
  }
}