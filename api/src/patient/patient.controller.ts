import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FilterPatientDto } from './dto/filter-patient.dto'; // Importamos el DTO
// Nota: Asumimos que tendrás un AuthGuard que inyecta el 'user' en el request
// import { AuthGuard } from '../auth/guards/auth.guard';
@Controller('pacientes')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  // ==========================================
  // RUTAS PARA EL PROPIO PACIENTE (Mi Perfil)
  // ==========================================

  @Get('perfil') // GET /pacientes/perfil
  getProfile(@Request() req: any) {
    // 1. Obtenemos el ID del usuario logueado desde el token/sesión
    // (Esto requiere que tu AuthGuard haya puesto el usuario en req.user)
    // Por ahora, para probar, supongamos que el ID viene en un header o lo simulamos.
    // En producción: const userId = req.user.id;
    
    // Ejemplo simulado si no tienes el Guard aún configurado para inyectar user:
    // return this.patientService.findOne("ID_DEL_PACIENTE_LOGUEADO");
    
    // Si ya tienes el guard:
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req.user?.id;
    return this.patientService.findOne(userId);
  }

  @Patch('perfil') // PATCH /pacientes/perfil
  updateProfile(
    @Request() req: any,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req.user?.id;
    // ¡REUTILIZAMOS TU SERVICIO!
    return this.patientService.update(userId, updatePatientDto);
  }

  // ==========================================
  // RUTAS PARA EL PODÓLOGO (Gestión)
  // ==========================================

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

  @Patch(':id/reactivate') // PATCH /pacientes/UUID/reactivate
  reactivate(@Param('id') id: string) {
    return this.patientService.reactivate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientService.remove(id);
  }
}
