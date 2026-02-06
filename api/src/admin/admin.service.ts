/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
@Injectable()
export class AdminService {
  private supabase: SupabaseClient;
  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }
  // =====================================================
  // GESTIÓN DE USUARIOS (Pacientes + Podólogos)
  // =====================================================
  /**
   * Obtener todos los usuarios del sistema (pacientes y podólogos)
   */
  async findAllUsers(filters?: {
    tipo?: 'paciente' | 'podologo' | 'todos';
    cedula?: string;
    apellido?: string;
    estado?: string;
  }) {
    try {
      const users: any[] = [];
      const tipo = filters?.tipo || 'todos';
      // Obtener Pacientes
      if (tipo === 'todos' || tipo === 'paciente') {
        let queryPacientes = this.supabase
          .from('paciente')
          .select(
            `
            usuario_id,
            nombres,
            apellidos,
            cedula,
            email,
            telefono,
            fecha_nacimiento,
            ciudad,
            direccion,
            enfermedades,
            pais_id,
            tipo_sangre_id,
            estado_paciente_id,
            fecha_creacion,
            fecha_modificacion,
            paises (nombre),
            tipos_sangre (nombre),
            estado_paciente (nombre)
          `,
          )
          .order('fecha_creacion', { ascending: false });
        // Aplicar filtros
        if (filters?.cedula) {
          queryPacientes = queryPacientes.ilike(
            'cedula',
            `%${filters.cedula}%`,
          );
        }
        if (filters?.apellido) {
          queryPacientes = queryPacientes.ilike(
            'apellidos',
            `%${filters.apellido}%`,
          );
        }
        if (filters?.estado && filters.estado !== 'todos') {
          queryPacientes = queryPacientes.eq(
            'estado_paciente_id',
            parseInt(filters.estado),
          );
        }
        const { data: pacientes, error: errorPacientes } = await queryPacientes;
        if (errorPacientes) {
          console.error('Error al obtener pacientes:', errorPacientes);
        } else if (pacientes) {
          pacientes.forEach((p: any) => {
            const estadoNombre = p.estado_paciente?.nombre || 'Desconocido';
            users.push({
              ...p,
              tipo_usuario: 'PACIENTE',
              estado_nombre: estadoNombre,
              estado_activo: p.estado_paciente_id === 1,
            });
          });
        }
      }
      // Obtener Podólogos
      if (tipo === 'todos' || tipo === 'podologo') {
        let queryPodologos = this.supabase
          .from('podologo')
          .select(
            `
            usuario_id,
            nombres,
            apellidos,
            cedula,
            email,
            telefono,
            fecha_nacimiento,
            pais_id,
            tipo_sangre_id,
            estado,
            fecha_creacion,
            fecha_modificacion,
            paises (nombre),
            tipos_sangre (nombre)
          `,
          )
          .order('fecha_creacion', { ascending: false });
        // Aplicar filtros
        if (filters?.cedula) {
          queryPodologos = queryPodologos.ilike(
            'cedula',
            `%${filters.cedula}%`,
          );
        }
        if (filters?.apellido) {
          queryPodologos = queryPodologos.ilike(
            'apellidos',
            `%${filters.apellido}%`,
          );
        }
        const { data: podologos, error: errorPodologos } = await queryPodologos;
        if (errorPodologos) {
          console.error('Error al obtener podólogos:', errorPodologos);
        } else if (podologos) {
          podologos.forEach((p: any) => {
            users.push({
              ...p,
              tipo_usuario: 'PODOLOGO',
              estado_nombre: p.estado === 1 ? 'Activo' : 'Inactivo',
              estado_activo: p.estado === 1,
            });
          });
        }
      }
      // Ordenar por fecha de creación (más recientes primero)
      users.sort(
        (a, b) =>
          new Date(b.fecha_creacion).getTime() -
          new Date(a.fecha_creacion).getTime(),
      );
      return users;
    } catch (error) {
      console.error('Error en findAllUsers:', error);
      throw new InternalServerErrorException('Error al obtener usuarios');
    }
  }
  /**
   * Obtener detalle de un usuario específico
   */
  async findUserById(userId: string) {
    try {
      // Primero buscar en pacientes
      const { data: paciente } = await this.supabase
        .from('paciente')
        .select(
          `
          usuario_id,
          nombres,
          apellidos,
          cedula,
          email,
          telefono,
          fecha_nacimiento,
          ciudad,
          direccion,
          enfermedades,
          pais_id,
          tipo_sangre_id,
          estado_paciente_id,
          fecha_creacion,
          fecha_modificacion,
          paises (nombre),
          tipos_sangre (nombre),
          estado_paciente (nombre)
        `,
        )
        .eq('usuario_id', userId)
        .maybeSingle();
      if (paciente) {
        // Contar citas del paciente
        const { count: totalCitas } = await this.supabase
          .from('cita')
          .select('*', { count: 'exact', head: true })
          .eq('paciente_id', userId);
        const estadoNombre =
          (paciente as any).estado_paciente?.nombre || 'Desconocido';
        return {
          ...paciente,
          tipo_usuario: 'PACIENTE',
          estado_nombre: estadoNombre,
          estado_activo: paciente.estado_paciente_id === 1,
          estadisticas: {
            total_citas: totalCitas || 0,
          },
        };
      }
      // Si no es paciente, buscar en podólogos
      const { data: podologo } = await this.supabase
        .from('podologo')
        .select(
          `
          usuario_id,
          nombres,
          apellidos,
          cedula,
          email,
          telefono,
          fecha_nacimiento,
          pais_id,
          tipo_sangre_id,
          fecha_creacion,
          fecha_modificacion,
          paises (nombre),
          tipos_sangre (nombre)
        `,
        )
        .eq('usuario_id', userId)
        .maybeSingle();
      if (podologo) {
        // Contar citas del podólogo
        const { count: totalCitas } = await this.supabase
          .from('cita')
          .select('*', { count: 'exact', head: true })
          .eq('podologo_id', userId);
        // Contar pacientes únicos atendidos
        const { data: pacientesUnicos } = await this.supabase
          .from('cita')
          .select('paciente_id')
          .eq('podologo_id', userId);
        const uniquePacientes = new Set(
          pacientesUnicos?.map((c: any) => c.paciente_id) || [],
        );
        return {
          ...podologo,
          tipo_usuario: 'PODOLOGO',
          estado_nombre: 'Activo',
          estado_activo: true,
          estadisticas: {
            total_citas: totalCitas || 0,
            pacientes_atendidos: uniquePacientes.size,
          },
        };
      }
      throw new NotFoundException('Usuario no encontrado');
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en findUserById:', error);
      throw new InternalServerErrorException('Error al obtener usuario');
    }
  }
  /**
   * Desactivar un usuario (pacientes y podólogos)
   */
  async deactivateUser(userId: string) {
    try {
      // Primero verificar si es paciente
      const { data: paciente } = await this.supabase
        .from('paciente')
        .select('usuario_id, nombres, apellidos, estado_paciente_id')
        .eq('usuario_id', userId)
        .maybeSingle();

      if (paciente) {
        if (paciente.estado_paciente_id === 2) {
          return { message: 'El usuario ya está inactivo' };
        }
        const { error: updateError } = await this.supabase
          .from('paciente')
          .update({
            estado_paciente_id: 2,
            fecha_modificacion: new Date().toISOString(),
          })
          .eq('usuario_id', userId);
        if (updateError) {
          throw new InternalServerErrorException('Error al desactivar paciente');
        }
        return {
          message: 'Paciente desactivado correctamente',
          usuario: `${paciente.nombres} ${paciente.apellidos}`,
        };
      }

      // Si no es paciente, verificar si es podólogo
      const { data: podologo } = await this.supabase
        .from('podologo')
        .select('usuario_id, nombres, apellidos, estado')
        .eq('usuario_id', userId)
        .maybeSingle();

      if (podologo) {
        if (podologo.estado === 0) {
          return { message: 'El podólogo ya está inactivo' };
        }
        const { error: updateError } = await this.supabase
          .from('podologo')
          .update({
            estado: 0,
            fecha_modificacion: new Date().toISOString(),
          })
          .eq('usuario_id', userId);
        if (updateError) {
          throw new InternalServerErrorException('Error al desactivar podólogo');
        }
        return {
          message: 'Podólogo desactivado correctamente',
          usuario: `${podologo.nombres} ${podologo.apellidos}`,
        };
      }

      throw new NotFoundException('Usuario no encontrado');
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en deactivateUser:', error);
      throw new InternalServerErrorException('Error al desactivar usuario');
    }
  }
  /**
   * Reactivar un usuario (pacientes y podólogos)
   */
  async reactivateUser(userId: string) {
    try {
      // Primero verificar si es paciente
      const { data: paciente } = await this.supabase
        .from('paciente')
        .select('usuario_id, nombres, apellidos, estado_paciente_id')
        .eq('usuario_id', userId)
        .maybeSingle();

      if (paciente) {
        if (paciente.estado_paciente_id === 1) {
          return { message: 'El paciente ya está activo' };
        }
        const { error: updateError } = await this.supabase
          .from('paciente')
          .update({
            estado_paciente_id: 1,
            fecha_modificacion: new Date().toISOString(),
          })
          .eq('usuario_id', userId);
        if (updateError) {
          throw new InternalServerErrorException('Error al reactivar paciente');
        }
        return {
          message: 'Paciente reactivado correctamente',
          usuario: `${paciente.nombres} ${paciente.apellidos}`,
        };
      }

      // Si no es paciente, verificar si es podólogo
      const { data: podologo } = await this.supabase
        .from('podologo')
        .select('usuario_id, nombres, apellidos, estado')
        .eq('usuario_id', userId)
        .maybeSingle();

      if (podologo) {
        if (podologo.estado === 1) {
          return { message: 'El podólogo ya está activo' };
        }
        const { error: updateError } = await this.supabase
          .from('podologo')
          .update({
            estado: 1,
            fecha_modificacion: new Date().toISOString(),
          })
          .eq('usuario_id', userId);
        if (updateError) {
          throw new InternalServerErrorException('Error al reactivar podólogo');
        }
        return {
          message: 'Podólogo reactivado correctamente',
          usuario: `${podologo.nombres} ${podologo.apellidos}`,
        };
      }

      throw new NotFoundException('Usuario no encontrado');
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error en reactivateUser:', error);
      throw new InternalServerErrorException('Error al reactivar usuario');
    }
  }
  // =====================================================
  // GESTIÓN DE CITAS GLOBALES
  // =====================================================
  /**
   * Obtener todas las citas del sistema
   */
  async findAllAppointments(filters?: {
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    podologoId?: string;
  }) {
    try {
      let query = this.supabase
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
          paciente_id,
          podologo_id,
          fecha_creacion
        `,
        )
        .order('fecha_hora_inicio', { ascending: false });
      // Aplicar filtros
      if (filters?.estado && filters.estado !== 'todos') {
        query = query.eq('estado_id', parseInt(filters.estado));
      }
      if (filters?.fechaInicio) {
        query = query.gte('fecha_hora_inicio', filters.fechaInicio);
      }
      if (filters?.fechaFin) {
        query = query.lte('fecha_hora_inicio', filters.fechaFin);
      }
      if (filters?.podologoId) {
        query = query.eq('podologo_id', filters.podologoId);
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
      // Obtener datos de pacientes y podólogos
      const pacienteIds = [
        ...new Set(citas.map((c: any) => c.paciente_id).filter(Boolean)),
      ];
      const podologoIds = [
        ...new Set(citas.map((c: any) => c.podologo_id).filter(Boolean)),
      ];
      const { data: pacientes } = await this.supabase
        .from('paciente')
        .select('usuario_id, nombres, apellidos, cedula, email, telefono')
        .in('usuario_id', pacienteIds);
      const { data: podologos } = await this.supabase
        .from('podologo')
        .select('usuario_id, nombres, apellidos')
        .in('usuario_id', podologoIds);
      const { data: estados } = await this.supabase
        .from('estado_cita')
        .select('id, nombre');
      // Crear mapas para búsqueda rápida
      const pacienteMap = new Map(
        pacientes?.map((p: any) => [p.usuario_id, p]) || [],
      );
      const podologoMap = new Map(
        podologos?.map((p: any) => [p.usuario_id, p]) || [],
      );
      const estadoMap = new Map(
        estados?.map((e: any) => [e.id, e.nombre]) || [],
      );
      // Enriquecer citas
      const citasEnriquecidas = citas.map((cita: any) => {
        const paciente = pacienteMap.get(cita.paciente_id);
        const podologo = podologoMap.get(cita.podologo_id);
        return {
          ...cita,
          paciente: paciente
            ? {
              nombre_completo: `${paciente.nombres} ${paciente.apellidos}`,
              cedula: paciente.cedula,
              email: paciente.email,
              telefono: paciente.telefono,
            }
            : null,
          podologo: podologo
            ? {
              nombre_completo: `Dr. ${podologo.nombres} ${podologo.apellidos}`,
            }
            : null,
          estado_nombre: estadoMap.get(cita.estado_id) || 'Desconocido',
        };
      });
      return citasEnriquecidas;
    } catch (error) {
      console.error('Error en findAllAppointments:', error);
      throw new InternalServerErrorException('Error al obtener citas');
    }
  }
  /**
   * Obtener estadísticas generales para el dashboard admin
   */
  async getAdminStats() {
    try {
      // Contar pacientes
      const { count: totalPacientes } = await this.supabase
        .from('paciente')
        .select('*', { count: 'exact', head: true });
      const { count: pacientesActivos } = await this.supabase
        .from('paciente')
        .select('*', { count: 'exact', head: true })
        .eq('estado_paciente_id', 1);
      // Contar podólogos
      const { count: totalPodologos } = await this.supabase
        .from('podologo')
        .select('*', { count: 'exact', head: true });
      // Contar citas
      const { count: totalCitas } = await this.supabase
        .from('cita')
        .select('*', { count: 'exact', head: true });
      const { count: citasCompletadas } = await this.supabase
        .from('cita')
        .select('*', { count: 'exact', head: true })
        .eq('estado_id', 2);
      const { count: citasPendientes } = await this.supabase
        .from('cita')
        .select('*', { count: 'exact', head: true })
        .eq('estado_id', 1);
      const { count: citasCanceladas } = await this.supabase
        .from('cita')
        .select('*', { count: 'exact', head: true })
        .eq('estado_id', 3);
      return {
        usuarios: {
          total_pacientes: totalPacientes || 0,
          pacientes_activos: pacientesActivos || 0,
          pacientes_inactivos: (totalPacientes || 0) - (pacientesActivos || 0),
          total_podologos: totalPodologos || 0,
        },
        citas: {
          total: totalCitas || 0,
          completadas: citasCompletadas || 0,
          pendientes: citasPendientes || 0,
          canceladas: citasCanceladas || 0,
        },
      };
    } catch (error) {
      console.error('Error en getAdminStats:', error);
      throw new InternalServerErrorException('Error al obtener estadísticas');
    }
  }
  // =====================================================
  // AUDITORÍA (Sin verificación de contraseña)
  // =====================================================
  /**
   * Obtener logs de auditoría (directo, sin verificación)
   */
  async getAuditLogs(table?: string, limit = 100) {
    let query = this.supabase
      .from('auditoria_cambios')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .limit(limit);
    if (table) {
      query = query.eq('tabla_afectada', table);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    // Enriquecer logs con información adicional
    const enrichedLogs = (data || []).map((log) => {
      let usuarioNombre = 'Sistema';
      if (log.datos_nuevos && log.datos_nuevos._audit_usuario_nombre) {
        usuarioNombre = log.datos_nuevos._audit_usuario_nombre;
      } else if (log.usuario_id) {
        usuarioNombre = `Usuario ${String(log.usuario_id).substring(0, 8)}...`;
      }
      return {
        ...log,
        usuario_nombre: usuarioNombre,
      };
    });
    return enrichedLogs;
  }
  /**
   * Obtener historial de accesos (directo, sin verificación)
   */
  async getLoginHistory(limit = 100) {
    const { data, error } = await this.supabase
      .from('historial_acceso')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('Error fetching login history:', error);
      return [];
    }
    // Enriquecer con nombres reales
    const enrichedHistory = await Promise.all(
      (data || []).map(async (entry) => {
        let nombreCompleto = 'Usuario';
        let tipoUsuario = 'DESCONOCIDO';
        if (entry.usuario_id) {
          // Buscar en podólogos
          const { data: podologos } = await this.supabase
            .from('podologo')
            .select('nombres, apellidos')
            .eq('usuario_id', entry.usuario_id)
            .limit(1);
          if (podologos && podologos.length > 0) {
            nombreCompleto = `${podologos[0].nombres} ${podologos[0].apellidos}`;
            tipoUsuario = 'PODOLOGO';
          } else {
            // Buscar en pacientes
            const { data: pacientes } = await this.supabase
              .from('paciente')
              .select('nombres, apellidos')
              .eq('usuario_id', entry.usuario_id)
              .limit(1);
            if (pacientes && pacientes.length > 0) {
              nombreCompleto = `${pacientes[0].nombres} ${pacientes[0].apellidos}`;
              tipoUsuario = 'PACIENTE';
            } else {
              // Buscar en administradores
              const { data: admins } = await this.supabase
                .from('administrador')
                .select('nombres, email')
                .eq('usuario_id', entry.usuario_id)
                .limit(1);
              if (admins && admins.length > 0) {
                nombreCompleto = admins[0].nombres || admins[0].email;
                tipoUsuario = 'ADMINISTRADOR';
              }
            }
          }
        }
        return {
          ...entry,
          usuario_nombre: entry.email
            ? `${nombreCompleto} (${entry.email})`
            : nombreCompleto,
          tipo_usuario: tipoUsuario,
        };
      }),
    );
    return enrichedHistory;
  }
  /**
   * Obtener tablas disponibles para auditar
   */
  async getAvailableTables() {
    const { data, error } = await this.supabase
      .from('auditoria_cambios')
      .select('tabla_afectada');
    if (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
    // Obtener valores únicos
    const uniqueTables = [
      ...new Set(data?.map((d: any) => d.tabla_afectada) || []),
    ];
    // Mapear a formato amigable
    const tableLabels: Record<string, string> = {
      cita: 'Citas',
      paciente: 'Pacientes',
      podologo: 'Podólogos',
      receta: 'Recetas',
      detalles_receta: 'Detalles de Recetas',
      documentos_clinicos: 'Documentos Clínicos',
      ficha_evaluacion: 'Fichas de Evaluación',
      gestion_ortesis: 'Gestión de Órtesis',
      log_notificaciones: 'Notificaciones',
    };
    return uniqueTables.map((table) => ({
      id: table,
      label:
        tableLabels[table as string] ||
        String(table).charAt(0).toUpperCase() +
        String(table).slice(1).replace(/_/g, ' '),
    }));
  }
  /**
   * Obtener lista de podólogos para filtros
   */
  async getPodologosList() {
    const { data, error } = await this.supabase
      .from('podologo')
      .select('usuario_id, nombres, apellidos')
      .order('apellidos', { ascending: true });
    if (error) {
      console.error('Error fetching podologos:', error);
      return [];
    }
    return (data || []).map((p) => ({
      id: p.usuario_id,
      nombre: `Dr. ${p.nombres} ${p.apellidos}`,
    }));
  }

  // =====================================================
  // CREACIÓN DE PODÓLOGOS
  // =====================================================

  /**
   * Crear un nuevo podólogo
   */
  async createPodologo(data: {
    nombres: string;
    apellidos: string;
    cedula: string;
    email: string;
    password: string;
    telefono?: string;
    fecha_nacimiento?: string;
    pais_id?: number;
    tipo_sangre_id?: number;
  }) {
    try {
      // 1. Verificar si ya existe un usuario con ese email
      const { data: existingUser } = await this.supabase
        .from('podologo')
        .select('usuario_id')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        throw new InternalServerErrorException(
          'Ya existe un podólogo con ese email',
        );
      }

      // 2. Verificar si ya existe un usuario con esa cédula
      const { data: existingCedula } = await this.supabase
        .from('podologo')
        .select('usuario_id')
        .eq('cedula', data.cedula)
        .single();

      if (existingCedula) {
        throw new InternalServerErrorException(
          'Ya existe un podólogo con esa cédula',
        );
      }

      // 3. Crear usuario en auth.users usando el Admin API
      const { data: authUser, error: authError } =
        await this.supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true, // Confirmar email automáticamente
          user_metadata: {
            role: 'PODOLOGO',
          },
        });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new InternalServerErrorException(
          `Error al crear usuario: ${authError.message}`,
        );
      }

      // 4. Insertar en la tabla podologo
      const { error: podologoError } = await this.supabase
        .from('podologo')
        .insert({
          usuario_id: authUser.user.id,
          nombres: data.nombres,
          apellidos: data.apellidos,
          cedula: data.cedula,
          email: data.email,
          telefono: data.telefono || null,
          fecha_nacimiento: data.fecha_nacimiento || null,
          pais_id: data.pais_id || null,
          tipo_sangre_id: data.tipo_sangre_id || null,
          estado: 1, // Activo por defecto
          fecha_creacion: new Date().toISOString(),
          fecha_modificacion: new Date().toISOString(),
        });

      if (podologoError) {
        // Si falla la inserción en podologo, eliminar el usuario de auth
        await this.supabase.auth.admin.deleteUser(authUser.user.id);
        console.error('Error inserting podologo:', podologoError);
        throw new InternalServerErrorException(
          `Error al crear perfil de podólogo: ${podologoError.message}`,
        );
      }

      return {
        success: true,
        message: 'Podólogo creado exitosamente',
        usuario_id: authUser.user.id,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('Error creating podologo:', error);
      throw new InternalServerErrorException('Error al crear el podólogo');
    }
  }

  /**
   * Cambiar contraseña de un usuario (Admin)
   */
  async changeUserPassword(userId: string, newPassword: string) {
    try {
      // 1. Verificar que el usuario existe (en paciente o podólogo)
      const user = await this.findUserById(userId);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // 2. Actualizar contraseña en Auth
      const { error: updateError } = await this.supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        throw new InternalServerErrorException(
          `Error al actualizar contraseña: ${updateError.message}`
        );
      }

      // 3. Obtener nombre del usuario objetivo para el log
      const targetName =
        user.nombres && user.apellidos
          ? `${user.nombres} ${user.apellidos}`
          : user.email;

      // 4. Log de auditoría
      const { error: auditError } = await this.supabase
        .from('auditoria_cambios')
        .insert({
          tabla_afectada: 'auth.users',
          registro_id: userId,
          accion: 'UPDATE',
          usuario_id: null, // Admin
          datos_anteriores: null,
          datos_nuevos: { action: 'password_reset_by_admin', target_user: targetName },
          fecha_hora: new Date().toISOString(),
        });

      if (auditError) {
        console.error('Error writing audit log for password change:', auditError);
      }

      return {
        success: true,
        message: 'Contraseña actualizada correctamente',
        usuario: targetName
      };

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error changing user password:', error);
      throw new InternalServerErrorException('Error al cambiar contraseña');
    }
  }

  // =====================================================
  // GESTIÓN DE DOCUMENTOS
  // =====================================================

  /**
   * Obtener todos los documentos agrupados por paciente
   */
  async getDocumentsByPatient(filters?: {
    pacienteId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      // 1. Construir query de documentos
      let query = this.supabase
        .from('documentos_clinicos')
        .select(
          `
          id,
          url_almacenamiento,
          nombre_archivo,
          tipo_archivo,
          fecha_subida,
          cita_id
        `,
        )
        .order('fecha_subida', { ascending: false });

      // Aplicar filtros de fecha si existen
      if (filters?.startDate) {
        query = query.gte('fecha_subida', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('fecha_subida', filters.endDate);
      }

      const { data: documentos, error } = await query;

      if (error) {
        console.error('Error fetching documents:', error);
        throw new InternalServerErrorException('Error al obtener documentos');
      }

      if (!documentos || documentos.length === 0) {
        return { pacientes: [], totalDocumentos: 0, totalPacientes: 0 };
      }

      // 2. Obtener IDs únicos de citas
      const citaIds = [
        ...new Set(documentos.map((d) => d.cita_id).filter(Boolean)),
      ];

      // 3. Obtener información de citas (incluyendo podólogo)
      const { data: citas } = await this.supabase
        .from('cita')
        .select('id, fecha_hora_inicio, paciente_id, podologo_id')
        .in('id', citaIds);

      // Crear mapa de citas
      const citasMap = new Map(citas?.map((c) => [c.id, c]) || []);

      // 4. Obtener IDs únicos de pacientes y podólogos
      const pacienteIds = [
        ...new Set(citas?.map((c) => c.paciente_id).filter(Boolean) || []),
      ];
      const podologoIds = [
        ...new Set(citas?.map((c) => c.podologo_id).filter(Boolean) || []),
      ];

      // 5. Obtener información de pacientes y podólogos
      const { data: pacientes } = await this.supabase
        .from('paciente')
        .select('usuario_id, nombres, apellidos, cedula, email')
        .in('usuario_id', pacienteIds);

      const { data: podologos } = await this.supabase
        .from('podologo')
        .select('usuario_id, nombres, apellidos')
        .in('usuario_id', podologoIds);

      // Crear mapas
      const pacientesMap = new Map(
        pacientes?.map((p) => [p.usuario_id, p]) || [],
      );
      const podologosMap = new Map(
        podologos?.map((p) => [p.usuario_id, p]) || [],
      );

      // 6. Agrupar documentos por paciente
      const pacientesDocsMap = new Map<
        string,
        {
          paciente: {
            usuario_id: string;
            nombres: string;
            apellidos: string;
            cedula: string;
            email: string;
          };
          documentos: any[];
          totalDocumentos: number;
        }
      >();

      documentos.forEach((doc) => {
        const cita = citasMap.get(doc.cita_id);
        if (!cita) return;

        const paciente = pacientesMap.get(cita.paciente_id);
        if (!paciente) return;

        const podologo = podologosMap.get(cita.podologo_id);

        const pacienteId = paciente.usuario_id;

        // Filtrar por paciente si se especifica
        if (filters?.pacienteId && pacienteId !== filters.pacienteId) {
          return;
        }

        // Filtrar por búsqueda (nombre, apellido, cédula, nombre archivo, nombre podólogo)
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          const podologoNombre = podologo
            ? `${podologo.nombres} ${podologo.apellidos}`.toLowerCase()
            : '';

          const matchesSearch =
            paciente.nombres?.toLowerCase().includes(searchLower) ||
            paciente.apellidos?.toLowerCase().includes(searchLower) ||
            paciente.cedula?.toLowerCase().includes(searchLower) ||
            doc.nombre_archivo?.toLowerCase().includes(searchLower) ||
            podologoNombre.includes(searchLower);

          if (!matchesSearch) return;
        }

        if (!pacientesDocsMap.has(pacienteId)) {
          pacientesDocsMap.set(pacienteId, {
            paciente: {
              usuario_id: paciente.usuario_id,
              nombres: paciente.nombres,
              apellidos: paciente.apellidos,
              cedula: paciente.cedula,
              email: paciente.email,
            },
            documentos: [],
            totalDocumentos: 0,
          });
        }

        const pacienteData = pacientesDocsMap.get(pacienteId)!;
        pacienteData.documentos.push({
          id: doc.id,
          url_almacenamiento: doc.url_almacenamiento,
          nombre_archivo: doc.nombre_archivo,
          tipo_archivo: doc.tipo_archivo,
          fecha_subida: doc.fecha_subida,
          cita_id: doc.cita_id,
          fecha_cita: cita.fecha_hora_inicio,
          podologo_nombre: podologo
            ? `Dr. ${podologo.nombres} ${podologo.apellidos}`
            : 'Desconocido',
        });
        pacienteData.totalDocumentos++;
      });

      // 7. Convertir Map a Array y ordenar por cantidad de documentos
      const pacientesArray = Array.from(pacientesDocsMap.values()).sort(
        (a, b) => b.totalDocumentos - a.totalDocumentos,
      );

      const totalDocumentos = pacientesArray.reduce(
        (sum, p) => sum + p.totalDocumentos,
        0,
      );

      return {
        pacientes: pacientesArray,
        totalDocumentos,
        totalPacientes: pacientesArray.length,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      console.error('Error in getDocumentsByPatient:', error);
      throw new InternalServerErrorException('Error al obtener documentos');
    }
  }

  /**
   * Obtener estadísticas de documentos
   */
  async getDocumentStats() {
    try {
      // Total documentos
      const { count: totalDocs } = await this.supabase
        .from('documentos_clinicos')
        .select('*', { count: 'exact', head: true });

      // Documentos por tipo
      const { data: docsByType } = await this.supabase
        .from('documentos_clinicos')
        .select('tipo_archivo');

      const tiposCount: Record<string, number> = {};
      docsByType?.forEach((doc: any) => {
        const tipo = doc.tipo_archivo || 'Desconocido';
        tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
      });

      // Pacientes con documentos - obtener cita_ids primero
      const { data: docsWithCita } = await this.supabase
        .from('documentos_clinicos')
        .select('cita_id');

      const citaIds = [...new Set(docsWithCita?.map(d => d.cita_id).filter(Boolean) || [])];

      let pacientesUnicos = new Set<string>();
      if (citaIds.length > 0) {
        const { data: citas } = await this.supabase
          .from('cita')
          .select('paciente_id')
          .in('id', citaIds);

        pacientesUnicos = new Set(citas?.map(c => c.paciente_id).filter(Boolean) || []);
      }

      return {
        totalDocumentos: totalDocs || 0,
        pacientesConDocumentos: pacientesUnicos.size,
        documentosPorTipo: tiposCount,
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      return {
        totalDocumentos: 0,
        pacientesConDocumentos: 0,
        documentosPorTipo: {},
      };
    }
  }
}
