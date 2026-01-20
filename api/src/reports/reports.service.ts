import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportsService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  async generateCitasPdf(startDate: string, endDate: string, type: 'day' | 'week'): Promise<Buffer> {
    console.log('Generating PDF for:', { startDate, endDate, type });
    try {
      // 1. Fetch Citas (Base Data)
      const { data: citasRaw, error: errorCitas } = await this.supabase
        .from('cita')
        .select(`
          id,
          fecha_hora_inicio,
          estado_id,
          paciente_id,
          podologo_id,
          motivo_cita,
          observaciones_podologo
        `)
        .gte('fecha_hora_inicio', `${startDate}T00:00:00`)
        .lte('fecha_hora_inicio', `${endDate}T23:59:59`)
        .order('fecha_hora_inicio', { ascending: true });

      if (errorCitas) throw new Error(`Error getting appointments: ${errorCitas.message}`);

      const citas = citasRaw || [];
      console.log(`Found ${citas.length} citas base`);

      // 2. Fetch Related Data Manually
      const pacienteIds = [...new Set(citas.map(c => c.paciente_id).filter(Boolean))];
      const podologoIds = [...new Set(citas.map(c => c.podologo_id).filter(Boolean))];
      const citaIds = citas.map(c => c.id);
      const estadoIds = [...new Set(citas.map(c => c.estado_id).filter(Boolean))];

      const promises = [
        // Pacientes
        pacienteIds.length > 0 ? this.supabase.from('paciente').select('usuario_id, nombres, apellidos, cedula').in('usuario_id', pacienteIds) : Promise.resolve({ data: [] }),
        // Podologos
        podologoIds.length > 0 ? this.supabase.from('podologo').select('usuario_id, nombres, apellidos').in('usuario_id', podologoIds) : Promise.resolve({ data: [] }),
        // Estados
        estadoIds.length > 0 ? this.supabase.from('estado_cita').select('id, nombre').in('id', estadoIds) : Promise.resolve({ data: [] }),
        // Extras with Details
        citaIds.length > 0 ? this.supabase.from('receta').select('id, cita_id, diagnostico_receta').in('cita_id', citaIds) : Promise.resolve({ data: [] }),
        citaIds.length > 0 ? this.supabase.from('documentos_clinicos').select('id, cita_id').in('cita_id', citaIds) : Promise.resolve({ data: [] }),
        citaIds.length > 0 ? this.supabase.from('ficha_evaluacion').select('id, cita_id, tipo_pie_izq, tipo_pie_der').in('cita_id', citaIds) : Promise.resolve({ data: [] }),
        citaIds.length > 0 ? this.supabase.from('gestion_ortesis').select('id, cita_id, tipo_ortesis').in('cita_id', citaIds) : Promise.resolve({ data: [] }),
      ];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [resPacientes, resPodologos, resEstados, resRecetas, resDocs, resEvals, resOrtesis] = await Promise.all(promises);

      // Fetch Medications for Recetas found
      const recetasFound = resRecetas.data || [];
      const recetaIds = recetasFound.map((r: any) => r.id);
      let resMedicamentos = { data: [] as any[] };
      if (recetaIds.length > 0) {
        // @ts-ignore
        resMedicamentos = await this.supabase.from('detalles_receta').select('receta_id, medicamento').in('receta_id', recetaIds);
      }

      // Maps for O(1) access
      const pacienteMap = new Map<string, any>((resPacientes.data || []).map((p: any) => [p.usuario_id, p] as [string, any]));
      const podologoMap = new Map<string, any>((resPodologos.data || []).map((p: any) => [p.usuario_id, p] as [string, any]));
      const estadoMap = new Map<number, string>((resEstados.data || []).map((e: any) => [e.id, e.nombre] as [number, string]));

      // Detailed Maps
      const recetaMap = new Map<number, any[]>(); // cita_id -> recetas[]
      (resRecetas.data || []).forEach((r: any) => {
        const list = recetaMap.get(r.cita_id) || [];
        // Attach medications
        const meds = (resMedicamentos.data || []).filter((m: any) => m.receta_id === r.id).map((m: any) => m.medicamento);
        list.push({ ...r, medicamentos: meds });
        recetaMap.set(r.cita_id, list);
      });

      const docSet = new Set((resDocs.data || []).map((d: any) => d.cita_id));

      const evalMap = new Map<number, any>(); // cita_id -> evaluacion
      (resEvals.data || []).forEach((e: any) => evalMap.set(e.cita_id, e));

      const ortesisMap = new Map<number, any>(); // cita_id -> ortesis
      (resOrtesis.data || []).forEach((o: any) => ortesisMap.set(o.cita_id, o));


      // 3. Calculate Stats
      const total = citas.length;
      const completadas = citas.filter(c => c.estado_id === 2).length;
      const canceladas = citas.filter(c => c.estado_id === 3).length;
      const reservadas = citas.filter(c => c.estado_id === 1).length;

      // 4. Create PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => { });

      // --- Header ---
      let logoPath = path.join(process.cwd(), '../client/public/assets/logo/logo-completo.png');
      if (!fs.existsSync(logoPath)) {
        logoPath = path.join(__dirname, '../../../../client/public/assets/logo/logo-completo.png');
      }

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 100 });
      } else {
        doc.fontSize(20).text('PROSPERA DIGITAL', 50, 50);
      }

      doc.fontSize(10).text('Reporte Generado: ' + new Date().toLocaleString(), 200, 65, { align: 'right' });
      doc.moveDown(4);

      // --- Title ---
      doc.fontSize(18).text(`Reporte de Citas - ${type === 'day' ? 'Diario' : 'Semanal'}`, { align: 'center' });
      doc.fontSize(12).text(`Periodo: ${startDate} al ${endDate}`, { align: 'center' });
      doc.moveDown(2);

      // --- Stats Summary ---
      const summaryY = doc.y;
      doc.fontSize(10);
      doc.text(`Total Citas: ${total}`, 50, summaryY);
      doc.text(`Completadas: ${completadas}`, 150, summaryY);
      doc.text(`Reservadas: ${reservadas}`, 250, summaryY);
      doc.text(`Canceladas: ${canceladas}`, 350, summaryY);
      doc.moveDown(2);

      // --- Table Headers ---
      const tableTop = doc.y;
      const colX = {
        hora: 50,
        paciente: 100,
        podologo: 220,
        estado: 320,
        detalles: 400
      };

      doc.font('Helvetica-Bold');
      doc.text('Hora', colX.hora, tableTop);
      doc.text('Paciente', colX.paciente, tableTop);
      doc.text('Podólogo', colX.podologo, tableTop);
      doc.text('Estado', colX.estado, tableTop);
      doc.text('Extras', colX.detalles, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let currentY = tableTop + 25;
      doc.font('Helvetica');

      // --- Table Rows ---
      citas.forEach((cita, index) => {
        // --- Calculate Row Height Based on Content ---
        const pData = pacienteMap.get(cita.paciente_id);
        const paciente = pData ? `${pData.nombres} ${pData.apellidos}` : 'N/A';

        const podData = podologoMap.get(cita.podologo_id);
        const podologo = podData ? `${podData.nombres?.split(' ')[0]} ${podData.apellidos?.split(' ')[0]}` : 'N/A';

        // Measure text height with specific widths
        const nameHeight = doc.heightOfString(paciente, { width: 110 });
        const podHeight = doc.heightOfString(podologo, { width: 90 });

        // Base content row height is max of text heights or min 20px
        const baseContentHeight = Math.max(20, nameHeight, podHeight);

        // --- Calculate Extras Height ---
        const recetaData = recetaMap.get(cita.id);
        const evalData = evalMap.get(cita.id);
        const ortData = ortesisMap.get(cita.id);

        const hasRecetas = recetaData && recetaData.length > 0;
        const hasOtherData = evalData || ortData;
        const hasExtraDetail = hasRecetas || hasOtherData;

        let extraHeight = 0;
        let rightColumnLines = 0;
        let leftColumnLines = 0;

        if (hasExtraDetail) {
          extraHeight += 10; // Top padding for details section

          // Calculate Left Column Height (Recetas)
          if (hasRecetas) {
            // Calculate lines precisely
            leftColumnLines = 1; // Title
            recetaData.forEach(r => {
              const dx = r.diagnostico_receta ? `Dx: ${r.diagnostico_receta}` : '';
              const meds = r.medicamentos?.length ? `Meds: ${r.medicamentos.join(', ')}` : '';
              const text = [dx, meds].filter(Boolean).join(' - ');
              const h = doc.heightOfString(`• ${text}`, { width: 230 });
              extraHeight += h + 2;
            });
            // We'll manage max height below
          }

          // Calculate Right Column Height (Eval + Ortesis)
          if (evalData) {
            const pies: string[] = [];
            if (evalData.tipo_pie_izq) pies.push(`Izq: ${evalData.tipo_pie_izq}`);
            if (evalData.tipo_pie_der) pies.push(`Der: ${evalData.tipo_pie_der}`);
            const evalText = pies.length > 0 ? pies.join(', ') : 'Registrada';
            const h = doc.heightOfString(`• ${evalText}`, { width: 180 });
            rightColumnLines += (10 + h + 5); // Title + Text + gap
          }

          if (ortData && ortData.tipo_ortesis) {
            rightColumnLines += (10 + 12 + 12); // Title + Text + gap
          }

          // If we have separate calculations, we need to ensure extraHeight covers the taller column
          // Simplification: Re-calculate strictly based on columns
          let col1H = 0;
          if (hasRecetas) {
            col1H += 10; // Title
            recetaData.forEach(r => {
              const dx = r.diagnostico_receta ? `Dx: ${r.diagnostico_receta}` : '';
              const meds = r.medicamentos?.length ? `Meds: ${r.medicamentos.join(', ')}` : '';
              const text = [dx, meds].filter(Boolean).join(' - ');
              col1H += doc.heightOfString(`• ${text}`, { width: 230 }) + 2;
            });
          }

          let col2H = 0;
          if (hasOtherData) {
            if (evalData) {
              col2H += 10;
              const pies: string[] = [];
              if (evalData.tipo_pie_izq) pies.push(`Izq: ${evalData.tipo_pie_izq}`);
              if (evalData.tipo_pie_der) pies.push(`Der: ${evalData.tipo_pie_der}`);
              const evalText = pies.length > 0 ? pies.join(', ') : 'Registrada';
              col2H += doc.heightOfString(`• ${evalText}`, { width: 180 }) + 5;
            }
            if (ortData && ortData.tipo_ortesis) {
              col2H += 10;
              col2H += doc.heightOfString(`• ${ortData.tipo_ortesis}`, { width: 180 }) + 5;
            }
          }

          extraHeight = 10 + Math.max(col1H, col2H);
        }

        const rowHeight = baseContentHeight + extraHeight + 15; // Base + Extras + Padding

        // --- Page Break ---
        if (currentY + rowHeight > 750) {
          doc.addPage();
          currentY = 50;
          doc.font('Helvetica-Bold');
          doc.text('Hora', colX.hora, currentY);
          doc.text('Paciente', colX.paciente, currentY);
          doc.text('Podólogo', colX.podologo, currentY);
          doc.text('Estado', colX.estado, currentY);
          doc.text('Extras', colX.detalles, currentY);
          doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).stroke();
          currentY += 25;
          doc.font('Helvetica');
        }

        // --- ROW BACKGROUND (Zebra Striping) ---
        if (index % 2 === 0) {
          doc.save();
          doc.fillColor('#f9f9f9');
          // Add small top/bottom margin to rect to create white separation lines
          doc.rect(50, currentY - 5, 500, rowHeight).fill();
          doc.restore();
        }

        // --- Main Row Content ---
        const hora = new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const estado = estadoMap.get(cita.estado_id) || 'N/A';

        // Extras flags
        const hasReceta = recetaMap.has(cita.id) ? 'R' : '-';
        const hasDoc = docSet.has(cita.id) ? 'D' : '-';
        const hasEval = evalMap.has(cita.id) ? 'E' : '-';
        const hasOrt = ortesisMap.has(cita.id) ? 'O' : '-';
        const extras = `[ ${hasReceta} | ${hasDoc} | ${hasEval} | ${hasOrt} ]`;

        doc.fillColor('black');
        doc.text(hora, colX.hora, currentY);
        // Use continued: false to allow wrapping within width, but we handle layout manually
        doc.text(paciente, colX.paciente, currentY, { width: 110, align: 'left' });
        doc.text(podologo, colX.podologo, currentY, { width: 90, align: 'left' });
        doc.text(estado, colX.estado, currentY);
        doc.text(extras, colX.detalles, currentY);

        // --- Move Y down by base content height ---
        // This is crucial: move Y not by a fixed 20 but by the actual height of the text block we just wrote
        currentY += baseContentHeight;

        // --- Extra Details Section (2 Columns) ---
        if (hasExtraDetail) {
          currentY += 5; // Small gap before divider

          // Divider line (light)
          doc.save();
          doc.strokeColor('#dddddd');
          doc.moveTo(100, currentY).lineTo(500, currentY).stroke();
          doc.restore();

          currentY += 5; // Padding after divider

          const col1X = 100; // Start at Paciente column
          const col2X = 350; // Start at roughly Podologo/Estado area

          const startDetailsY = currentY;

          // COLUMN 1: RECETAS
          if (hasRecetas) {
            doc.fontSize(8).font('Helvetica-Bold').text('MEDICACIÓN RECETADA:', col1X, currentY);
            currentY += 10;
            doc.font('Helvetica');

            recetaData.forEach(r => {
              const dx = r.diagnostico_receta ? `Dx: ${r.diagnostico_receta}` : '';
              const meds = r.medicamentos?.length ? `Meds: ${r.medicamentos.join(', ')}` : '';
              const text = [dx, meds].filter(Boolean).join(' - ');
              doc.text(`• ${text}`, col1X, currentY, { width: 230 });
              currentY += (doc.heightOfString(text, { width: 230 }) + 2);
            });
          }

          // Store Y for calculation
          const col1EndY = currentY;

          // Reset Y for Column 2
          currentY = startDetailsY;

          // COLUMN 2: EVAL & ORTESIS
          if (hasOtherData) {
            // Evaluation
            if (evalData) {
              doc.fontSize(8).font('Helvetica-Bold').text('EVALUACIÓN PIE:', col2X, currentY);
              currentY += 10;
              doc.font('Helvetica');

              const pies: string[] = [];
              if (evalData.tipo_pie_izq) pies.push(`Izq: ${evalData.tipo_pie_izq}`);
              if (evalData.tipo_pie_der) pies.push(`Der: ${evalData.tipo_pie_der}`);
              const evalText = pies.length > 0 ? pies.join(', ') : 'Registrada';

              doc.text(`• ${evalText}`, col2X, currentY, { width: 180 });
              currentY += (doc.heightOfString(evalText, { width: 180 }) + 5);
            }

            // Ortesis
            if (ortData && ortData.tipo_ortesis) {
              doc.fontSize(8).font('Helvetica-Bold').text('ÓRTESIS:', col2X, currentY);
              currentY += 10;
              doc.font('Helvetica');
              doc.text(`• ${ortData.tipo_ortesis}`, col2X, currentY, { width: 180 });
              currentY += 12;
            }
          }

          // Update currentY to be the max of both columns
          currentY = Math.max(col1EndY, currentY);

          doc.fontSize(10); // Reset font size
        }

        currentY += 15; // Bottom padding

        // Bottom border for the row
        doc.save();
        doc.strokeColor('#eeeeee');
        doc.moveTo(50, currentY - 8).lineTo(550, currentY - 8).stroke(); // Adjusted line position
        doc.restore();

      });

      // Legend
      doc.moveDown(2);
      doc.fontSize(8).fillColor('gray').text('Leyenda Extras: R=Receta, D=Documentos, E=Evaluación, O=Órtesis', 50, doc.y, { align: 'center' });

      doc.end();

      return new Promise((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
      });

    } catch (error: any) {
      console.error('SERVER PDF ERROR:', error);
      throw new InternalServerErrorException(error.message || 'Error generando el reporte PDF');
    }
  }
}
