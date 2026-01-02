import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  /**
   * Verificar contraseña del usuario
   */
  @Post('verify-password')
  verifyPassword(@Body() body: { email: string; password: string }) {
    return this.auditService.verifyPassword(body.email, body.password);
  }

  /**
   * Obtener logs de auditoría filtrados por tabla
   */
  @Get('logs')
  getAuditLogs(
    @Query('table') table?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getAuditLogs(
      table,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  /**
   * Obtener historial de accesos (login/logout)
   */
  @Get('login-history')
  getLoginHistory(@Query('limit') limit?: string) {
    return this.auditService.getLoginHistory(limit ? parseInt(limit, 10) : 50);
  }

  /**
   * Obtener tablas disponibles para auditar
   */
  @Get('tables')
  getAvailableTables() {
    return this.auditService.getAvailableTables();
  }
}
