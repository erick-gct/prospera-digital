import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { PodologoService } from './podologo.service';
import { UpdatePodologoDto } from './dto/update-podologo.dto';

@Controller('podologos')
export class PodologoController {
  constructor(private readonly podologoService: PodologoService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.podologoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePodologoDto: UpdatePodologoDto) {
    return this.podologoService.update(id, updatePodologoDto);
  }
}