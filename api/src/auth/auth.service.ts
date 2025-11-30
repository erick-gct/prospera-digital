import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new InternalServerErrorException(
        'Faltan las variables de entorno de Supabase (URL o KEY)',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signIn(email: string, password: string): Promise<any> {
    console.log(`(API) Intentando login para: ${email}`);
    // 1. Login en Auth
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('(API) Error en Supabase Auth:', error.message);
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 2. Determinar el Rol
    const userId = data.user.id;
    let role = 'DESCONOCIDO';

    // A. ¿Es Podólogo?
    const { data: podologo } = await this.supabase
      .from('podologo')
      .select('usuario_id')
      .eq('usuario_id', userId)
      .maybeSingle();

    if (podologo) {
      role = 'PODOLOGO';
    } else {
      // B. ¿Es Paciente?
      const { data: paciente } = await this.supabase
        .from('paciente')
        .select('usuario_id, estado_paciente_id')
        .eq('usuario_id', userId)
        .maybeSingle();

      if (paciente) {
        // --- VALIDACIÓN DE ESTADO ---
        // Si el estado es 1 = Activo. Si es diferente, bloqueamos.
        if (paciente.estado_paciente_id !== 1) {
          console.warn(
            `(API) Usuario ${email} intentó entrar pero está INACTIVO (Estado: ${paciente.estado_paciente_id})`,
          );
          // Opcional: Cerrar la sesión que acabamos de abrir en Supabase para no dejar "cabos sueltos"
          await this.supabase.auth.signOut();

          throw new ForbiddenException(
            'Tu cuenta está inactiva o suspendida. Por favor contacta al consultorio.',
          );
        }
        role = 'PACIENTE';
      }
    }

    console.log(`(API) Login exitoso. Rol detectado: ${role}`);

    // 3. Devolver todo junto
    return {
      ...data, // session y user
      role,
    };
  }

  async register(registerDto: RegisterDto): Promise<any> {
    // ... (código de registro existente sin cambios) ...
    // (Solo copio el inicio para contexto, el resto se mantiene igual)
    console.log(`(API) Registrando nuevo usuario: ${registerDto.email}`);

    // --- VALIDACIÓN DE UNICIDAD ---
    const { data: existingUsers, error: checkError } = await this.supabase
      .from('paciente')
      .select('cedula, email')
      .or(`cedula.eq.${registerDto.cedula},email.eq.${registerDto.email}`);

    if (checkError) {
      console.error('(API) Error verificando duplicados:', checkError);
      throw new InternalServerErrorException('Error verificando datos.');
    }

    if (existingUsers && existingUsers.length > 0) {
      const match = existingUsers[0];
      if (match.cedula === registerDto.cedula) {
        throw new BadRequestException(
          `La cédula ${registerDto.cedula} ya está registrada.`,
        );
      }
      if (match.email === registerDto.email) {
        throw new BadRequestException(
          `El correo ${registerDto.email} ya está registrado.`,
        );
      }
    }

    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } =
      await this.supabase.auth.signUp({
        email: registerDto.email,
        password: registerDto.password,
        options: {
          data: {
            full_name: `${registerDto.nombre} ${registerDto.apellido}`,
          },
        },
      });

    if (authError) {
      console.error('(API) Error creando usuario Auth:', authError.message);
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) {
      throw new InternalServerErrorException(
        'No se pudo crear el usuario en Auth',
      );
    }

    const userId = authData.user.id;
    console.log(`(API) Usuario Auth creado ID: ${userId}. Creando perfil...`);

    // 2. Insertar el perfil en la tabla 'paciente'
    const { error: dbError } = await this.supabase.from('paciente').insert({
      usuario_id: userId,
      email: registerDto.email,
      nombres: registerDto.nombre,
      apellidos: registerDto.apellido,
      cedula: registerDto.cedula,
      fecha_nacimiento: registerDto.fechaNacimiento,
      ciudad: registerDto.ciudad,
      direccion: registerDto.direccion,
      telefono: registerDto.telefono,
      enfermedades: registerDto.enfermedades,
      pais_id: registerDto.paisId,
      tipo_sangre_id: registerDto.tipoSangreId,
      estado_paciente_id: 1,
      fecha_creacion: new Date(),
    });

    if (dbError) {
      console.error('(API) Error insertando en tabla paciente:', dbError);
      await this.supabase.auth.admin.deleteUser(userId);

      if (dbError.code === '23505') {
        throw new BadRequestException('Ya existe un registro con estos datos.');
      }

      throw new InternalServerErrorException(
        `Error al crear perfil de paciente: ${dbError.message}`
      );
    }

    console.log('(API) Perfil de paciente creado exitosamente.');
    // Al registrarse, por defecto es PACIENTE (o podrías devolverlo explícito también)
    return {
      ...authData,
      role: 'PACIENTE',
    };
  }
}
