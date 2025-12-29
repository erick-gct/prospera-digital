import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { MailService } from '../mail/mail.service'; // Tu servicio de correo

@Injectable()
export class AppointmentService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private mailService: MailService
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  async create(createAppointmentDto: CreateAppointmentDto) {
    // 1. USAR PODÓLOGO SELECCIONADO POR EL PACIENTE
    const podologoId = createAppointmentDto.podologoId;
    const fechaCita = new Date(createAppointmentDto.fechaHoraInicio);

    // 2. VALIDACIÓN DE DOBLE BOOKING
    // Regla: No puede haber otra cita activa (estado != cancelado) a la misma hora para este podólogo.
    // Asumimos estado_id: 3 es "Cancelado".
    const { data: citasExistentes, error: checkError } = await this.supabase
      .from('cita')
      .select('id')
      .eq('podologo_id', podologoId)
      .eq('fecha_hora_inicio', createAppointmentDto.fechaHoraInicio)
      .neq('estado_id', 3); // No contamos las canceladas

    if (checkError) throw new InternalServerErrorException('Error verificando disponibilidad.');

    if (citasExistentes && citasExistentes.length > 0) {
      throw new BadRequestException('Ya existe una cita reservada para esta fecha y hora.');
    }

    // 3. INSERTAR CITA EN BASE DE DATOS
    // Asumimos estado_id: 1 es "Pendiente/Reservada".
    const { data: nuevaCita, error: insertError } = await this.supabase
      .from('cita')
      .insert({
        paciente_id: createAppointmentDto.userId,
        podologo_id: podologoId,
        fecha_hora_inicio: createAppointmentDto.fechaHoraInicio,
        motivo_cita: createAppointmentDto.motivo_cita,
        observaciones_paciente: createAppointmentDto.observaciones_paciente,
        estado_id: 1,
      })
      .select()
      .single();

    if (insertError) {
      // Detectar error de unique constraint (doble booking a nivel de BD)
      if (insertError.code === '23505') {
        throw new BadRequestException('Ya existe una cita reservada para esta fecha y hora. Por favor, selecciona otro horario.');
      }
      throw new InternalServerErrorException(`Error al reservar la cita: ${insertError.message}`);
    }

    // 4. NOTIFICACIÓN POR CORREO (Subsistema)
    // Buscamos el correo del paciente
    const { data: paciente } = await this.supabase
      .from('paciente')
      .select('nombres, apellidos, email')
      .eq('usuario_id', createAppointmentDto.userId)
      .single();

    if (paciente && paciente.email) {
      const fechaFormateada = fechaCita.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const horaFormateada = fechaCita.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const nombreCompleto = `${paciente.nombres} ${paciente.apellidos}`;

      // Enviar correo de confirmación
      await this.mailService.sendAppointmentConfirmation(
        paciente.email,
        nombreCompleto,
        fechaFormateada,
        horaFormateada
      );
    }

    return { message: 'Cita reservada con éxito', cita: nuevaCita };
  }

  /**
   * Obtener citas de un podólogo con filtro de rango de fechas
   */
  async findByPodologo(podologoId: string, startDate?: string, endDate?: string) {
    // 1. Query simple para obtener las citas
    let query = this.supabase
      .from('cita')
      .select('id, fecha_hora_inicio, motivo_cita, observaciones_paciente, estado_id, paciente_id')
      .eq('podologo_id', podologoId)
      .order('fecha_hora_inicio', { ascending: true });

    if (startDate) {
      query = query.gte('fecha_hora_inicio', startDate);
    }
    if (endDate) {
      query = query.lte('fecha_hora_inicio', endDate);
    }

    const { data: citas, error } = await query;

    if (error) {
      throw new InternalServerErrorException(`Error al obtener citas: ${error.message}`);
    }

    if (!citas || citas.length === 0) {
      return [];
    }

    // 2. Obtener IDs únicos de pacientes y estados
    const pacienteIds = [...new Set(citas.map(c => c.paciente_id).filter(Boolean))];
    const estadoIds = [...new Set(citas.map(c => c.estado_id).filter(Boolean))];

    // 3. Query para pacientes
    const { data: pacientes } = await this.supabase
      .from('paciente')
      .select('usuario_id, nombres, apellidos, cedula')
      .in('usuario_id', pacienteIds);

    // 4. Query para estados
    const { data: estados } = await this.supabase
      .from('estado_cita')
      .select('id, nombre')
      .in('id', estadoIds);

    // 5. Crear mapas para lookup rápido
    const pacienteMap = new Map(pacientes?.map(p => [p.usuario_id, p]) || []);
    const estadoMap = new Map(estados?.map(e => [e.id, e]) || []);

    // 6. Enriquecer las citas con datos de paciente y estado
    const citasEnriquecidas = citas.map(cita => ({
      id: cita.id,
      fecha_hora_inicio: cita.fecha_hora_inicio,
      motivo_cita: cita.motivo_cita,
      observaciones_paciente: cita.observaciones_paciente,
      estado_id: cita.estado_id,
      paciente: pacienteMap.get(cita.paciente_id) || null,
      estado_cita: estadoMap.get(cita.estado_id) || null,
    }));

    return citasEnriquecidas;
  }

  /**
   * Obtener citas de un podólogo para una fecha específica (para gestión de citas)
   */
  async findByDate(podologoId: string, date: string) {
    // Calcular inicio y fin del día
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    // 1. Query para obtener citas del día
    const { data: citas, error } = await this.supabase
      .from('cita')
      .select('id, fecha_hora_inicio, motivo_cita, observaciones_paciente, observaciones_podologo, procedimientos_realizados, estado_id, paciente_id')
      .eq('podologo_id', podologoId)
      .gte('fecha_hora_inicio', startOfDay)
      .lte('fecha_hora_inicio', endOfDay)
      .order('fecha_hora_inicio', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(`Error al obtener citas: ${error.message}`);
    }

    if (!citas || citas.length === 0) {
      return [];
    }

    // 2. Obtener datos de pacientes
    const pacienteIds = [...new Set(citas.map(c => c.paciente_id).filter(Boolean))];
    const estadoIds = [...new Set(citas.map(c => c.estado_id).filter(Boolean))];

    const { data: pacientes } = await this.supabase
      .from('paciente')
      .select('usuario_id, nombres, apellidos, cedula, telefono, email, fecha_nacimiento')
      .in('usuario_id', pacienteIds);

    const { data: estados } = await this.supabase
      .from('estado_cita')
      .select('id, nombre')
      .in('id', estadoIds);

    // 3. Mapas para lookup
    const pacienteMap = new Map(pacientes?.map(p => [p.usuario_id, p]) || []);
    const estadoMap = new Map(estados?.map(e => [e.id, e]) || []);

    // 4. Enriquecer citas
    const citasEnriquecidas = citas.map(cita => ({
      id: cita.id,
      fecha_hora_inicio: cita.fecha_hora_inicio,
      motivo_cita: cita.motivo_cita,
      observaciones_paciente: cita.observaciones_paciente,
      observaciones_podologo: cita.observaciones_podologo,
      procedimientos_realizados: cita.procedimientos_realizados,
      estado_id: cita.estado_id,
      paciente: pacienteMap.get(cita.paciente_id) || null,
      estado_cita: estadoMap.get(cita.estado_id) || null,
    }));

    return citasEnriquecidas;
  }
}