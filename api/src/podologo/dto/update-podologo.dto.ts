export class UpdatePodologoDto {
  nombres?: string;
  apellidos?: string;
  // La cédula y email suelen ser sensibles, pero si quieres permitir edición:
  // cedula?: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  paisId?: number;
  tipoSangreId?: number;
}
