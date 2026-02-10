import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://prospira.vip',
      'https://www.prospira.vip',
      'https://prospera-digital-git-vercel-re-fc8a5e-erick-campuzanos-projects.vercel.app', // Preview
      'https://prospera-digital.vercel.app' // Vercel default
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
