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
  paises: { nombre: string } | null;
  tipos_sangre: { nombre: string } | null;
  estado_paciente: { nombre: string } | null;
  
  // IDs y Metadatos
  pais_id?: number; // Opcional si no siempre se trae
  tipo_sangre_id?: number;
  estado_paciente_id: number;
  fecha_creacion: string;
  fecha_modificacion?: string;
}

export interface Podologo {
  usuario_id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  
  // Relaciones
  paises: { nombre: string } | null;
  tipos_sangre: { nombre: string } | null;

  // IDs y Metadatos
  pais_id?: number;
  tipo_sangre_id?: number;
  fecha_creacion: string;
  fecha_modificacion?: string;
 
}