export class UpdatePatientDto {
  // Solo incluimos los campos que permitimos editar
  nombres?: string;
  apellidos?: string;
  fechaNacimiento?: string;
  // Ubicación
  paisId?: number;
  ciudad?: string;
  direccion?: string;
  telefono?: string;

  // Salud
  tipoSangreId?: number;
  enfermedades?: string;

  // Campos sensibles (habilitados para Admin)
  cedula?: string;
  email?: string;
}
