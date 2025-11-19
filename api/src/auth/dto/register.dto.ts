export class RegisterDto {
  email!: string;
  password!: string;

  nombre!: string;
  apellido!: string;
  cedula!: string;
  fechaNacimiento!: string;
  // CAMBIO: Ahora esperamos IDs numéricos
  paisId!: number;
  ciudad!: string;
  direccion!: string;
  telefono!: string;

  // CAMBIO: Ahora esperamos ID numérico
  tipoSangreId!: number;
  enfermedades?: string;
}
