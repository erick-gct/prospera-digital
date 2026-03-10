import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logAuditEvent } from '../common/audit-context';

// Tipos para el logging
type TipoNotificacion = 'reserva' | 'reagendamiento' | 'cancelacion' | 'ausencia';

// ... (existing code)




type EstadoNotificacion = 'enviado' | 'fallido';

interface NotificationLogData {
  cita_id: number;
  destinatario_id: string;
  tipo_notificacion: TipoNotificacion;
  estado: EstadoNotificacion;
  fecha_creacion: string;
  fecha_envio: string | null;
  error_mensaje: string | null;
}

@Injectable()
export class MailService {
  private resend: Resend;
  private fromAddress: string;
  private supabase: SupabaseClient;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromAddress =
      this.configService.get<string>('MAIL_FROM_ADDRESS') ||
      'team@prospira.vip';

    const env = this.configService.get<string>('NODE_ENV');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    this.baseUrl = frontendUrl || (env === 'production' ? 'https://prospira.vip' : 'http://localhost:3000');

    if (!apiKey) {
      console.warn(
        '⚠️ ADVERTENCIA: RESEND_API_KEY no está definida. Los correos no se enviarán.',
      );
    } else {
      console.log(`(Mail) Servicio iniciado. Base URL: ${this.baseUrl}`);
    }

    this.resend = new Resend(apiKey);

    // Inicializar cliente Supabase para logging
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  /**
   * Enviar notificación de AUSENCIA de paciente
   */
  async sendAppointmentAbsenceEmail(
    email: string,
    nombrePaciente: string,
    fecha: string,
    hora: string,
    nombrePodologo: string,
    citaId: number,
    destinatarioId: string,
    podologoEmail?: string,
  ) {
    const fechaCreacion = new Date().toISOString();

    // 1. Correo Paciente (Aviso cortés)
    const title = 'Te extrañamos en tu cita';
    const body = `
      <p>Hola <strong>${nombrePaciente}</strong>,</p>
      <p>Notamos que no pudiste asistir a tu cita programada para hoy.</p>
      <div class="warning" style="background-color: #fff7ed; border-left-color: #f97316;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li>📅 <strong>Fecha:</strong> ${fecha}</li>
          <li>🕐 <strong>Hora:</strong> ${hora}</li>
          <li>👨‍⚕️ <strong>Especialista:</strong> ${nombrePodologo}</li>
        </ul>
      </div>
      <p>Entendemos que pueden surgir imprevistos. Sin embargo, tu salud podológica es nuestra prioridad.</p>
      <p>Por favor, <strong>reprograma tu cita lo antes posible</strong> para continuar con tu tratamiento.</p>
      <center>
        <a href="${this.baseUrl}/citas" class="button" style="background-color: #f97316; color: white;">Reprogramar Cita</a>
      </center>
    `;

    const html = this.getHtmlTemplate(title, body, '#f97316'); // Orange
    const resultPaciente = await this.sendEmail(
      email,
      'No asististe a tu cita - Prospira Digital',
      html,
    );

    // 2. Correo Podólogo (Reporte)
    if (podologoEmail) {
      const bodyPodologo = `
         <p>El paciente ha sido marcado como <strong>AUSENTE</strong>.</p>
         <div class="card" style="border-left-color: #f97316; background: #fff7ed;">
           <div style="margin-bottom: 5px;"><strong>📅 Fecha:</strong> ${fecha}</div>
           <div style="margin-bottom: 5px;"><strong>🕐 Hora:</strong> ${hora}</div>
           <div style="margin-top: 10px; font-size: 13px; color: #c2410c;">
             <em>Se ha enviado un correo al paciente invitándole a reagendar.</em>
           </div>
         </div>
        `;

      const htmlPodologo = this.getPodologistHtmlTemplate(
        'Paciente Ausente',
        bodyPodologo,
        nombrePaciente,
        '#f97316' // Orange
      );

      await this.sendEmail(
        podologoEmail,
        `AUSENCIA: ${nombrePaciente} - ${fecha}`,
        htmlPodologo
      );
    }

    // Registrar en log
    await this.logNotification({
      cita_id: citaId,
      destinatario_id: destinatarioId,
      tipo_notificacion: 'ausencia',
      estado: resultPaciente.success ? 'enviado' : 'fallido',
      fecha_creacion: fechaCreacion,
      fecha_envio: resultPaciente.success ? new Date().toISOString() : null,
      error_mensaje: resultPaciente.success
        ? null
        : resultPaciente.error || 'Error desconocido',
    });

    return resultPaciente;
  }

  /**
   * Registrar notificación en log_notificaciones
   */
  private async logNotification(data: NotificationLogData) {
    try {
      const { data: logEntry, error } = await this.supabase
        .from('log_notificaciones')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error insertando log_notificaciones:', error);
        return;
      }

      // Auditoría del registro de notificación
      if (logEntry) {
        await logAuditEvent(this.supabase, {
          tabla: 'log_notificaciones',
          registroId: logEntry.id,
          accion: 'INSERT',
          usuarioId: null, // Sistema
          datosNuevos: data as unknown as Record<string, unknown>,
        });
      }
    } catch (error) {
      console.error('Error al registrar log de notificación:', error);
    }
  }

  /**
   * Envía correo de recuperación de contraseña
   */
  async sendPasswordRecoveryEmail(to: string, resetLink: string, userName: string = 'Usuario') {
    const subject = 'Recuperación de Contraseña - Prospira Digital';
    const htmlContent = this.getHtmlTemplate(
      'Recupera tu Acceso',
      `
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este correo.</p>
      <p>Para crear una nueva contraseña, haz clic en el siguiente enlace:</p>
      <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" class="button" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Restablecer Contraseña</a>
      </div>
      <p style="font-size: 12px; color: #666;">O copia y pega este enlace en tu navegador:</p>
      <p style="font-size: 12px; color: #666; word-break: break-all;">${resetLink}</p>
      <p class="warning">Este enlace expirará en 1 hora por seguridad.</p>
      `
    );

    return this.sendEmail(to, subject, htmlContent);
  }

  /**
   * Envía un correo genérico
   * NOTA: Si existe MAIL_PRUEBA en .env, se usará ese email como destinatario para pruebas
   */
  async sendEmail(to: string | string[], subject: string, htmlContent: string) {
    try {
      // MODO PRUEBA: (Desactivado por código para producción)
      // const mailPrueba = this.configService.get<string>('MAIL_PRUEBA');

      const destinatarios = Array.isArray(to) ? to : [to];

      console.log(`(Mail) Enviando a: ${destinatarios.join(', ')}`);

      const data = await this.resend.emails.send({
        from: `Prospira Digital <${this.fromAddress}>`,
        to: destinatarios,
        subject: subject,
        html: htmlContent,
      });

      console.log(
        `(Mail) Correo enviado a ${destinatarios.join(', ')}. ID: ${data.data?.id}`,
      );
      return { success: true, data };
    } catch (error) {
      console.error('(Mail) Error enviando correo:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Plantilla HTML base para que se vea profesional
   */
  private getHtmlTemplate(
    title: string,
    body: string,
    headerColor: string = '#2A9D8F',
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background-color: ${headerColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; color: #333333; line-height: 1.6; }
          .footer { background-color: #f4f4f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 10px 20px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .highlight { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #22c55e; }
          .warning { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b; }
          .danger { background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${body}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Prospira Digital LLC. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Plantilla HTML específica para PODÓLOGOS (Más técnica/administrativa)
   */
  private getPodologistHtmlTemplate(
    title: string,
    body: string,
    patientName: string,
    headerColor: string = '#1e293b', // Slate-800 for more professional look
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
          .header { background-color: ${headerColor}; color: white; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; }
          .header h1 { margin: 0; font-size: 18px; font-weight: 600; }
          .badge { background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .content { padding: 25px; color: #334155; line-height: 1.5; font-size: 14px; }
          .card { background: #f1f5f9; border-left: 4px solid ${headerColor}; padding: 15px; margin: 15px 0; border-radius: 0 4px 4px 0; }
          .patient-info { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }
          .avatar { width: 32px; height: 32px; background: #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; }
          .footer { background-color: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
          .btn-action { display: inline-block; padding: 8px 16px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 13px; margin-top: 10px;}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
            <span class="badge">Notificación del Sistema</span>
          </div>
          <div class="content">
            <div class="patient-info">
              <div class="avatar">${patientName.charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight: 600; color: #0f172a;">${patientName}</div>
                <div style="font-size: 12px; color: #64748b;">Paciente</div>
              </div>
            </div>
            
            ${body}

            <center>
             <a href="${this.baseUrl}/gestion-citas" class="btn-action">Gestionar en Plataforma</a>
            </center>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático del sistema de gestión Prospira Digital.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // --- MÉTODOS PREDEFINIDOS PARA TU SISTEMA ---

  /**
   * Enviar correo de Bienvenida al registrarse
   */
  async sendWelcomeEmail(email: string, nombre: string) {
    const title = '¡Bienvenido a Prospira Digital!';
    const body = `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Gracias por registrarte en nuestro sistema de gestión podológica.</p>
      <p>Tu cuenta ha sido creada exitosamente. Ahora puedes agendar tus citas y revisar tu historial clínico en línea.</p>
      <center>
        <a href="${this.baseUrl}/login" class="button" style="color: white;">Ingresar al Sistema</a>
      </center>
    `;

    const html = this.getHtmlTemplate(title, body);
    return this.sendEmail(email, 'Bienvenido a Prospira Digital', html);
  }

  /**
   * Enviar confirmación de cita (RESERVA)
   */
  async sendAppointmentConfirmation(
    email: string,
    nombrePaciente: string,
    fecha: string,
    hora: string,
    nombrePodologo: string,
    citaId?: number,
    destinatarioId?: string,
    podologoEmail?: string,
  ) {
    const fechaCreacion = new Date().toISOString();

    // 1. Correo al PACIENTE (Formato Amigable)
    const title = 'Confirmación de Cita';
    const body = `
      <p>Hola <strong>${nombrePaciente}</strong>,</p>
      <p>Tu cita ha sido confirmada con éxito.</p>
      <div class="highlight">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li>📅 <strong>Fecha:</strong> ${fecha}</li>
          <li>🕐 <strong>Hora:</strong> ${hora}</li>
          <li>👨‍⚕️ <strong>Especialista:</strong> ${nombrePodologo}</li>
        </ul>
      </div>
      <p>Por favor, llega 10 minutos antes de tu cita.</p>
      <p>Si necesitas reagendar o cancelar tu cita, puedes hacerlo desde tu cuenta en el sistema.</p>
    `;

    const html = this.getHtmlTemplate(title, body, '#2A9D8F');
    const resultPaciente = await this.sendEmail(
      email,
      'Cita Confirmada - Prospira Digital',
      html,
    );

    // 2. Correo al PODÓLOGO (Formato Profesional)
    if (podologoEmail) {
      const bodyPodologo = `
        <p>Se ha agendado una nueva cita.</p>
        <div class="card">
          <div style="margin-bottom: 5px;"><strong>📅 Fecha:</strong> ${fecha}</div>
          <div style="margin-bottom: 5px;"><strong>🕐 Hora:</strong> ${hora}</div>
          <div><strong>📌 Estado:</strong> Reservada</div>
        </div>
        <p style="font-size: 13px;">Revise la agenda para más detalles.</p>
       `;

      const htmlPodologo = this.getPodologistHtmlTemplate(
        'Nueva Cita Agendada',
        bodyPodologo,
        nombrePaciente,
        '#2A9D8F' // Teal para success
      );

      await this.sendEmail(
        podologoEmail,
        `Nueva Cita: ${nombrePaciente} - ${fecha} ${hora}`,
        htmlPodologo
      );
    }

    // Registrar en log (Preferiblemente del paciente que es el principal)
    if (citaId && destinatarioId) {
      await this.logNotification({
        cita_id: citaId,
        destinatario_id: destinatarioId,
        tipo_notificacion: 'reserva',
        estado: resultPaciente.success ? 'enviado' : 'fallido',
        fecha_creacion: fechaCreacion,
        fecha_envio: resultPaciente.success ? new Date().toISOString() : null,
        error_mensaje: resultPaciente.success
          ? null
          : resultPaciente.error || 'Error desconocido',
      });
    }

    return resultPaciente;
  }

  /**
   * Enviar notificación de reagendamiento de cita
   */
  async sendAppointmentReschedule(
    email: string,
    nombrePaciente: string,
    fechaAnterior: string,
    horaAnterior: string,
    fechaNueva: string,
    horaNueva: string,
    nombrePodologo: string,
    citaId: number,
    destinatarioId: string,
    podologoEmail?: string,
  ) {
    const fechaCreacion = new Date().toISOString();

    // 1. Correo Paciente
    const title = 'Cita Reagendada';
    const body = `
      <p>Hola <strong>${nombrePaciente}</strong>,</p>
      <p>Tu cita ha sido reagendada.</p>
      <div class="warning">
        <p style="margin: 0 0 10px 0;"><strong>📅 Nueva fecha y hora:</strong></p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li>📅 <strong>Fecha:</strong> ${fechaNueva}</li>
          <li>🕐 <strong>Hora:</strong> ${horaNueva}</li>
          <li>👨‍⚕️ <strong>Especialista:</strong> ${nombrePodologo}</li>
        </ul>
      </div>
      <p style="color: #666; font-size: 14px;">
        <em>Fecha anterior: ${fechaAnterior} a las ${horaAnterior}</em>
      </p>
      <p>Si tienes alguna duda o necesitas realizar otro cambio, contáctanos o ingresa a tu cuenta.</p>
    `;

    const html = this.getHtmlTemplate(title, body, '#f59e0b');
    const resultPaciente = await this.sendEmail(
      email,
      'Cita Reagendada - Prospira Digital',
      html,
    );

    // 2. Correo Podólogo
    if (podologoEmail) {
      const bodyPodologo = `
         <p>Una cita existente ha sido <strong>reprogramada</strong>.</p>
         <div class="card" style="border-left-color: #f59e0b;">
           <div style="margin-bottom: 8px;"><strong>📅 Nuevo Horario:</strong></div>
           <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
             ${fechaNueva} - ${horaNueva}
           </div>
           <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 13px; color: #64748b;">
             <span style="text-decoration: line-through;">Anterior: ${fechaAnterior} ${horaAnterior}</span>
           </div>
         </div>
        `;

      const htmlPodologo = this.getPodologistHtmlTemplate(
        'Cita Reprogramada',
        bodyPodologo,
        nombrePaciente,
        '#fbbf24' // Amber
      );

      await this.sendEmail(
        podologoEmail,
        `REAGENDADA: ${nombrePaciente} - Nueva: ${fechaNueva} ${horaNueva}`,
        htmlPodologo
      );
    }

    // Registrar en log
    await this.logNotification({
      cita_id: citaId,
      destinatario_id: destinatarioId,
      tipo_notificacion: 'reagendamiento',
      estado: resultPaciente.success ? 'enviado' : 'fallido',
      fecha_creacion: fechaCreacion,
      fecha_envio: resultPaciente.success ? new Date().toISOString() : null,
      error_mensaje: resultPaciente.success
        ? null
        : resultPaciente.error || 'Error desconocido',
    });

    return resultPaciente;
  }

  /**
   * Enviar notificación de cancelación de cita
   */
  async sendAppointmentCancellation(
    email: string,
    nombrePaciente: string,
    fecha: string,
    hora: string,
    nombrePodologo: string,
    motivoCancelacion: string | null,
    citaId: number,
    destinatarioId: string,
    podologoEmail?: string,
  ) {
    const fechaCreacion = new Date().toISOString();

    // 1. Correo Paciente
    const title = 'Cita Cancelada';
    const body = `
      <p>Hola <strong>${nombrePaciente}</strong>,</p>
      <p>Te informamos que tu cita ha sido cancelada.</p>
      <div class="danger">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li>📅 <strong>Fecha:</strong> ${fecha}</li>
          <li>🕐 <strong>Hora:</strong> ${hora}</li>
          <li>👨‍⚕️ <strong>Especialista:</strong> ${nombrePodologo}</li>
        </ul>
        ${motivoCancelacion ? `<p style="margin-top: 10px;"><strong>Motivo:</strong> ${motivoCancelacion}</p>` : ''}
      </div>
      <p>Si deseas agendar una nueva cita, puedes hacerlo desde tu cuenta en cualquier momento.</p>
      <center>
        <a href="${this.baseUrl}/citas" class="button" style="color: white;">Agendar Nueva Cita</a>
      </center>
    `;

    const html = this.getHtmlTemplate(title, body, '#ef4444');
    const resultPaciente = await this.sendEmail(
      email,
      'Cita Cancelada - Prospira Digital',
      html,
    );

    // 2. Correo Podólogo
    if (podologoEmail) {
      const bodyPodologo = `
         <p>Una cita ha sido <strong>CANCELADA</strong>.</p>
         <div class="card" style="border-left-color: #ef4444; background: #fef2f2;">
           <div style="margin-bottom: 5px;"><strong>📅 Fecha Original:</strong> ${fecha}</div>
           <div style="margin-bottom: 5px;"><strong>🕐 Hora Original:</strong> ${hora}</div>
           ${motivoCancelacion ? `<div style="margin-top: 10px; padding-top: 5px; border-top: 1px dashed #fca5a5;"><strong>Motivo:</strong> ${motivoCancelacion}</div>` : ''}
         </div>
         <p style="font-size: 13px;">El horario ha quedado libre en su agenda.</p>
        `;

      const htmlPodologo = this.getPodologistHtmlTemplate(
        'Cita Cancelada',
        bodyPodologo,
        nombrePaciente,
        '#ef4444' // Red
      );

      await this.sendEmail(
        podologoEmail,
        `CANCELADA: ${nombrePaciente} - ${fecha}`,
        htmlPodologo
      );
    }

    // Registrar en log
    await this.logNotification({
      cita_id: citaId,
      destinatario_id: destinatarioId,
      tipo_notificacion: 'cancelacion',
      estado: resultPaciente.success ? 'enviado' : 'fallido',
      fecha_creacion: fechaCreacion,
      fecha_envio: resultPaciente.success ? new Date().toISOString() : null,
      error_mensaje: resultPaciente.success
        ? null
        : resultPaciente.error || 'Error desconocido',
    });

    return resultPaciente;
  }

  /**
   * Enviar Receta Médica adjunta (PDF)
   */
  async sendPrescriptionEmail(
    email: string,
    nombrePaciente: string,
    pdfBuffer: Buffer,
    podologoNombre: string
  ) {
    const title = 'Tu Receta Médica';
    const body = `
      <p>Hola <strong>${nombrePaciente}</strong>,</p>
      <p>Adjunto encontrarás la receta médica generada tras tu consulta con el <strong>${podologoNombre}</strong>.</p>
      <p>Esperamos que te recuperes pronto.</p>
      <p>Si tienes dudas sobre el tratamiento, contacta con nosotros.</p>
    `;

    const html = this.getHtmlTemplate(title, body, '#2563EB'); // Azul

    try {
      console.log(`(Mail) Enviando receta a ${email}`);
      const data = await this.resend.emails.send({
        from: `Prospira Digital <${this.fromAddress}>`,
        to: [email],
        subject: 'Receta Médica - Prospira Digital',
        html: html,
        attachments: [
          {
            filename: 'Receta-Medica-ProspiraDigital.pdf',
            content: pdfBuffer,
          },
        ],
      });
      console.log(`(Mail) Receta enviada ID: ${data.data?.id}`);
      return { success: true, data };
    } catch (error) {
      console.error('(Mail) Error enviando receta:', error);
      return { success: false, error };
    }
  }
}
