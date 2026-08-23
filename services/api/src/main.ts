import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { validateEnv } from './config/validate-env';
import { getAllowedOrigins } from './common/http/allowed-origins';
import { ChatIoAdapter } from './common/ws/chat-io.adapter';

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for webhook signature verification
  });
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV !== 'production';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('MYXCROW API')
      .setDescription('Escrow platform API for secure transactions')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Security headers (CSP disabled for API - no HTML served)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Global exception filter - safe error responses, no stack traces in production
  app.useGlobalFilters(new HttpExceptionFilter());

  const corsOrigins = getAllowedOrigins();
  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });
  app.useWebSocketAdapter(new ChatIoAdapter(app));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}

bootstrap();




