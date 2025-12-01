// Definimos las interfaces auxiliares para las relaciones
export interface Pais {
  id: number;
  nombre: string;
}

export interface TipoSangre {
  id: number;
  nombre: string;
}

export interface EstadoPaciente {
  id: number;
  nombre: string;
}

// Interfaz Principal de Paciente
// Esta estructura coincide con la respuesta de tu API (incluyendo los joins)
export interface Paciente {
  usuario_id: string; // UUID
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  ciudad: string | null;
  direccion: string | null;
  enfermedades: string | null;
  
  // Relaciones (Objetos anidados que vienen del backend)
  paises: { pais_id:number, nombre: string } | null;
  tipos_sangre: { nombre: string } | null;
  estado_paciente: { nombre: string } | null;
  
  // IDs y Metadatos
  estado_paciente_id: number;
  fecha_creacion: string;
  fecha_modificacion?: string;
}