import { IsString, IsIn } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsString()
  @IsIn(['day', 'week'])
  type: 'day' | 'week';
}
