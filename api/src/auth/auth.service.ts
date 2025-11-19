import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  // El 'constructor' se ejecuta primero
  constructor(private configService: ConfigService) {
    // 1. Leemos las variables del archivo 'api/.env' que creamos
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    // 2. Verificamos que las variables existan
    if (!supabaseUrl || !supabaseKey) {
      throw new InternalServerErrorException(
        'Faltan las variables de entorno de Supabase (URL o KEY)',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // 3. Creamos la función para iniciar sesión
  async signIn(email: string, password: string): Promise<any> {
    console.log(`(API) Intentando login para: ${email}`);

    // 4. Usamos la función de Supabase Auth
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('(API) Error en Supabase Auth:', error.message);
      // Si falla, lanzamos un error 401 (No Autorizado)
      throw new UnauthorizedException(error.message);
    }

    console.log('(API) Éxito:', data.user.email);
    // Si tiene éxito, devolvemos los datos del usuario
    return data;
  }

  // (Aquí crearemos la función de registro 'signUp' más adelante)
  async register(registerDto: RegisterDto): Promise<any> {
    console.log(`(API) Registrando: ${registerDto.email}`);

    // 1. Crear Auth User
    const { data: authData, error: authError } =
      await this.supabase.auth.signUp({
        email: registerDto.email,
        password: registerDto.password,
        options: {
          data: { full_name: `${registerDto.nombre} ${registerDto.apellido}` },
        },
      });

    if (authError) throw new BadRequestException(authError.message);
    if (!authData.user)
      throw new InternalServerErrorException('Error creando usuario Auth');

    const userId = authData.user.id;

    // 2. Insertar en 'paciente' con IDs reales
    const { error: dbError } = await this.supabase.from('paciente').insert({
      usuario_id: userId,
      nombres: registerDto.nombre,
      apellidos: registerDto.apellido,
      cedula: registerDto.cedula,
      fecha_nacimiento: registerDto.fechaNacimiento,
      ciudad: registerDto.ciudad,
      direccion: registerDto.direccion,
      telefono: registerDto.telefono,
      enfermedades: registerDto.enfermedades,
      // --- CAMPOS VINCULADOS ---
      pais_id: registerDto.paisId, // ID real del país
      tipo_sangre_id: registerDto.tipoSangreId, // ID real del tipo de sangre
      estado_paciente_id: 1, // <-- POR DEFECTO: 1 (Activo)
    });

    if (dbError) {
      console.error('(API) Error DB:', dbError);
      // Opcional: rollback del usuario auth aquí
      // Si falla la creación del perfil, borramos el usuario de Auth para no dejar "huérfanos"
      await this.supabase.auth.admin.deleteUser(userId);
      throw new InternalServerErrorException(
        `Error al crear perfil: ${dbError.message}`,
      );
    }

    return authData;
  }
}
