import { ClassSerializerInterceptor, INestApplication } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import * as bodyParser from 'body-parser';
import { getFromContainer, MetadataStorage } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import * as dotenv from 'dotenv';
import basicAuth from 'express-basic-auth';
import 'extensionsjs/lib';
import { I18nService, I18nValidationExceptionFilter } from 'nestjs-i18n';
import 'reflect-metadata';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import { getExcludePrefixRoutes, GLOBAL_PREFIX } from './common/constants';
import { HttpExceptionFilter } from './common/systems/exceptions';
import { LogInterceptor, ResolvePromisesInterceptor } from './common/systems/interceptors';
import { ValidatePipe } from './common/systems/pipe';
import { configEnv } from './config/env';
import { dataSource, SqlFormatter } from './typeorm';

dotenv.config();
type SchemasObject = NonNullable<OpenAPIObject['components']>['schemas'];
const configSwagger = (app: INestApplication) => {
  const { SWAGGER_USER, SWAGGER_PASSWORD, SWAGGER_TITLE, SWAGGER_DESCRIPTION, SWAGGER_VERSION } =
    configEnv();
  app.use(
    [/^\/swagger(\/.*)?$/, '/swagger-json'],
    basicAuth({
      challenge: true,
      users: {
        [SWAGGER_USER]: SWAGGER_PASSWORD,
      },
    }),
  );

  const options = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_VERSION)
    .addSecurity('bearer', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .addApiKey(
      {
        type: 'apiKey',
        name: 'tokenid',
        in: 'header',
      },
      'tokenid',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options, {});
  const metadatas = (getFromContainer(MetadataStorage) as any).validationMetadatas;
  const targetSchemas = document.components.schemas || {};
  const schemasBinding = validationMetadatasToSchemas(metadatas) || {};

  Object.keys(schemasBinding).forEach(key => {
    const value = schemasBinding[key] as SchemasObject;
    if (!targetSchemas[key]) {
      Object.assign(targetSchemas, {
        key: value,
      });
    } else {
      const targetValue = targetSchemas[key] as SchemasObject;

      Object.assign(targetValue.properties, value.properties);
      targetValue.required = value.required;
      Object.assign(targetSchemas, {
        key: targetValue,
      });
    }
  });
  document.components.schemas = Object.assign({}, targetSchemas);
  SwaggerModule.setup('swagger', app, document);
};

const bootstrap = async () => {
  initializeTransactionalContext();
  const env = configEnv();
  const corsOrigins = [env.CUSTOMER_URL, env.WEB_FE_URL, env.WEB_FE_ACADEMY_URL].filter(Boolean);
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: env.NODE_ENV === 'production' && corsOrigins.length ? corsOrigins : true,
      credentials: true,
    },
  });
  const port = process.env.PORT || 3000;
  app.setGlobalPrefix(GLOBAL_PREFIX.API, { exclude: getExcludePrefixRoutes() });
  app.useGlobalPipes(
    new ValidatePipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  app.useGlobalFilters(new I18nValidationExceptionFilter());
  app.useGlobalInterceptors(
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  app.useGlobalInterceptors(new LogInterceptor());

  const i18n = app.get(I18nService) as any;
  app.useGlobalFilters(new HttpExceptionFilter(i18n));

  addTransactionalDataSource(dataSource);
  app.use(bodyParser.json({ limit: '100mb' }));

  configSwagger(app);

  if (process.env.NODE_ENV !== 'production') {
    await SqlFormatter.initialize();
  }

  const server = app.getHttpServer();
  server.keepAliveTimeout = 605 * 1000;
  server.headersTimeout = 606 * 1000;

  await app.listen(port);

  console.log(`Server start on port ${port}. Open http://localhost:${port} to see results`);
  console.log(`API DOCUMENT Open http://localhost:${port}/swagger`);
  console.log('TIMEZONE: ', process.env.TZ);
};

bootstrap();
