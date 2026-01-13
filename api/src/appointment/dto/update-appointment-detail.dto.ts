import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO para medicamentos de receta
class MedicamentoDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  dosis?: string;

  @IsOptional()
  @IsString()
  indicaciones?: string;
}

// DTO para receta completa
class RecetaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicamentoDto)
  medicamentos: MedicamentoDto[];
}

// DTO para ortesis
class OrtesisDto {
  @IsOptional()
  @IsString()
  tipo_ortesis?: string;

  @IsOptional()
  @IsString()
  talla_calzado?: string;

  @IsOptional()
  @IsDateString()
  fecha_toma_molde?: string;

  @IsOptional()
  @IsDateString()
  fecha_envio_laboratorio?: string;

  @IsOptional()
  @IsDateString()
  fecha_entrega_paciente?: string;

  @IsOptional()
  @IsString()
  observaciones_lab?: string;
}

// DTO para evaluación del pie
class EvaluacionDto {
  // Pie izquierdo
  @IsOptional()
  @IsString()
  tipo_pie_izq?: string;

  @IsOptional()
  @IsString()
  pi_notas?: string;

  @IsOptional()
  @IsString()
  pi_unas?: string;

  // Pie derecho
  @IsOptional()
  @IsString()
  tipo_pie_der?: string;

  @IsOptional()
  @IsString()
  pd_notas?: string;

  @IsOptional()
  @IsString()
  pd_unas?: string;

  // General
  @IsOptional()
  @IsString()
  tipo_calzado?: string;

  @IsOptional()
  @IsString()
  actividad_fisica?: string;

  @IsOptional()
  @IsString()
  evaluacion_vascular?: string;
}

// DTO principal para actualizar detalle de cita
export class UpdateAppointmentDetailDto {
  // Campos de la tabla cita
  @IsOptional()
  @IsString()
  observaciones_podologo?: string;

  @IsOptional()
  @IsString()
  procedimientos_realizados?: string;

  // Recetas (array de recetas, cada una con medicamentos)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetaDto)
  recetas?: RecetaDto[];

  // Ortesis
  @IsOptional()
  @ValidateNested()
  @Type(() => OrtesisDto)
  ortesis?: OrtesisDto;

  // Evaluación del pie
  @IsOptional()
  @ValidateNested()
  @Type(() => EvaluacionDto)
  evaluacion?: EvaluacionDto;
}
