import { Controller, Get, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PatientService } from './patient.service';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FilterPatientDto } from './dto/filter-patient.dto'; // Importamos el DTO

@Controller('pacientes')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get() // GET /pacientes?cedula=123&estado=activo
  findAll(@Query() filterDto: FilterPatientDto) {
    return this.patientService.findAll(filterDto);
  }

  // ... (resto de endpoints igual) ...
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientService.update(id, updatePatientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientService.remove(id);
  }
}