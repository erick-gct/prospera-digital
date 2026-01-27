import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { MailService } from '../mail/mail.service';
import { logAuditEvent } from '../common/audit-context';

@Injectable()
export class AppointmentService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
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

    if (checkError)
      throw new InternalServerErrorException(
        'Error verificando disponibilidad.',
      );

    if (citasExistentes && citasExistentes.length > 0) {
      throw new BadRequestException(
        'Ya existe una cita reservada para esta fecha y hora.',
      );
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
        throw new BadRequestException(
          'Ya existe una cita reservada para esta fecha y hora. Por favor, selecciona otro horario.',
        );
      }
      throw new InternalServerErrorException(
        `Error al reservar la cita: ${insertError.message}`,
      );
    }

    // 4. NOTIFICACIÓN POR CORREO (Subsistema)
    // Buscamos el correo del paciente
    const { data: paciente } = await this.supabase
      .from('paciente')
      .select('nombres, apellidos, email')
      .eq('usuario_id', createAppointmentDto.userId)
      .single();

    // Buscamos el nombre del podólogo
    const { data: podologo } = await this.supabase
      .from('podologo')
      .select('nombres, apellidos')
      .eq('usuario_id', podologoId)
      .single();

    // 4.1 REGISTRAR AUDITORÍA (con nombre del usuario)
    const nombrePaciente = paciente
      ? `${paciente.nombres} ${paciente.apellidos}`
      : null;
    await logAuditEvent(this.supabase, {
      tabla: 'cita',
      registroId: nuevaCita.id,
      accion: 'INSERT',
      usuarioId: createAppointmentDto.userId,
      usuarioNombre: nombrePaciente,
      datosNuevos: nuevaCita,
    });

    if (paciente && paciente.email) {
      const fechaFormateada = fechaCita.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const horaFormateada = fechaCita.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const nombrePodologo = podologo
        ? `Dr. ${podologo.nombres} ${podologo.apellidos}`
        : 'Especialista asignado';

      // Enviar correo de confirmación
      await this.mailService.sendAppointmentConfirmation(
        paciente.email,
        nombrePaciente || 'Paciente',
        fechaFormateada,
        horaFormateada,
        nombrePodologo,
        nuevaCita.id,
        createAppointmentDto.userId,
      );
    }

    return { message: 'Cita reservada con éxito', cita: nuevaCita };
  }

  /**
   * Obtener citas de un podólogo con filtro de rango de fechas
   */
  async findByPodologo(
    podologoId: string,
    startDate?: string,
    endDate?: string,
  ) {
    // 1. Query simple para obtener las citas
    let query = this.supabase
      .from('cita')
      .select(
        'id, fecha_hora_inicio, motivo_cita, observaciones_paciente, estado_id, paciente_id',
      )
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
      throw new InternalServerErrorException(
        `Error al obtener citas: ${error.message}`,
      );
    }

    if (!citas || citas.length === 0) {
      return [];
    }

    // 2. Obtener IDs únicos de pacientes y estados
    const pacienteIds = [
      ...new Set(citas.map((c) => c.paciente_id).filter(Boolean)),
    ];
    const estadoIds = [
      ...new Set(citas.map((c) => c.estado_id).filter(Boolean)),
    ];

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
    const pacienteMap = new Map(pacientes?.map((p) => [p.usuario_id, p]) || []);
    const estadoMap = new Map(estados?.map((e) => [e.id, e]) || []);

    // 6. Enriquecer las citas con datos de paciente y estado
    const citasEnriquecidas = citas.map((cita) => ({
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
  async findByDate(date: string, podologoId?: string) {
    // Calcular inicio y fin del día
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    // 1. Query para obtener citas del día
    let query = this.supabase
      .from('cita')
      .select(
        'id, fecha_hora_inicio, motivo_cita, observaciones_paciente, observaciones_podologo, procedimientos_realizados, estado_id, paciente_id, podologo_id',
      )
      .gte('fecha_hora_inicio', startOfDay)
      .lte('fecha_hora_inicio', endOfDay)
      .neq('estado_id', 3) // Excluir canceladas
      .order('fecha_hora_inicio', { ascending: true });

    // Si se especifica un podólogo (y no es 'global' o 'all'), filtramos.
    // De lo contrario, traemos TODO para verificar disponibilidad GLOBAL.
    if (podologoId && podologoId !== 'all' && podologoId !== 'global') {
      query = query.eq('podologo_id', podologoId);
    }

    const { data: citas, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener citas: ${error.message}`,
      );
    }

    if (!citas || citas.length === 0) {
      return [];
    }

    // 2. Obtener datos de pacientes
    const pacienteIds = [
      ...new Set(citas.map((c) => c.paciente_id).filter(Boolean)),
    ];
    const estadoIds = [
      ...new Set(citas.map((c) => c.estado_id).filter(Boolean)),
    ];

    const { data: pacientes } = await this.supabase
      .from('paciente')
      .select(
        'usuario_id, nombres, apellidos, cedula, telefono, email, fecha_nacimiento',
      )
      .in('usuario_id', pacienteIds);

    const { data: estados } = await this.supabase
      .from('estado_cita')
      .select('id, nombre')
      .in('id', estadoIds);

    // 3. Mapas para lookup
    const pacienteMap = new Map(pacientes?.map((p) => [p.usuario_id, p]) || []);
    const estadoMap = new Map(estados?.map((e) => [e.id, e]) || []);

    // 4. Enriquecer citas
    const citasEnriquecidas = citas.map((cita) => ({
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

  /**
   * Obtener detalle completo de una cita con datos relacionados
   */
  async getAppointmentDetail(citaId: number) {
    // 1. Obtener la cita
    const { data: cita, error: citaError } = await this.supabase
      .from('cita')
      .select('*')
      .eq('id', citaId)
      .single();

    if (citaError || !cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    // 2. Obtener evaluación
    const { data: evaluacion } = await this.supabase
      .from('ficha_evaluacion')
      .select('*')
      .eq('cita_id', citaId)
      .single();

    // 3. Obtener ortesis
    const { data: ortesis } = await this.supabase
      .from('gestion_ortesis')
      .select('*')
      .eq('cita_id', citaId)
      .single();

    // 4. Obtener recetas con detalles
    const { data: recetas } = await this.supabase
      .from('receta')
      .select('id, fecha_emision, diagnostico_receta')
      .eq('cita_id', citaId)
      .order('fecha_creacion', { ascending: false });

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

    return {
      cita,
      evaluacion: evaluacion || null,
      ortesis: ortesis || null,
      recetas: recetasConDetalles,
    };
  }

  /**
   * Actualizar detalle completo de una cita (tratamiento, recetas, ortesis, evaluación)
   */
  async updateAppointmentDetail(citaId: number, dto: any) {
    // 1. Verificar que la cita existe y no está completada (estado_id != 2)
    const { data: cita, error: citaError } = await this.supabase
      .from('cita')
      .select('id, estado_id, podologo_id')
      .eq('id', citaId)
      .single();

    if (citaError || !cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (cita.estado_id === 2) {
      throw new BadRequestException(
        'No se puede modificar una cita completada',
      );
    }

    // Obtener nombre del podólogo para auditoría
    const { data: podologoData } = await this.supabase
      .from('podologo')
      .select('nombres, apellidos')
      .eq('usuario_id', cita.podologo_id)
      .single();
    const nombrePodologo = podologoData
      ? `${podologoData.nombres} ${podologoData.apellidos}`
      : null;

    const now = new Date().toISOString();

    // 2. Actualizar tabla cita (observaciones y procedimientos)
    const { error: updateCitaError } = await this.supabase
      .from('cita')
      .update({
        observaciones_podologo: dto.observaciones_podologo || null,
        procedimientos_realizados: dto.procedimientos_realizados || null,
        fecha_modificacion: now,
      })
      .eq('id', citaId);

    if (updateCitaError) {
      throw new InternalServerErrorException(
        `Error actualizando cita: ${updateCitaError.message}`,
      );
    }

    // Auditoría: Actualización de observaciones de cita
    await logAuditEvent(this.supabase, {
      tabla: 'cita',
      registroId: citaId,
      accion: 'UPDATE',
      usuarioId: cita.podologo_id,
      usuarioNombre: nombrePodologo,
      datosNuevos: {
        observaciones_podologo: dto.observaciones_podologo,
        procedimientos_realizados: dto.procedimientos_realizados,
      },
    });

    // 3. Upsert ficha_evaluacion (crear o actualizar)
    if (dto.evaluacion) {
      const evaluacionData = {
        cita_id: citaId,
        tipo_pie_izq: dto.evaluacion.tipo_pie_izq || null,
        pi_notas: dto.evaluacion.pi_notas || null,
        pi_unas: dto.evaluacion.pi_unas || null,
        tipo_pie_der: dto.evaluacion.tipo_pie_der || null,
        pd_notas: dto.evaluacion.pd_notas || null,
        pd_unas: dto.evaluacion.pd_unas || null,
        tipo_calzado: dto.evaluacion.tipo_calzado || null,
        actividad_fisica: dto.evaluacion.actividad_fisica || null,
        evaluacion_vascular: dto.evaluacion.evaluacion_vascular || null,
        fecha_modificacion: now,
      };

      // Verificar si ya existe
      const { data: existingEval } = await this.supabase
        .from('ficha_evaluacion')
        .select('id')
        .eq('cita_id', citaId)
        .single();

      if (existingEval) {
        // Update
        const { error } = await this.supabase
          .from('ficha_evaluacion')
          .update(evaluacionData)
          .eq('cita_id', citaId);
        if (error)
          throw new InternalServerErrorException(
            `Error actualizando evaluación: ${error.message}`,
          );

        // Auditoría: Actualización de evaluación del pie
        await logAuditEvent(this.supabase, {
          tabla: 'ficha_evaluacion',
          registroId: existingEval.id,
          accion: 'UPDATE',
          usuarioId: cita.podologo_id,
          usuarioNombre: nombrePodologo,
          datosNuevos: evaluacionData,
        });
      } else {
        // Insert
        const { data: newEval, error } = await this.supabase
          .from('ficha_evaluacion')
          .insert({ ...evaluacionData, fecha_creacion: now })
          .select('id')
          .single();
        if (error)
          throw new InternalServerErrorException(
            `Error creando evaluación: ${error.message}`,
          );

        // Auditoría: Creación de evaluación del pie
        if (newEval) {
          await logAuditEvent(this.supabase, {
            tabla: 'ficha_evaluacion',
            registroId: newEval.id,
            accion: 'INSERT',
            usuarioId: cita.podologo_id,
            usuarioNombre: nombrePodologo,
            datosNuevos: evaluacionData,
          });
        }
      }
    }

    // 4. Upsert gestion_ortesis (crear o actualizar)
    if (dto.ortesis) {
      const ortesisData = {
        cita_id: citaId,
        tipo_ortesis: dto.ortesis.tipo_ortesis || null,
        talla_calzado: dto.ortesis.talla_calzado || null,
        fecha_toma_molde: dto.ortesis.fecha_toma_molde || null,
        fecha_envio_laboratorio: dto.ortesis.fecha_envio_laboratorio || null,
        fecha_entrega_paciente: dto.ortesis.fecha_entrega_paciente || null,
        observaciones_lab: dto.ortesis.observaciones_lab || null,
        fecha_modificacion: now,
      };

      // Verificar si ya existe
      const { data: existingOrtesis } = await this.supabase
        .from('gestion_ortesis')
        .select('id')
        .eq('cita_id', citaId)
        .single();

      if (existingOrtesis) {
        // Update
        const { error } = await this.supabase
          .from('gestion_ortesis')
          .update(ortesisData)
          .eq('cita_id', citaId);
        if (error)
          throw new InternalServerErrorException(
            `Error actualizando ortesis: ${error.message}`,
          );

        // Auditoría: Actualización de órtesis
        await logAuditEvent(this.supabase, {
          tabla: 'gestion_ortesis',
          registroId: existingOrtesis.id,
          accion: 'UPDATE',
          usuarioId: cita.podologo_id,
          usuarioNombre: nombrePodologo,
          datosNuevos: ortesisData,
        });
      } else {
        // Insert
        const { data: newOrtesis, error } = await this.supabase
          .from('gestion_ortesis')
          .insert({ ...ortesisData, fecha_creacion: now })
          .select('id')
          .single();
        if (error)
          throw new InternalServerErrorException(
            `Error creando ortesis: ${error.message}`,
          );

        // Auditoría: Creación de órtesis
        if (newOrtesis) {
          await logAuditEvent(this.supabase, {
            tabla: 'gestion_ortesis',
            registroId: newOrtesis.id,
            accion: 'INSERT',
            usuarioId: cita.podologo_id,
            usuarioNombre: nombrePodologo,
            datosNuevos: ortesisData,
          });
        }
      }
    }

    // 5. Insertar recetas nuevas (no actualizamos las existentes)
    if (dto.recetas && dto.recetas.length > 0) {
      for (const receta of dto.recetas) {
        if (receta.medicamentos && receta.medicamentos.length > 0) {
          // Crear la receta
          const { data: newReceta, error: recetaError } = await this.supabase
            .from('receta')
            .insert({
              cita_id: citaId,
              fecha_emision: now,
              diagnostico_receta: null, // El diagnóstico ahora está en observaciones_podologo
              fecha_creacion: now,
            })
            .select('id')
            .single();

          if (recetaError || !newReceta) {
            throw new InternalServerErrorException(
              `Error creando receta: ${recetaError?.message}`,
            );
          }

          // Auditoría: Creación de receta
          await logAuditEvent(this.supabase, {
            tabla: 'receta',
            registroId: newReceta.id,
            accion: 'INSERT',
            usuarioId: cita.podologo_id,
            usuarioNombre: nombrePodologo,
            datosNuevos: {
              cita_id: citaId,
              medicamentos: receta.medicamentos.length,
            },
          });

          // Insertar detalles de receta
          const detalles = receta.medicamentos.map((med: any) => ({
            receta_id: newReceta.id,
            medicamento: med.nombre,
            dosis: med.dosis || null,
            indicaciones: med.indicaciones || null,
          }));

          const { data: insertedDetalles, error: detallesError } =
            await this.supabase
              .from('detalles_receta')
              .insert(detalles)
              .select('id');

          if (detallesError) {
            throw new InternalServerErrorException(
              `Error creando detalles de receta: ${detallesError.message}`,
            );
          }

          // Auditoría: Creación de detalles de receta (agrupados)
          if (insertedDetalles && insertedDetalles.length > 0) {
            await logAuditEvent(this.supabase, {
              tabla: 'detalles_receta',
              registroId: `receta_${newReceta.id}`,
              accion: 'INSERT',
              usuarioId: cita.podologo_id,
              usuarioNombre: nombrePodologo,
              datosNuevos: { receta_id: newReceta.id, medicamentos: detalles },
            });
          }
        }
      }
    }

    return { message: 'Datos de la cita guardados correctamente' };
  }

  /**
   * Cambiar el estado de una cita
   */
  async updateStatus(citaId: number, estadoId: number, userId?: string) {
    // Verificar que el estado es válido (1, 2 o 3)
    if (![1, 2, 3].includes(estadoId)) {
      throw new BadRequestException('Estado no válido');
    }

    // Verificar que la cita existe y obtener datos para email
    const { data: cita, error: citaError } = await this.supabase
      .from('cita')
      .select('id, estado_id, paciente_id, podologo_id, fecha_hora_inicio, paciente:paciente_id(usuario_id)')
      .eq('id', citaId)
      .single();

    if (citaError || !cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    // --- VALIDACIÓN DE ESTADO ACTUAL ---
    // SOLO las citas en estado "Reservada" (1) pueden cambiar de estado (a Cancelada)
    if (cita.estado_id !== 1) {
      throw new BadRequestException('Solo se pueden modificar citas que estén en estado Reservada.');
    }

    // --- RESTRICCIÓN PARA PACIENTES (24 Horas) ---
    // Solo aplica si se está CANCELANDO (estado 3)
    if (userId && estadoId === 3) {
      // Nota: cita.paciente puede ser un array si la relación no es 'single' en la query.
      const pacienteObj = Array.isArray(cita.paciente) ? cita.paciente[0] : cita.paciente;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const idPacienteCita = pacienteObj?.usuario_id || cita.paciente_id;

      const esPaciente = idPacienteCita === userId;

      if (esPaciente) {
        const ahora = new Date();
        const fechaCita = new Date(cita.fecha_hora_inicio);
        const diffMs = fechaCita.getTime() - ahora.getTime();
        const diffHoras = diffMs / (1000 * 60 * 60);

        if (diffHoras < 24) {
          throw new BadRequestException(
            'No se puede cancelar la cita con menos de 24 horas de anticipación. Por favor, comunínquese con el consultorio.'
          );
        }
      }
    }

    // Actualizar el estado
    // Usamos podologo_id como usuario que hace el cambio (si es el podólogo)
    // O paciente_id si es el paciente cancelando
    // Si viene userId, podemos usarlo para log, pero mantenemos lógica anterior por consistencia.
    const auditUserId = estadoId === 3 ? cita.paciente_id : cita.podologo_id;
    const { error: updateError } = await this.supabase
      .from('cita')
      .update({
        estado_id: estadoId,
        fecha_modificacion: new Date().toISOString(),
      })
      .eq('id', citaId);

    if (updateError) {
      throw new InternalServerErrorException(
        `Error actualizando estado: ${updateError.message}`,
      );
    }

    // Obtener nombre del usuario que hace el cambio para auditoría
    let usuarioNombre: string | null = null;
    if (estadoId === 3) {
      // Paciente cancelando
      const { data: pacienteData } = await this.supabase
        .from('paciente')
        .select('nombres, apellidos')
        .eq('usuario_id', cita.paciente_id)
        .single();
      usuarioNombre = pacienteData
        ? `${pacienteData.nombres} ${pacienteData.apellidos}`
        : null;
    } else {
      // Podólogo actualizando
      const { data: podologoData } = await this.supabase
        .from('podologo')
        .select('nombres, apellidos')
        .eq('usuario_id', cita.podologo_id)
        .single();
      usuarioNombre = podologoData
        ? `${podologoData.nombres} ${podologoData.apellidos}`
        : null;
    }

    // Registrar auditoría
    await logAuditEvent(this.supabase, {
      tabla: 'cita',
      registroId: citaId,
      accion: 'UPDATE',
      usuarioId: auditUserId,
      usuarioNombre,
      datosAnteriores: { estado_id: cita.estado_id },
      datosNuevos: { estado_id: estadoId },
    });

    // Obtener nombre del estado
    const { data: estado } = await this.supabase
      .from('estado_cita')
      .select('nombre')
      .eq('id', estadoId)
      .single();

    // Si el estado es "Cancelada" (3), enviar email de cancelación
    if (estadoId === 3) {
      // Obtener datos del paciente
      const { data: paciente } = await this.supabase
        .from('paciente')
        .select('nombres, apellidos, email')
        .eq('usuario_id', cita.paciente_id)
        .single();

      // Obtener datos del podólogo
      const { data: podologo } = await this.supabase
        .from('podologo')
        .select('nombres, apellidos')
        .eq('usuario_id', cita.podologo_id)
        .single();

      if (paciente && paciente.email) {
        const fechaCita = new Date(cita.fecha_hora_inicio);
        const fechaFormateada = fechaCita.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const horaFormateada = fechaCita.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const nombrePaciente = `${paciente.nombres} ${paciente.apellidos}`;
        const nombrePodologo = podologo
          ? `Dr. ${podologo.nombres} ${podologo.apellidos}`
          : 'Especialista asignado';

        await this.mailService.sendAppointmentCancellation(
          paciente.email,
          nombrePaciente,
          fechaFormateada,
          horaFormateada,
          nombrePodologo,
          null, // Sin motivo específico por ahora
          citaId,
          cita.paciente_id,
        );
      }
    }

    return {
      message: 'Estado actualizado correctamente',
      nuevo_estado: estado?.nombre || 'Desconocido',
    };
  }

  /**
   * Reagendar una cita (cambiar fecha y hora)
   */
  async reschedule(citaId: number, nuevaFechaHora: string, userId?: string) {
    // Verificar que la cita existe y obtener datos para email
    const { data: cita, error: citaError } = await this.supabase
      .from('cita')
      .select('id, estado_id, paciente_id, podologo_id, fecha_hora_inicio, paciente:paciente_id(usuario_id)')
      .eq('id', citaId)
      .single();

    if (citaError || !cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    // Solo se puede reagendar citas en estado "Reservada" (1)
    if (cita.estado_id !== 1) {
      throw new BadRequestException(
        'Solo se pueden reagendar citas que estén en estado Reservada.',
      );
    }

    // --- RESTRICCIÓN PARA PACIENTES (24 Horas) ---
    if (userId) {
      // Verificar si el usuario que solicita es el Paciente dueño de la cita
      // Nota: cita.paciente puede ser un array si la relación no es 'single' en la query.
      // TypeScript indica que es un array.
      const pacienteObj = Array.isArray(cita.paciente) ? cita.paciente[0] : cita.paciente;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const idPacienteCita = pacienteObj?.usuario_id || cita.paciente_id;

      const esPaciente = idPacienteCita === userId;

      if (esPaciente) {
        const ahora = new Date();
        const fechaCita = new Date(cita.fecha_hora_inicio);
        const diffMs = fechaCita.getTime() - ahora.getTime();
        const diffHoras = diffMs / (1000 * 60 * 60);

        if (diffHoras < 24) {
          throw new BadRequestException(
            'No se puede reagendar una cita con menos de 24 horas de anticipación. Por favor, comunínquese con el consultorio.'
          );
        }
      }
    }

    // Guardar fecha anterior para el email
    const fechaAnterior = new Date(cita.fecha_hora_inicio);

    // VALIDACIÓN DE DOBLE BOOKING (Manual Check) - GLOBAL
    const { data: citasExistentes, error: checkError } = await this.supabase
      .from('cita')
      .select('id')
      // .eq('podologo_id', cita.podologo_id) // ELIMINADO: Bloqueo global de horario
      .eq('fecha_hora_inicio', nuevaFechaHora)
      .neq('estado_id', 3) // Ignorar canceladas
      .neq('id', citaId); // Ignorar la misma

    if (checkError) {
      throw new InternalServerErrorException('Error verificando disponibilidad.');
    }

    if (citasExistentes && citasExistentes.length > 0) {
      throw new BadRequestException(
        'Ya existe una cita reservada para esa fecha y hora en el consultorio.',
      );
    }

    // Actualizar la fecha y hora
    const { error: updateError } = await this.supabase
      .from('cita')
      .update({
        fecha_hora_inicio: nuevaFechaHora,
        fecha_modificacion: new Date().toISOString(),
      })
      .eq('id', citaId);

    if (updateError) {
      // Detectar error de unique constraint (doble booking)
      if (updateError.code === '23505') {
        throw new BadRequestException(
          'Ya existe una cita reservada para esa fecha y hora. Por favor, selecciona otro horario.',
        );
      }
      throw new InternalServerErrorException(
        `Error reagendando cita: ${updateError.message}`,
      );
    }

    // Enviar email de reagendamiento
    const { data: paciente } = await this.supabase
      .from('paciente')
      .select('nombres, apellidos, email')
      .eq('usuario_id', cita.paciente_id)
      .single();

    const { data: podologo } = await this.supabase
      .from('podologo')
      .select('nombres, apellidos')
      .eq('usuario_id', cita.podologo_id)
      .single();

    // Registrar auditoría (con nombre del usuario)
    const nombrePaciente = paciente
      ? `${paciente.nombres} ${paciente.apellidos}`
      : null;
    await logAuditEvent(this.supabase, {
      tabla: 'cita',
      registroId: citaId,
      accion: 'UPDATE',
      usuarioId: cita.paciente_id,
      usuarioNombre: nombrePaciente,
      datosAnteriores: { fecha_hora_inicio: cita.fecha_hora_inicio },
      datosNuevos: { fecha_hora_inicio: nuevaFechaHora },
    });

    if (paciente && paciente.email) {
      const fechaNueva = new Date(nuevaFechaHora);
      const fechaAnteriorFormateada = fechaAnterior.toLocaleDateString(
        'es-ES',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      );
      const horaAnteriorFormateada = fechaAnterior.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const fechaNuevaFormateada = fechaNueva.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const horaNuevaFormateada = fechaNueva.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const nombrePaciente = `${paciente.nombres} ${paciente.apellidos}`;
      const nombrePodologo = podologo
        ? `Dr. ${podologo.nombres} ${podologo.apellidos}`
        : 'Especialista asignado';

      await this.mailService.sendAppointmentReschedule(
        paciente.email,
        nombrePaciente,
        fechaAnteriorFormateada,
        horaAnteriorFormateada,
        fechaNuevaFormateada,
        horaNuevaFormateada,
        nombrePodologo,
        citaId,
        cita.paciente_id,
      );
    }

    return {
      message: 'Cita reagendada correctamente',
      nueva_fecha: nuevaFechaHora,
    };
  }

  /**
   * Subir un documento clínico para una cita
   */
  async uploadDocument(
    citaId: number,
    fileData: { path: string; url: string; nombre: string; tipo: string },
  ) {
    // Verificar que la cita existe
    const { data: cita, error: citaError } = await this.supabase
      .from('cita')
      .select('id')
      .eq('id', citaId)
      .single();

    if (citaError || !cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    // Insertar en documentos_clinicos
    const { data, error } = await this.supabase
      .from('documentos_clinicos')
      .insert({
        cita_id: citaId,
        url_almacenamiento: fileData.url,
        nombre_archivo: fileData.nombre,
        tipo_archivo: fileData.tipo,
        fecha_subida: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error guardando documento: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Obtener documentos de una cita
   */
  async getDocuments(citaId: number) {
    const { data, error } = await this.supabase
      .from('documentos_clinicos')
      .select(
        'id, url_almacenamiento, nombre_archivo, tipo_archivo, fecha_subida',
      )
      .eq('cita_id', citaId)
      .order('fecha_subida', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Error obteniendo documentos: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Eliminar un documento
   */
  async deleteDocument(documentId: number) {
    const { error } = await this.supabase
      .from('documentos_clinicos')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw new InternalServerErrorException(
        `Error eliminando documento: ${error.message}`,
      );
    }

    return { message: 'Documento eliminado correctamente' };
  }
}
