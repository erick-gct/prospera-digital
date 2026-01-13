import { SupabaseClient } from '@supabase/supabase-js';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Registra un evento de auditoría directamente en la base de datos.
 * Incluye el nombre del usuario para evitar problemas de lookup con RLS.
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  params: {
    tabla: string;
    registroId: string | number;
    accion: AuditAction;
    usuarioId: string | null | undefined;
    usuarioNombre?: string | null;
    datosAnteriores?: Record<string, unknown> | null;
    datosNuevos?: Record<string, unknown> | null;
  },
): Promise<void> {
  const {
    tabla,
    registroId,
    accion,
    usuarioId,
    usuarioNombre,
    datosAnteriores,
    datosNuevos,
  } = params;

  try {
    // Incluimos el nombre del usuario en datos_nuevos para que quede guardado
    const datosConUsuario = {
      ...datosNuevos,
      _audit_usuario_nombre: usuarioNombre || null,
    };

    const { error } = await supabase.from('auditoria_cambios').insert({
      tabla_afectada: tabla,
      registro_id: String(registroId),
      accion,
      usuario_id: usuarioId || null,
      datos_anteriores: datosAnteriores || null,
      datos_nuevos: datosConUsuario,
      fecha_hora: new Date().toISOString(),
    });

    if (error) {
      console.error('[Audit] Error logging audit event:', error);
    } else {
      console.log(
        `[Audit] Logged ${accion} on ${tabla}:${registroId} by ${usuarioNombre || usuarioId || 'unknown'}`,
      );
    }
  } catch (error) {
    console.error('[Audit] Exception logging audit event:', error);
  }
}
