import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDetailDto } from './dto/update-appointment-detail.dto';
import { StorageService } from '../storage/storage.service';

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly storageService: StorageService,
  ) { }

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  findByPodologo(
    @Query('podologoId') podologoId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentService.findByPodologo(
      podologoId,
      startDate,
      endDate,
    );
  }

  @Get('by-date')
  findByDate(
    @Query('date') date: string,
    @Query('podologoId') podologoId?: string,
  ) {
    return this.appointmentService.findByDate(date, podologoId);
  }

  @Get(':id/detail')
  getDetail(@Param('id') id: string) {
    return this.appointmentService.getAppointmentDetail(parseInt(id, 10));
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.appointmentService.getTimeline(parseInt(id, 10));
  }

  @Patch(':id/detail')
  updateDetail(
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentDetailDto,
  ) {
    return this.appointmentService.updateAppointmentDetail(
      parseInt(id, 10),
      updateDto,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('estadoId') estadoId: number,
    @Body('userId') userId?: string,
  ) {
    return this.appointmentService.updateStatus(parseInt(id, 10), estadoId, userId);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body('nuevaFechaHora') nuevaFechaHora: string,
    @Body('userId') userId?: string, // Para verificar rol (opcional por ahora, idealmente via Guard)
  ) {
    return this.appointmentService.reschedule(parseInt(id, 10), nuevaFechaHora, userId);
  }

  // ================== DOCUMENTOS ==================

  @Get(':id/documents')
  getDocuments(@Param('id') id: string) {
    return this.appointmentService.getDocuments(parseInt(id, 10));
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB max
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf|gif|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // 1. Subir archivo a Supabase Storage
    const uploadResult = await this.storageService.uploadFile(
      file,
      `citas/${id}`,
    );

    // 2. Guardar referencia en documentos_clinicos
    return this.appointmentService.uploadDocument(parseInt(id, 10), {
      path: uploadResult.path,
      url: uploadResult.url,
      nombre: file.originalname,
      tipo: file.mimetype,
    });
  }

  @Delete('documents/:documentId')
  deleteDocument(@Param('documentId') documentId: string) {
    return this.appointmentService.deleteDocument(parseInt(documentId, 10));
  }
}
