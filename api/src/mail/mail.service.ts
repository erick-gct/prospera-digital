import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tipos para el logging
type TipoNotificacion = 'reserva' | 'reagendamiento' | 'cancelacion';
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

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromAddress =
      this.configService.get<string>('MAIL_FROM_ADDRESS') ||
      'onboarding@resend.dev';

    if (!apiKey) {
      console.warn(
        '⚠️ ADVERTENCIA: RESEND_API_KEY no está definida. Los correos no se enviarán.',
      );
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
   * Registrar notificación en log_notificaciones
   */
  private async logNotification(data: NotificationLogData) {
    try {
      await this.supabase.from('log_notificaciones').insert(data);
    } catch (error) {
      console.error('Error al registrar log de notificación:', error);
    }
  }

  /**
   * Envía un correo genérico
   * NOTA: Si existe MAIL_PRUEBA en .env, se usará ese email como destinatario para pruebas
   */
  async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      // MODO PRUEBA: Si existe MAIL_PRUEBA, usar ese email en lugar del dinámico
      const mailPrueba = this.configService.get<string>('MAIL_PRUEBA');
      const destinatario = mailPrueba || to;

      if (mailPrueba) {
        console.log(
          `(Mail) MODO PRUEBA: Enviando a ${mailPrueba} (original: ${to})`,
        );
      }

      const data = await this.resend.emails.send({
        from: `Prospera Digital <${this.fromAddress}>`,
        to: [destinatario],
        subject: subject,
        html: htmlContent,
      });

      console.log(
        `(Mail) Correo enviado a ${destinatario}. ID: ${data.data?.id}`,
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
            <p>© ${new Date().getFullYear()} Prospera Digital LLC. Todos los derechos reservados.</p>
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
    const title = '¡Bienvenido a Prospera Digital!';
    const body = `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Gracias por registrarte en nuestro sistema de gestión podológica.</p>
      <p>Tu cuenta ha sido creada exitosamente. Ahora puedes agendar tus citas y revisar tu historial médico en línea.</p>
      <center>
        <a href="http://localhost:3000/login" class="button" style="color: white;">Ingresar al Sistema</a>
      </center>
    `;

    const html = this.getHtmlTemplate(title, body);
    return this.sendEmail(email, 'Bienvenido a Prospera Digital', html);
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
  ) {
    const fechaCreacion = new Date().toISOString();

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
    const result = await this.sendEmail(
      email,
      'Cita Confirmada - Prospera Digital',
      html,
    );

    // Registrar en log si tenemos la info necesaria
    if (citaId && destinatarioId) {
      await this.logNotification({
        cita_id: citaId,
        destinatario_id: destinatarioId,
        tipo_notificacion: 'reserva',
        estado: result.success ? 'enviado' : 'fallido',
        fecha_creacion: fechaCreacion,
        fecha_envio: result.success ? new Date().toISOString() : null,
        error_mensaje: result.success
          ? null
          : result.error || 'Error desconocido',
      });
    }

    return result;
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
  ) {
    const fechaCreacion = new Date().toISOString();

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
    const result = await this.sendEmail(
      email,
      'Cita Reagendada - Prospera Digital',
      html,
    );

    // Registrar en log
    await this.logNotification({
      cita_id: citaId,
      destinatario_id: destinatarioId,
      tipo_notificacion: 'reagendamiento',
      estado: result.success ? 'enviado' : 'fallido',
      fecha_creacion: fechaCreacion,
      fecha_envio: result.success ? new Date().toISOString() : null,
      error_mensaje: result.success
        ? null
        : result.error || 'Error desconocido',
    });

    return result;
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
  ) {
    const fechaCreacion = new Date().toISOString();

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
        <a href="http://localhost:3000/citas" class="button" style="color: white;">Agendar Nueva Cita</a>
      </center>
    `;

    const html = this.getHtmlTemplate(title, body, '#ef4444');
    const result = await this.sendEmail(
      email,
      'Cita Cancelada - Prospera Digital',
      html,
    );

    // Registrar en log
    await this.logNotification({
      cita_id: citaId,
      destinatario_id: destinatarioId,
      tipo_notificacion: 'cancelacion',
      estado: result.success ? 'enviado' : 'fallido',
      fecha_creacion: fechaCreacion,
      fecha_envio: result.success ? new Date().toISOString() : null,
      error_mensaje: result.success
        ? null
        : result.error || 'Error desconocido',
    });

    return result;
  }
}
