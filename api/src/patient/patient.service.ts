import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FilterPatientDto } from './dto/filter-patient.dto'; // Importamos el nuevo DTO

@Injectable()
export class PatientService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  // 1. Listar pacientes CON FILTROS
  async findAll(filters?: FilterPatientDto) {
    // Iniciamos la consulta base
    let query = this.supabase
      .from('paciente')
      .select(`
        *,
        paises (nombre),
        tipos_sangre (nombre),
        estado_paciente (nombre)
      `)
      .order('apellidos', { ascending: true });

    // Aplicamos filtros si existen
    if (filters) {
      // Filtro por Cédula (búsqueda parcial 'ilike')
      if (filters.cedula) {
        query = query.ilike('cedula', `%${filters.cedula}%`);
      }

      // Filtro por Estado
      if (filters.estado && filters.estado !== 'todos') {
        // Asumimos: 1 = Activo, 2 = Inactivo (ajusta estos IDs según tu BD real)
        const estadoId = filters.estado === 'activo' ? 1 : 2;
        query = query.eq('estado_paciente_id', estadoId);
      }
    }

    const { data, error } = await query;

    if (error) throw new InternalServerErrorException(error.message);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }

  // 2. Buscar un paciente por ID (UUID)
  async findOne(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data, error } = await this.supabase
      .from('paciente')
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
      throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }

  // 3. Actualizar paciente (Sin tocar cédula)
  async update(id: string, updatePatientDto: UpdatePatientDto) {
    const updates = {
      nombres: updatePatientDto.nombres,
      apellidos: updatePatientDto.apellidos,
      fecha_nacimiento: updatePatientDto.fechaNacimiento,
      pais_id: updatePatientDto.paisId,
      ciudad: updatePatientDto.ciudad,
      direccion: updatePatientDto.direccion,
      telefono: updatePatientDto.telefono,
      tipo_sangre_id: updatePatientDto.tipoSangreId,
      enfermedades: updatePatientDto.enfermedades,
    };

    Object.keys(updates).forEach(
      (key) =>
        updates[key as keyof typeof updates] === undefined &&
        delete updates[key as keyof typeof updates],
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data, error } = await this.supabase
      .from('paciente')
      .update(updates)
      .eq('usuario_id', id)
      .select()
      .single();

    if (error)
      throw new InternalServerErrorException(
        `Error actualizando: ${error.message}`,
      );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }

  // 4. Eliminado Lógico (Cambiar estado a Inactivo)
  async remove(id: string) {
    const ESTADO_INACTIVO = 2;

    const { data, error } = await this.supabase
      .from('paciente')
      .update({ estado_paciente_id: ESTADO_INACTIVO })
      .eq('usuario_id', id)
      .select()
      .single();

    if (error)
      throw new InternalServerErrorException(
        `Error al eliminar (lógico): ${error.message}`,
      );

    return { message: 'Paciente desactivado correctamente', paciente: data };
  }
}
