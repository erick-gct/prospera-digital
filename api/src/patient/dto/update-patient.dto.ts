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

  // Nota: NO incluimos 'cedula' ni 'email' ni 'usuario_id' 
  // para que no puedan ser modificados a través de este endpoint.
}