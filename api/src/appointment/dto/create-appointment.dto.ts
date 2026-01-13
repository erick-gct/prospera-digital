import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class CreateAppointmentDto {
  // El frontend envía la fecha y hora combinadas en formato ISO
  @IsNotEmpty()
  @IsDateString()
  fechaHoraInicio: string;

  // El nuevo campo que agregaste
  @IsOptional()
  @IsString()
  motivo_cita?: string;

  // Observaciones del paciente al agendar
  @IsOptional()
  @IsString()
  observaciones_paciente?: string;

  // El ID del paciente (temporalmente lo enviamos en el body hasta tener Guards JWT)
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  // El ID del podólogo seleccionado por el paciente
  @IsNotEmpty()
  @IsUUID()
  podologoId: string;
}
