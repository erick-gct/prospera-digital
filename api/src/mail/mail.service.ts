import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromAddress = this.configService.get<string>('MAIL_FROM_ADDRESS') || 'onboarding@resend.dev';
    
    if (!apiKey) {
      console.warn('⚠️ ADVERTENCIA: RESEND_API_KEY no está definida. Los correos no se enviarán.');
    }

    this.resend = new Resend(apiKey);
  }

  /**
   * Envía un correo genérico
   */
  async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const data = await this.resend.emails.send({
        from: `Prospera Digital <${this.fromAddress}>`,
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      console.log(`(Mail) Correo enviado a ${to}. ID: ${data.data?.id}`);
      return data;
    } catch (error) {
      console.error('(Mail) Error enviando correo:', error);
      // No lanzamos error para no detener el flujo principal de la app (ej: registro)
      // pero lo registramos.
      return null;
    }
  }

  /**
   * Plantilla HTML base para que se vea profesional
   */
  private getHtmlTemplate(title: string, body: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background-color: #2563EB; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; color: #333333; line-height: 1.6; }
          .footer { background-color: #f4f4f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 10px 20px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
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
   * (FUTURO) Enviar confirmación de cita
   */
  async sendAppointmentConfirmation(email: string, nombre: string, fecha: string, hora: string) {
    const title = 'Confirmación de Cita';
    const body = `
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu cita ha sido confirmada con éxito.</p>
      <ul>
        <li><strong>Fecha:</strong> ${fecha}</li>
        <li><strong>Hora:</strong> ${hora}</li>
        <li><strong>Especialista:</strong> Dr. Marlon Vera</li>
      </ul>
      <p>Por favor, llega 10 minutos antes.</p>
    `;
    
    const html = this.getHtmlTemplate(title, body);
    return this.sendEmail(email, 'Cita Confirmada - Prospera Digital', html);
  }
}