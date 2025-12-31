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

  /**
   * Obtener estadísticas del dashboard para un podólogo
   */
  async getPodologoDashboard(userId: string, month?: number, year?: number) {
    // Usar mes/año actual si no se especifica
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    // Calcular inicio y fin del mes
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // 1. Datos del podólogo
    const { data: podologo } = await this.supabase
      .from('podologo')
      .select('nombres, apellidos')
      .eq('usuario_id', userId)
      .single();

    // 2. Estadísticas de citas del mes
    const { count: totalCitas } = await this.supabase
      .from('cita')
      .select('id', { count: 'exact', head: true })
      .eq('podologo_id', userId)
      .gte('fecha_hora_inicio', startOfMonth.toISOString())
      .lte('fecha_hora_inicio', endOfMonth.toISOString());

    const { count: completadas } = await this.supabase
      .from('cita')
      .select('id', { count: 'exact', head: true })
      .eq('podologo_id', userId)
      .eq('estado_id', 2)
      .gte('fecha_hora_inicio', startOfMonth.toISOString())
      .lte('fecha_hora_inicio', endOfMonth.toISOString());

    const { count: reservadas } = await this.supabase
      .from('cita')
      .select('id', { count: 'exact', head: true })
      .eq('podologo_id', userId)
      .eq('estado_id', 1)
      .gte('fecha_hora_inicio', startOfMonth.toISOString())
      .lte('fecha_hora_inicio', endOfMonth.toISOString());

    const { count: canceladas } = await this.supabase
      .from('cita')
      .select('id', { count: 'exact', head: true })
      .eq('podologo_id', userId)
      .eq('estado_id', 3)
      .gte('fecha_hora_inicio', startOfMonth.toISOString())
      .lte('fecha_hora_inicio', endOfMonth.toISOString());

    // 3. Pacientes activos e inactivos (de todos los tiempos)
    const { count: pacientesActivos } = await this.supabase
      .from('paciente')
      .select('usuario_id', { count: 'exact', head: true })
      .eq('estado_paciente_id', 1); // Activo

    const { count: pacientesInactivos } = await this.supabase
      .from('paciente')
      .select('usuario_id', { count: 'exact', head: true })
      .eq('estado_paciente_id', 2); // Inactivo

    const { count: pacientesTotal } = await this.supabase
      .from('paciente')
      .select('usuario_id', { count: 'exact', head: true });

    // 4. Documentos y recetas del mes
    // Primero obtener IDs de citas del mes
    const { data: citasDelMes } = await this.supabase
      .from('cita')
      .select('id')
      .eq('podologo_id', userId)
      .gte('fecha_hora_inicio', startOfMonth.toISOString())
      .lte('fecha_hora_inicio', endOfMonth.toISOString());

    const citaIdsMes = (citasDelMes || []).map(c => c.id);

    let documentosMes = 0;
    let recetasMes = 0;
    if (citaIdsMes.length > 0) {
      const { count: docsCount } = await this.supabase
        .from('documentos_clinicos')
        .select('id', { count: 'exact', head: true })
        .in('cita_id', citaIdsMes);
      documentosMes = docsCount || 0;

      const { count: recetasCount } = await this.supabase
        .from('receta')
        .select('id', { count: 'exact', head: true })
        .in('cita_id', citaIdsMes);
      recetasMes = recetasCount || 0;
    }

    // 5. Última cita modificada (global, no solo del mes)
    const { data: ultimaCitaModificada } = await this.supabase
      .from('cita')
      .select(`
        id,
        fecha_hora_inicio,
        fecha_modificacion,
        motivo_cita,
        paciente_id,
        estado_cita (nombre)
      `)
      .eq('podologo_id', userId)
      .order('fecha_modificacion', { ascending: false })
      .limit(1)
      .single();

    // Obtener nombre del paciente de la última cita modificada
    let ultimaCitaPaciente: string | null = null;
    if (ultimaCitaModificada?.paciente_id) {
      const { data: paciente } = await this.supabase
        .from('paciente')
        .select('nombres, apellidos')
        .eq('usuario_id', ultimaCitaModificada.paciente_id)
        .single();
      if (paciente) {
        ultimaCitaPaciente = `${paciente.nombres} ${paciente.apellidos}`;
      }
    }

    // 5. Último paciente atendido (última cita completada)
    const { data: ultimaCitaCompletada } = await this.supabase
      .from('cita')
      .select('paciente_id, fecha_hora_inicio')
      .eq('podologo_id', userId)
      .eq('estado_id', 2) // Completada
      .order('fecha_hora_inicio', { ascending: false })
      .limit(1)
      .single();

    let ultimoPacienteAtendido: { nombre: string; fecha: string } | null = null;
    if (ultimaCitaCompletada?.paciente_id) {
      const { data: paciente } = await this.supabase
        .from('paciente')
        .select('nombres, apellidos')
        .eq('usuario_id', ultimaCitaCompletada.paciente_id)
        .single();
      if (paciente) {
        ultimoPacienteAtendido = {
          nombre: `${paciente.nombres} ${paciente.apellidos}`,
          fecha: ultimaCitaCompletada.fecha_hora_inicio,
        };
      }
    }

    // 6. Citas de hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: citasHoy } = await this.supabase
      .from('cita')
      .select('id', { count: 'exact', head: true })
      .eq('podologo_id', userId)
      .gte('fecha_hora_inicio', todayStart.toISOString())
      .lte('fecha_hora_inicio', todayEnd.toISOString())
      .in('estado_id', [1, 2]); // Reservada o Completada

    return {
      podologo: podologo ? {
        nombres: podologo.nombres,
        apellidos: podologo.apellidos,
      } : null,
      mesSeleccionado: {
        month: targetMonth,
        year: targetYear,
      },
      estadisticas: {
        totalCitas: totalCitas || 0,
        completadas: completadas || 0,
        reservadas: reservadas || 0,
        canceladas: canceladas || 0,
      },
      pacientes: {
        total: pacientesTotal || 0,
        activos: pacientesActivos || 0,
        inactivos: pacientesInactivos || 0,
      },
      documentosMes,
      recetasMes,
      citasHoy: citasHoy || 0,
      ultimaCitaModificada: ultimaCitaModificada ? {
        ...ultimaCitaModificada,
        paciente_nombre: ultimaCitaPaciente,
      } : null,
      ultimoPacienteAtendido,
    };
  }
}

