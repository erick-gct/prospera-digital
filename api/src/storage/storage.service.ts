import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucketName = 'prospera-digital'; // Tu bucket

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads') {
    // 1. Generar nombre único para evitar colisiones
    // Ej: avatars/123456789-mi-foto.png
    const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;

    // 2. Subir a Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Error subiendo archivo:', error);
      throw new InternalServerErrorException(
        `No se pudo subir el archivo: ${error.message}`,
      );
    }

    // 3. Obtener URL Pública
    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: publicUrlData.publicUrl, // Esta es la que guardaremos en la BD
    };
  }
}
