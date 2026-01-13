export class CreatePodologoDto {
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  password: string;
  telefono?: string;
  fecha_nacimiento?: string;
  pais_id?: number;
  tipo_sangre_id?: number;
}
