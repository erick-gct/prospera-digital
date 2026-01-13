import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CommonService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  async getPaises() {
    const { data, error } = await this.supabase
      .from('paises')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo paises:', error);
      throw new InternalServerErrorException(error.message);
    }
    // CAMBIO CLAVE: Si data es null, devolvemos array vacío []
    return data || [];
  }

  async getTiposSangre() {
    const { data, error } = await this.supabase
      .from('tipos_sangre')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo tipos de sangre:', error);
      throw new InternalServerErrorException(error.message);
    }
    // CAMBIO CLAVE: Si data es null, devolvemos array vacío []
    return data || [];
  }
}
