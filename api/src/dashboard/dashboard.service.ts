import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DashboardService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  /**
   * Obtener estadísticas del dashboard para un paciente
   */
  async getPatientDashboard(userId: string) {
    // 1. Próxima cita (la más próxima con estado "Reservada")
    const ahora = new Date().toISOString();
    const { data: proximaCita } = await this.supabase
      .from('cita')
      .select(`
        id,
        fecha_hora_inicio,
        motivo_cita,
        podologo_id,
        estado_cita (
          id,
          nombre
        )
      `)
      .eq('paciente_id', userId)
      .eq('estado_id', 1) // Reservada
      .gte('fecha_hora_inicio', ahora)
      .order('fecha_hora_inicio', { ascending: true })
      .limit(1)
      .single();

    // Obtener nombre del podólogo de la próxima cita
    let podologoNombre: string | null = null;
    if (proximaCita?.podologo_id) {
      const { data: podologo } = await this.supabase
        .from('podologo')
        .select('nombres, apellidos')
        .eq('usuario_id', proximaCita.podologo_id)
        .single();
      if (podologo) {
        podologoNombre = `Dr. ${podologo.nombres} ${podologo.apellidos}`;
      }
    }

    // 2. Estadísticas de citas
    const { count: totalCitas } = await this.supabase
      .from('cita')
      .select('id', { count: 'exact', head: true })
      .eq('paciente_id', userId);

    const { count: completadas } = await this.supabase
      .from('cita')
      .select('id', { count: 'exact', head: true })
      .eq('paciente_id', userId)
      .eq('estado_id', 2); // Completada

    const { count: reservadas } = await this.supabase
      .from('cita')
      .select('id', { count: 'exact', head: true })
      .eq('paciente_id', userId)
      .eq('estado_id', 1); // Reservada

    const { count: canceladas } = await this.supabase
      .from('cita')
      .select('id', { count: 'exact', head: true })
      .eq('paciente_id', userId)
      .eq('estado_id', 3); // Cancelada

    // 3. Obtener IDs de citas del paciente para contar documentos y recetas
    const { data: citasIds, error: citasError } = await this.supabase
      .from('cita')
      .select('id')
      .eq('paciente_id', userId);

    console.log('Dashboard Debug - userId:', userId);
    console.log('Dashboard Debug - citasIds:', citasIds);
    console.log('Dashboard Debug - citasError:', citasError);
    console.log('Dashboard Debug - proximaCita:', proximaCita);

    const citaIdList = (citasIds || []).map(c => c.id);

    // 4. Contar documentos clínicos
    let documentosCount = 0;
    if (citaIdList.length > 0) {
      const { count } = await this.supabase
        .from('documentos_clinicos')
        .select('id', { count: 'exact', head: true })
        .in('cita_id', citaIdList);
      documentosCount = count || 0;
    }

    // 5. Contar recetas
    let recetasCount = 0;
    if (citaIdList.length > 0) {
      const { count } = await this.supabase
        .from('receta')
        .select('id', { count: 'exact', head: true })
        .in('cita_id', citaIdList);
      recetasCount = count || 0;
    }

    // 6. Contar ortesis
    let ortesisCount = 0;
    if (citaIdList.length > 0) {
      const { count } = await this.supabase
        .from('gestion_ortesis')
        .select('id', { count: 'exact', head: true })
        .in('cita_id', citaIdList);
      ortesisCount = count || 0;
    }

    // 7. Última evaluación de pies (de la última cita actualizada, Reservada o Completada)
    let ultimaEvaluacion: {
      pieIzquierdo: { tipo: string | null; notas: string | null };
      pieDerecho: { tipo: string | null; notas: string | null };
    } | null = null;
    const { data: ultimaCita } = await this.supabase
      .from('cita')
      .select('id')
      .eq('paciente_id', userId)
      .in('estado_id', [1, 2]) // Reservada o Completada (no cancelada)
      .order('fecha_modificacion', { ascending: false })
      .limit(1)
      .single();

    console.log('Dashboard Debug - ultimaCita para evaluación:', ultimaCita);

    if (ultimaCita) {
      const { data: evaluacion } = await this.supabase
        .from('ficha_evaluacion')
        .select('tipo_pie_izq, pi_notas, tipo_pie_der, pd_notas')
        .eq('cita_id', ultimaCita.id)
        .single();

      if (evaluacion) {
        ultimaEvaluacion = {
          pieIzquierdo: {
            tipo: evaluacion.tipo_pie_izq,
            notas: evaluacion.pi_notas,
          },
          pieDerecho: {
            tipo: evaluacion.tipo_pie_der,
            notas: evaluacion.pd_notas,
          },
        };
      }
    }

    // 8. Datos del paciente
    const { data: paciente } = await this.supabase
      .from('paciente')
      .select('nombres, apellidos')
      .eq('usuario_id', userId)
      .single();

    return {
      paciente: paciente ? {
        nombres: paciente.nombres,
        apellidos: paciente.apellidos,
      } : null,
      proximaCita: proximaCita ? {
        ...proximaCita,
        podologo_nombre: podologoNombre,
      } : null,
      estadisticas: {
        totalCitas: totalCitas || 0,
        completadas: completadas || 0,
        reservadas: reservadas || 0,
        canceladas: canceladas || 0,
      },
      documentos: documentosCount,
      recetas: recetasCount,
      ortesis: ortesisCount,
      ultimaEvaluacion,
    };
  }
}
