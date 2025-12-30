import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  ParseFilePipe, 
  MaxFileSizeValidator, 
  FileTypeValidator 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre del campo en el form-data
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // Máximo 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }), // Tipos permitidos
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // Por defecto lo guardamos en la carpeta 'general', 
    // pero podrías recibir la carpeta por Body si quisieras.
    return this.storageService.uploadFile(file, 'general');
  }
}