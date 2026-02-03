import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class HistorialService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  /**
   * Buscar pacientes por cédula y/o apellido (búsqueda parcial)
   */
  async searchPatients(cedula: string, apellido: string) {
    let query = this.supabase
      .from('paciente')
      .select(
        `
        usuario_id,
        cedula,
        nombres,
        apellidos,
        telefono,
        email,
        fecha_nacimiento
      `,
      )
      .eq('estado_paciente_id', 1); // 1 = Activo

    // Aplicar filtros si tienen valor
    if (cedula && cedula.length >= 2) {
      query = query.ilike('cedula', `%${cedula}%`);
    }
    if (apellido && apellido.length >= 2) {
      query = query.ilike('apellidos', `%${apellido}%`);
    }

    // Si no hay ningún filtro con al menos 2 caracteres, retornar vacío
    if ((!cedula || cedula.length < 2) && (!apellido || apellido.length < 2)) {
      return [];
    }

    const { data, error } = await query.limit(10);

    if (error) {
      throw new InternalServerErrorException(
        `Error buscando pacientes: ${error.message}`,
      );
    }

    // Obtener conteo de citas para cada paciente
    const patientsWithCounts = await Promise.all(
      (data || []).map(async (patient) => {
        const { count } = await this.supabase
          .from('cita')
          .select('id', { count: 'exact', head: true })
          .eq('paciente_id', patient.usuario_id);

        return {
          ...patient,
          total_citas: count || 0,
        };
      }),
    );

    return patientsWithCounts;
  }

  /**
   * Obtener historial de citas de un paciente
   * @param months - Opcional: filtrar citas de los últimos X meses hacia adelante
   * @param estadoId - Opcional: filtrar por estado (1=Reservada, 2=Completada)
   */
  async getPatientHistory(
    pacienteId: string,
    months?: number,
    estadoId?: number,
  ) {
    let query = this.supabase
      .from('cita')
      .select(
        `
        id,
        fecha_hora_inicio,
        motivo_cita,
        estado_id,
        observaciones_podologo,
        procedimientos_realizados,
        estado_cita (
          id,
          nombre
        )
      `,
      )
      .eq('paciente_id', pacienteId);

    // Filtrar por fecha si se especifica months
    if (months && months > 0) {
      const fechaLimite = new Date();
      fechaLimite.setMonth(fechaLimite.getMonth() - months);
      query = query.gte('fecha_hora_inicio', fechaLimite.toISOString());
    }

    // Filtrar por estado si se especifica
    if (estadoId && [1, 2, 3].includes(estadoId)) {
      query = query.eq('estado_id', estadoId);
    }

    const { data, error } = await query.order('fecha_hora_inicio', {
      ascending: false,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Error obteniendo historial: ${error.message}`,
      );
    }

    // Para cada cita, obtener si tiene documentos y recetas
    const citasWithExtras = await Promise.all(
      (data || []).map(async (cita) => {
        // Contar documentos
        const { count: docsCount } = await this.supabase
          .from('documentos_clinicos')
          .select('id', { count: 'exact', head: true })
          .eq('cita_id', cita.id);

        // Contar recetas
        const { count: recetasCount } = await this.supabase
          .from('receta')
          .select('id', { count: 'exact', head: true })
          .eq('cita_id', cita.id);

        return {
          ...cita,
          tiene_documentos: (docsCount || 0) > 0,
          tiene_recetas: (recetasCount || 0) > 0,
          documentos_count: docsCount || 0,
          recetas_count: recetasCount || 0,
        };
      }),
    );

    return citasWithExtras;
  }

  /**
   * Obtener detalle completo de una cita para el modal
   */
  async getAppointmentFullDetail(citaId: number) {
    // Cita base
    const { data: cita, error: citaError } = await this.supabase
      .from('cita')
      .select(
        `
        id,
        fecha_hora_inicio,
        motivo_cita,
        observaciones_paciente,
        observaciones_podologo,
        procedimientos_realizados,
        estado_id,
        podologo_id, 
        estado_cita (id, nombre)
      `,
      )
      .eq('id', citaId)
      .single();

    if (citaError) {
      console.error('Error fetching cita:', citaError);
      throw new InternalServerErrorException(
        `Error obteniendo cita: ${citaError.message}`,
      );
    }

    if (!cita) {
      throw new InternalServerErrorException('Cita no encontrada');
    }

    // Obtener datos del paciente por separado
    const { data: citaConPaciente } = await this.supabase
      .from('cita')
      .select('paciente_id')
      .eq('id', citaId)
      .single();

    let paciente: any = null;
    if (citaConPaciente?.paciente_id) {
      const { data: pacienteData } = await this.supabase
        .from('paciente')
        .select('usuario_id, nombres, apellidos, cedula')
        .eq('usuario_id', citaConPaciente.paciente_id)
        .single();
      paciente = pacienteData;
    }

    // Evaluación
    const { data: evaluacion, error: evalError } = await this.supabase
      .from('ficha_evaluacion')
      .select('*')
      .eq('cita_id', citaId)
      .maybeSingle();

    if (evalError) console.error('Error evaluacion:', evalError);

    // Ortesis
    const { data: ortesis, error: ortError } = await this.supabase
      .from('gestion_ortesis')
      .select('*')
      .eq('cita_id', citaId)
      .maybeSingle();

    if (ortError) console.error('Error ortesis:', ortError);

    // Recetas
    const { data: recetas, error: recError } = await this.supabase
      .from('receta')
      .select('id, fecha_emision, diagnostico_receta')
      .eq('cita_id', citaId)
      .order('fecha_creacion', { ascending: false });

    if (recError) console.error('Error recetas:', recError);

    // Para cada receta, obtener sus detalles
    const recetasConDetalles: any[] = [];
    if (recetas && recetas.length > 0) {
      for (const receta of recetas) {
        const { data: detalles } = await this.supabase
          .from('detalles_receta')
          .select('id, medicamento, dosis, indicaciones')
          .eq('receta_id', receta.id);

        recetasConDetalles.push({
          id: receta.id,
          fecha_emision: receta.fecha_emision,
          diagnostico_receta: receta.diagnostico_receta,
          medicamentos: detalles || [],
        });
      }
    }

    // Documentos
    const { data: documentos } = await this.supabase
      .from('documentos_clinicos')
      .select(
        'id, url_almacenamiento, nombre_archivo, tipo_archivo, fecha_subida',
      )
      .eq('cita_id', citaId)
      .order('fecha_subida', { ascending: false });

    // Podólogo
    let podologo: any = null;
    if (cita.podologo_id) {
      const { data: podologoData } = await this.supabase
        .from('podologo')
        .select('usuario_id, nombres, apellidos')
        .eq('usuario_id', cita.podologo_id)
        .single();
      podologo = podologoData;
    }

    return {
      cita: { ...cita, paciente, podologo },
      evaluacion: evaluacion || null,
      ortesis: ortesis || null,
      recetas: recetasConDetalles,
      documentos: documentos || [],
    };
  }
}
