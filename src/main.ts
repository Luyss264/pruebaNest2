import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN', '*') === '*' ? true : config.get<string>('CORS_ORIGIN'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    errorHttpStatusCode: 400,
  }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FleetCore Maintenance API')
    .setDescription('REST API for fleet vehicles, mechanics, workshops, maintenance scheduling, maintenance history, and partner integrations. All timestamps are ISO 8601.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste the accessToken returned by /api/v1/auth/login.' }, 'access-token')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key', description: 'Configured through the API_KEYS environment variable.' }, 'partner-api-key')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs-json', swaggerOptions: { persistAuthorization: true } });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`FleetCore API listening on port ${port}. Swagger: http://localhost:${port}/docs`);
}

void bootstrap();
