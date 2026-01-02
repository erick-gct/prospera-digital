import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuditService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  /**
   * Verificar contraseña del usuario usando Supabase Auth
   */
  async verifyPassword(email: string, password: string) {
    try {
      // Intentar hacer login con las credenciales
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        throw new UnauthorizedException('Contraseña incorrecta');
      }

      // Verificar que el usuario sea podólogo
      const { data: podologo } = await this.supabase
        .from('podologo')
        .select('usuario_id')
        .eq('usuario_id', data.user.id)
        .single();

      if (!podologo) {
        throw new UnauthorizedException('Solo podólogos pueden acceder a auditoría');
      }

      return { success: true, message: 'Contraseña verificada' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error al verificar credenciales');
    }
  }

  /**
   * Obtener logs de auditoría
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

      // Primero intentar obtener el nombre guardado en datos_nuevos
      if (log.datos_nuevos && log.datos_nuevos._audit_usuario_nombre) {
        usuarioNombre = log.datos_nuevos._audit_usuario_nombre;
      }
      // Si no hay nombre guardado pero hay usuario_id, mostrar ID parcial
      else if (log.usuario_id) {
        usuarioNombre = `Usuario ${log.usuario_id.substring(0, 8)}...`;
      }

      return {
        ...log,
        usuario_nombre: usuarioNombre,
      };
    });

    return enrichedLogs;
  }

  /**
   * Obtener historial de accesos
   */
  async getLoginHistory(limit = 50) {
    const { data, error } = await this.supabase
      .from('historial_acceso')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching login history:', error);
      return [];
    }

    // Enriquecer con nombres de usuario
    const enrichedHistory = await Promise.all(
      (data || []).map(async (entry) => {
        let usuarioNombre = 'Usuario';

        if (entry.usuario_id) {
          const { data: podologo } = await this.supabase
            .from('podologo')
            .select('nombres, apellidos')
            .eq('usuario_id', entry.usuario_id)
            .single();

          if (podologo) {
            usuarioNombre = `${podologo.nombres} ${podologo.apellidos}`;
          } else {
            const { data: paciente } = await this.supabase
              .from('paciente')
              .select('nombres, apellidos')
              .eq('usuario_id', entry.usuario_id)
              .single();

            if (paciente) {
              usuarioNombre = `${paciente.nombres} ${paciente.apellidos}`;
            }
          }
        }

        return {
          ...entry,
          usuario_nombre: usuarioNombre,
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
      .select('tabla_afectada')
      .order('tabla_afectada');

    if (error) {
      console.error('Error fetching tables:', error);
      return [];
    }

    // Obtener tablas únicas
    const uniqueTables = [...new Set((data || []).map((d) => d.tabla_afectada))];

    // Mapear a nombres amigables
    const tableLabels: Record<string, string> = {
      cita: 'Citas',
      paciente: 'Pacientes',
      podologo: 'Podólogos',
      receta: 'Recetas',
      detalles_receta: 'Detalles de Receta',
      documentos_clinicos: 'Documentos Clínicos',
      ficha_evaluacion: 'Evaluaciones',
      gestion_ortesis: 'Órtesis',
      log_notificaciones: 'Notificaciones',
    };

    return uniqueTables.map((table) => ({
      id: table,
      label: tableLabels[table] || table,
    }));
  }
}
