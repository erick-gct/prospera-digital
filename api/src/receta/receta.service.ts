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
      .select('nombres, apellidos')
      .eq('usuario_id', cita?.podologo_id)
      .single();

    // 6. Generar PDF
    return this.createPdf({
      receta,
      medicamentos: medicamentos || [],
      paciente,
      podologo,
    });
  }

  private createPdf(data: {
    receta: any;
    medicamentos: any[];
    paciente: any;
    podologo: any;
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

      // Logo path (intentar cargar si existe)
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
        // Si no se puede cargar el logo, continuar sin él
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

      // Línea separadora
      doc.moveTo(50, 110).lineTo(545, 110).stroke(primaryColor);

      // Título de receta
      doc
        .fontSize(18)
        .fillColor('#000')
        .text('RECETA MÉDICA', 50, 130, { align: 'center' });

      // Línea separadora
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

      // Línea separadora
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
        // Definir columnas de la tabla
        const tableLeft = 50;
        const colWidths = { num: 30, med: 150, dosis: 120, indic: 195 };
        const rowHeight = 25;

        // Header de la tabla
        doc.font('Helvetica-Bold').fontSize(10);

        // Fondo del header
        doc.rect(tableLeft, yMeds, 495, rowHeight).fill('#E5E7EB');

        // Textos del header
        doc.fillColor('#000');
        doc.text('N°', tableLeft + 5, yMeds + 7, { width: colWidths.num });
        doc.text('Medicamento', tableLeft + colWidths.num + 5, yMeds + 7, {
          width: colWidths.med,
        });
        doc.text(
          'Dosis',
          tableLeft + colWidths.num + colWidths.med + 5,
          yMeds + 7,
          { width: colWidths.dosis },
        );
        doc.text(
          'Indicaciones',
          tableLeft + colWidths.num + colWidths.med + colWidths.dosis + 5,
          yMeds + 7,
          { width: colWidths.indic },
        );

        yMeds += rowHeight;

        // Filas de datos
        doc.font('Helvetica').fontSize(9);

        data.medicamentos.forEach((med, index) => {
          const isEven = index % 2 === 0;

          // Fondo alternado
          if (isEven) {
            doc.rect(tableLeft, yMeds, 495, rowHeight).fill('#F9FAFB');
          } else {
            doc.rect(tableLeft, yMeds, 495, rowHeight).fill('#FFFFFF');
          }

          // Bordes de fila
          doc.rect(tableLeft, yMeds, 495, rowHeight).stroke('#E5E7EB');

          // Contenido de celdas
          doc.fillColor('#000');
          doc.text(`${index + 1}`, tableLeft + 5, yMeds + 8, {
            width: colWidths.num,
          });
          doc.text(
            med.medicamento || '-',
            tableLeft + colWidths.num + 5,
            yMeds + 8,
            { width: colWidths.med - 10 },
          );
          doc.text(
            med.dosis || '-',
            tableLeft + colWidths.num + colWidths.med + 5,
            yMeds + 8,
            { width: colWidths.dosis - 10 },
          );
          doc.text(
            med.indicaciones || '-',
            tableLeft + colWidths.num + colWidths.med + colWidths.dosis + 5,
            yMeds + 8,
            { width: colWidths.indic - 10 },
          );

          yMeds += rowHeight;
        });
      }

      // Espacio para firma
      const yFirma = Math.max(yMeds + 50, 550);

      doc.moveTo(350, yFirma).lineTo(530, yFirma).stroke('#000');
      doc
        .fontSize(10)
        .fillColor('#000')
        .font('Helvetica')
        .text('Firma del Especialista', 380, yFirma + 5);

      const nombrePodologo = data.podologo
        ? `Dr. ${data.podologo.nombres} ${data.podologo.apellidos}`
        : 'Especialista';
      doc.text(nombrePodologo, 380, yFirma + 18, { align: 'left' });

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
