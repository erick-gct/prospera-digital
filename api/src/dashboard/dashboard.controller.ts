import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('patient/:userId')
  getPatientDashboard(@Param('userId') userId: string) {
    return this.dashboardService.getPatientDashboard(userId);
  }
}
