import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-redis-yet';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { AppController } from './app.controller';
import { resolveI18nLocalesPath, shouldWatchI18nFiles } from './config/i18n.path';
import { CustomThrottlerGuard, PermissionModule } from './common/guards';
import { DuplicateRequestInterceptor, TrimInterceptor } from './common/systems/interceptors';
import { ContextMiddleware, LoggerMiddleware } from './common/systems/middlewares';
import * as allModules from './modules';
import { SocketModule } from './modules/socket/socket.module';
import { SqlLoggingInterceptor } from './typeorm/interceptors/sql-logging-interceptor';
export * from './common/helpers/defineHelper';

require('dotenv').config();

const globalModules = [
  CacheModule.registerAsync({
    isGlobal: true,
    useFactory: async () => ({
      store: await redisStore({
        socket: {
          host: process.env.REDIS_HOST || 'localhost:6379',
          port: Number(process.env.REDIS_PORT) || 6379,
          reconnectStrategy: retries => {
            console.log(`Redis reconnect #${retries}`);
            return Math.min(retries * 1000, 5000);
          },
        },
        password: process.env.REDIS_PASSWORD || '',
      }),
      max: 1000,
    }),
  }),
  I18nModule.forRootAsync({
    useFactory: () => ({
      fallbackLanguage: 'vi',
      logging: false,
      loaderOptions: {
        path: resolveI18nLocalesPath(),
        watch: shouldWatchI18nFiles(),
      },
    }),
    resolvers: [
      new HeaderResolver(['x-lang']),
      { use: QueryResolver, options: ['lang'] },
      AcceptLanguageResolver,
    ],
  }),
  ThrottlerModule.forRoot([
    {
      name: 'short',
      ttl: 1000,
      limit: +process.env.LIMIT_RQ_PER_SECOND_PER_IP || 10,
    },
    {
      name: 'long',
      ttl: 60000,
      limit: +process.env.LIMIT_RQ_PER_MINUTE_PER_IP || 100,
    },
  ]),
  SocketModule,
];
const modules = Object.values(allModules);

@Module({
  imports: [...globalModules, PermissionModule, ...modules, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SqlLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TrimInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DuplicateRequestInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextMiddleware, LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
