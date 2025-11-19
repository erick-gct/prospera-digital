import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
}
