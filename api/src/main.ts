import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000', // El origen de tu app Next.js
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos permitidos
    credentials: true, // Permite que se envíen cookies (útil para sesiones)
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
