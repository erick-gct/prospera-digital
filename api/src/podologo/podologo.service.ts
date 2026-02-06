import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UpdatePodologoDto } from './dto/update-podologo.dto';

@Injectable()
export class PodologoService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('podologo')
      .select('usuario_id, nombres, apellidos')
      .order('apellidos', { ascending: true });

    if (error)
      throw new InternalServerErrorException(
        `Error al obtener podólogos: ${error.message}`,
      );
    return data || [];
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('podologo')
      .select(
        `
        *,
        paises (nombre),
        tipos_sangre (nombre)
      `,
      )
      .eq('usuario_id', id)
      .single();

    if (error || !data)
      throw new NotFoundException(`Podólogo con ID ${id} no encontrado`);
    return data;
  }

  async update(id: string, updatePodologoDto: UpdatePodologoDto) {
    const updates = {
      nombres: updatePodologoDto.nombres,
      apellidos: updatePodologoDto.apellidos,
      cedula: updatePodologoDto.cedula,
      pais_id: updatePodologoDto.paisId,
      tipo_sangre_id: updatePodologoDto.tipoSangreId,
    } as any;

    if (updatePodologoDto.email) {
      updates.email = updatePodologoDto.email;
      // Actualizar en Supabase Auth
      const { error: authError } = await this.supabase.auth.admin.updateUserById(
        id,
        { email: updatePodologoDto.email, email_confirm: true }
      );
      if (authError) {
        console.error('Error updating podologo auth email:', authError);
      }
    }

    // Limpiar undefined
    Object.keys(updates).forEach(
      (key) =>
        updates[key as keyof typeof updates] === undefined &&
        delete updates[key as keyof typeof updates],
    );

    const { data, error } = await this.supabase
      .from('podologo')
      .update(updates)
      .eq('usuario_id', id)
      .select()
      .single();

    if (error)
      throw new InternalServerErrorException(
        `Error actualizando podólogo: ${error.message}`,
      );
    return data;
  }
}
