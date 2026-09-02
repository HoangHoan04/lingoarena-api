import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ChildModule } from '~/common/core/decorator';
import { configEnv } from '~/config/env';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { SocketModule } from '../socket/socket.module';
import { VietQrController } from './vietQr.controller';
import { VietQrService } from './vietQr.service';

const { JWT_EXPIRY, JWT_SECRET } = configEnv();

@ChildModule({
  providers: [JwtService, VietQrService],
  controllers: [VietQrController],
  exports: [VietQrService],
  imports: [
    TypeOrmExModule.forCustomRepository([]),
    ActionLogModule,
    SocketModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRY },
    }),
  ],
})
export class VietQrModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
