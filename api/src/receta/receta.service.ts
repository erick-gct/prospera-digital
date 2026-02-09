import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

const PDFDocument = require('pdfkit');
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class RecetaService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  /**
   * Genera un PDF de la receta
   */
  async generateRecetaPdf(recetaId: number): Promise<Buffer> {
    // 1. Obtener datos de la receta
    const { data: receta, error: recetaError } = await this.supabase
      .from('receta')
      .select(
        `
        id,
        fecha_emision,
        diagnostico_receta,
        cita_id
      `,
      )
      .eq('id', recetaId)
      .single();

    if (recetaError || !receta) {
      throw new NotFoundException('Receta no encontrada');
    }

    // 2. Obtener medicamentos
    const { data: medicamentos } = await this.supabase
      .from('detalles_receta')
      .select('medicamento, dosis, indicaciones')
      .eq('receta_id', recetaId);

    // 3. Obtener datos de la cita (paciente y podólogo)
    const { data: cita } = await this.supabase
      .from('cita')
      .select(
        `
        paciente_id,
        podologo_id
      `,
      )
      .eq('id', receta.cita_id)
      .single();

    // 4. Obtener datos del paciente
    const { data: paciente } = await this.supabase
      .from('paciente')
      .select('nombres, apellidos, cedula')
      .eq('usuario_id', cita?.paciente_id)
      .single();

    // 5. Obtener datos del podólogo
    const { data: podologo } = await this.supabase
      .from('podologo')
      .select('nombres, apellidos, firma_url')
      .eq('usuario_id', cita?.podologo_id)
      .single();

    // 5.1 Descargar firma si existe
    let firmaBuffer: Buffer | null = null;
    if (podologo?.firma_url) {
      try {
        const response = await fetch(podologo.firma_url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          firmaBuffer = Buffer.from(arrayBuffer);
        }
      } catch (e) {
        console.error('Error descargando firma:', e);
      }
    }

    // 6. Generar PDF
    return this.createPdf({
      receta,
      medicamentos: medicamentos || [],
      paciente,
      podologo,
      firmaBuffer,
    });
  }

  private createPdf(data: {
    receta: any;
    medicamentos: any[];
    paciente: any;
    podologo: any;
    firmaBuffer: Buffer | null;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#2563EB';
      const grayColor = '#6B7280';

      // Logo path
      const logoPath = path.join(
        process.cwd(),
        '..',
        'client',
        'public',
        'assets',
        'logo',
        'logo-completo.png',
      );

      // Header con logo
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 80 });
          doc.moveDown();
        }
      } catch (e) {
        // Ignorar
      }

      // Título del consultorio
      doc
        .fontSize(20)
        .fillColor(primaryColor)
        .text('PROSPERA DIGITAL', 140, 50, { align: 'left' });
      doc
        .fontSize(12)
        .fillColor(grayColor)
        .text('Podología Especializada', 140, 75, { align: 'left' });

      // Línea separadora header
      doc.moveTo(50, 110).lineTo(545, 110).stroke(primaryColor);

      // Título de receta
      doc
        .fontSize(18)
        .fillColor('#000')
        .text('RECETA MÉDICA', 50, 130, { align: 'center' });

      doc.moveTo(50, 160).lineTo(545, 160).stroke('#E5E7EB');

      // Datos del paciente
      doc.fontSize(11);
      const yPaciente = 180;

      doc.fillColor(grayColor).text('Paciente:', 50, yPaciente);
      doc
        .fillColor('#000')
        .text(
          `${data.paciente?.nombres || ''} ${data.paciente?.apellidos || ''}`.trim() ||
          'No especificado',
          120,
          yPaciente,
        );

      doc.fillColor(grayColor).text('Cédula:', 50, yPaciente + 20);
      doc
        .fillColor('#000')
        .text(data.paciente?.cedula || 'No especificada', 120, yPaciente + 20);

      doc.fillColor(grayColor).text('Fecha:', 350, yPaciente);
      const fechaFormateada = data.receta.fecha_emision
        ? new Date(data.receta.fecha_emision).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        : new Date().toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      doc.fillColor('#000').text(fechaFormateada, 400, yPaciente);

      doc.moveTo(50, 230).lineTo(545, 230).stroke('#E5E7EB');

      // Diagnóstico
      if (data.receta.diagnostico_receta) {
        doc.fontSize(12).fillColor(primaryColor).text('DIAGNÓSTICO:', 50, 250);
        doc
          .fontSize(11)
          .fillColor('#000')
          .text(data.receta.diagnostico_receta, 50, 270, { width: 495 });
      }

      // Medicamentos
      let yMeds = data.receta.diagnostico_receta ? 320 : 260;

      doc.fontSize(12).fillColor(primaryColor).text('MEDICAMENTOS:', 50, yMeds);

      yMeds += 25;

      if (data.medicamentos.length === 0) {
        doc
          .fontSize(11)
          .fillColor(grayColor)
          .text('No hay medicamentos registrados', 50, yMeds);
      } else {
        const tableLeft = 50;
        const colWidths = { num: 30, med: 150, dosis: 120, indic: 195 };
        const rowHeight = 25;

        // Header
        doc.font('Helvetica-Bold').fontSize(10);
        doc.rect(tableLeft, yMeds, 495, rowHeight).fill('#E5E7EB');
        doc.fillColor('#000');
        doc.text('N°', tableLeft + 5, yMeds + 7, { width: colWidths.num });
        doc.text('Medicamento', tableLeft + colWidths.num + 5, yMeds + 7, {
          width: colWidths.med,
        });
        doc.text('Dosis', tableLeft + colWidths.num + colWidths.med + 5, yMeds + 7, {
          width: colWidths.dosis,
        });
        doc.text(
          'Indicaciones',
          tableLeft + colWidths.num + colWidths.med + colWidths.dosis + 5,
          yMeds + 7,
          { width: colWidths.indic },
        );

        yMeds += rowHeight;

        // Filas
        doc.font('Helvetica').fontSize(9);

        data.medicamentos.forEach((med, index) => {
          const isEven = index % 2 === 0;
          if (isEven) {
            doc.rect(tableLeft, yMeds, 495, rowHeight).fill('#F9FAFB');
          } else {
            doc.rect(tableLeft, yMeds, 495, rowHeight).fill('#FFFFFF');
          }
          doc.rect(tableLeft, yMeds, 495, rowHeight).stroke('#E5E7EB');

          doc.fillColor('#000');
          doc.text(`${index + 1}`, tableLeft + 5, yMeds + 8, {
            width: colWidths.num,
          });
          doc.text(med.medicamento || '-', tableLeft + colWidths.num + 5, yMeds + 8, {
            width: colWidths.med - 10,
          });
          doc.text(med.dosis || '-', tableLeft + colWidths.num + colWidths.med + 5, yMeds + 8, {
            width: colWidths.dosis - 10,
          });
          doc.text(
            med.indicaciones || '-',
            tableLeft + colWidths.num + colWidths.med + colWidths.dosis + 5,
            yMeds + 8,
            { width: colWidths.indic - 10 },
          );

          yMeds += rowHeight;
        });
      }

      // Espacio para firma - Aumentado para QR más grande
      const yFirma = Math.max(yMeds + 180, 650);

      // Coordenadas para centrar firma
      // A4 Width = 595. Center = 297.5
      // Line Width = 250. Start = 172.5
      const lineStart = 172;
      const lineEnd = 422;
      const lineWidth = lineEnd - lineStart;

      // FIRMA DIGITAL / QR (Si existe)
      if (data.firmaBuffer) {
        try {
          // Imagen más grande (3x-4x)
          // Original: width 100. New: width 280
          const imgWidth = 280;
          const imgHeight = 140; // Ratio 2:1 aprox

          doc.image(data.firmaBuffer, (595 - imgWidth) / 2, yFirma - imgHeight - 10, {
            width: imgWidth,
            height: imgHeight,
            fit: [imgWidth, imgHeight],
            align: 'center',
            valign: 'bottom'
          });
        } catch (error) {
          console.error('Error incrustando firma en PDF:', error);
        }
      }

      // Línea de firma
      doc.moveTo(lineStart, yFirma).lineTo(lineEnd, yFirma).stroke('#000');

      // Texto "Firma del Especialista"
      doc
        .fontSize(11) // Ligeramente más grande
        .fillColor('#000')
        .font('Helvetica-Bold') // Negrita
        .text('Firma del Especialista', lineStart, yFirma + 8, {
          width: lineWidth,
          align: 'center'
        });

      // Nombre del Podólogo
      const nombrePodologo = data.podologo
        ? `Dr. ${data.podologo.nombres} ${data.podologo.apellidos}`
        : 'Especialista';

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(nombrePodologo, lineStart, yFirma + 22, {
          width: lineWidth,
          align: 'center'
        });

      // Footer
      doc
        .fontSize(8)
        .fillColor(grayColor)
        .text('© Prospera Digital - Todos los derechos reservados', 50, 780, {
          align: 'center',
        });

      doc.end();
    });
  }
}
