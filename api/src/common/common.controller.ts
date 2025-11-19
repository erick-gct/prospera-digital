import { Controller, Get } from '@nestjs/common';
import { CommonService } from './common.service';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('paises')
  findAllPaises() {
    return this.commonService.getPaises();
  }

  @Get('tipos-sangre')
  findAllTiposSangre() {
    return this.commonService.getTiposSangre();
  }
}
