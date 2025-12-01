// Este DTO define los parámetros opcionales que pueden venir en la URL
// Ejemplo: GET /pacientes?cedula=099&estado=activo
export class FilterPatientDto {
  cedula?: string; // Filtro parcial o exacto por cédula
  apellido?: string;
  estado?: 'activo' | 'inactivo' | 'todos'; // Filtro por estado
}
