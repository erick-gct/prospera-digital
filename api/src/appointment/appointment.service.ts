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
    // 1. ASIGNAR PODÓLOGO
    // Como es un consultorio pequeño, buscamos al primer podólogo disponible en la BD.
    // (En el futuro podrías enviar podologoId desde el frontend si hay varios).
    const { data: podologo, error: podError } = await this.supabase
      .from('podologo')
      .select('usuario_id')
      .limit(1)
      .single();

    if (podError || !podologo) {
      throw new NotFoundException('No hay podólogos registrados en el sistema.');
    }

    const podologoId = podologo.usuario_id;
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

      // Usamos tu MailService existente
      // (Asegúrate de que este método exista en tu mail.service.ts, si no, agrégalo como vimos antes)
      await this.mailService.sendAppointmentConfirmation(
        paciente.email,
        nombreCompleto,
        fechaFormateada,
        horaFormateada
      );
    }

    return { message: 'Cita reservada con éxito', cita: nuevaCita };
  }
}