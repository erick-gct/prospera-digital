import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreatePodologoDto } from './dto/create-podologo.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // =====================================================
  // GESTIÓN DE USUARIOS
  // =====================================================

  /**
   * GET /admin/usuarios
   * Obtener todos los usuarios (pacientes y podólogos)
   */
  @Get('usuarios')
  findAllUsers(
    @Query('tipo') tipo?: 'paciente' | 'podologo' | 'todos',
    @Query('cedula') cedula?: string,
    @Query('apellido') apellido?: string,
    @Query('estado') estado?: string,
  ) {
    return this.adminService.findAllUsers({ tipo, cedula, apellido, estado });
  }

  /**
   * GET /admin/usuarios/:id
   * Obtener detalle de un usuario
   */
  @Get('usuarios/:id')
  findUserById(@Param('id') id: string) {
    return this.adminService.findUserById(id);
  }

  /**
   * PATCH /admin/usuarios/:id/desactivar
   * Desactivar un usuario
   */
  @Patch('usuarios/:id/desactivar')
  deactivateUser(@Param('id') id: string) {
    return this.adminService.deactivateUser(id);
  }

  /**
   * PATCH /admin/usuarios/:id/reactivar
   * Reactivar un usuario
   */
  @Patch('usuarios/:id/reactivar')
  reactivateUser(@Param('id') id: string) {
    return this.adminService.reactivateUser(id);
  }

  // =====================================================
  // GESTIÓN DE CITAS GLOBALES
  // =====================================================

  /**
   * GET /admin/citas
   * Obtener todas las citas del sistema
   */
  @Get('citas')
  findAllAppointments(
    @Query('estado') estado?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('podologoId') podologoId?: string,
  ) {
    return this.adminService.findAllAppointments({
      estado,
      fechaInicio,
      fechaFin,
      podologoId,
    });
  }

  /**
   * GET /admin/stats
   * Obtener estadísticas del sistema
   */
  @Get('stats')
  getStats() {
    return this.adminService.getAdminStats();
  }

  /**
   * GET /admin/podologos-list
   * Obtener lista de podólogos para filtros
   */
  @Get('podologos-list')
  getPodologosList() {
    return this.adminService.getPodologosList();
  }

  // =====================================================
  // CREACIÓN DE PODÓLOGOS
  // =====================================================

  /**
   * POST /admin/podologos
   * Crear un nuevo podólogo
   */
  @Post('podologos')
  createPodologo(@Body() createPodologoDto: CreatePodologoDto) {
    return this.adminService.createPodologo(createPodologoDto);
  }

  // =====================================================
  // AUDITORÍA (Sin verificación de contraseña)
  // =====================================================

  /**
   * GET /admin/auditoria/logs
   * Obtener logs de auditoría directamente
   */
  @Get('auditoria/logs')
  getAuditLogs(@Query('table') table?: string, @Query('limit') limit?: string) {
    return this.adminService.getAuditLogs(
      table,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  /**
   * GET /admin/auditoria/login-history
   * Obtener historial de accesos directamente
   */
  @Get('auditoria/login-history')
  getLoginHistory(@Query('limit') limit?: string) {
    return this.adminService.getLoginHistory(limit ? parseInt(limit, 10) : 100);
  }

  /**
   * GET /admin/auditoria/tables
   * Obtener tablas disponibles para filtrar
   */
  @Get('auditoria/tables')
  getAvailableTables() {
    return this.adminService.getAvailableTables();
  }

  // =====================================================
  // GESTIÓN DE DOCUMENTOS
  // =====================================================

  /**
   * GET /admin/documentos
   * Obtener documentos agrupados por paciente
   */
  @Get('documentos')
  getDocumentsByPatient(
    @Query('pacienteId') pacienteId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getDocumentsByPatient({
      pacienteId,
      search,
      startDate,
      endDate,
    });
  }

  /**
   * GET /admin/documentos/stats
   * Obtener estadísticas de documentos
   */
  @Get('documentos/stats')
  getDocumentStats() {
    return this.adminService.getDocumentStats();
  }
}
