import { Controller, Get, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('patient/:userId')
  getPatientDashboard(@Param('userId') userId: string) {
    return this.dashboardService.getPatientDashboard(userId);
  }

  @Get('podologo/:userId')
  getPodologoDashboard(
    @Param('userId') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.dashboardService.getPodologoDashboard(
      userId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }
}
