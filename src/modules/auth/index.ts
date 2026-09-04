import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ChildModule } from '~/common/core/decorator';
import { configEnv } from '~/config/env';
import {
  ActionLogRepo,
  OauthAccountRepo,
  RoleRepo,
  UserProfileRepo,
  UserRepo,
  UserRoleRepo,
  UserSessionRepo,
  VerificationCodeRepo,
} from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { EmailModule } from '../email';
import { JwtStrategy } from './jwt.strategy';
import { AuthAdminService, AuthUserService } from './service';

const { JWT_EXPIRY, JWT_SECRET } = configEnv();

@ChildModule({
  providers: [AuthUserService, AuthAdminService, JwtStrategy, JwtService],
  controllers: [],
  exports: [AuthUserService, AuthAdminService, PassportModule, JwtModule],
  imports: [
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: JWT_SECRET,
        signOptions: { expiresIn: JWT_EXPIRY || '1d' },
      }),
    }),
    TypeOrmExModule.forCustomRepository([
      UserRepo,
      UserProfileRepo,
      UserRoleRepo,
      RoleRepo,
      UserSessionRepo,
      OauthAccountRepo,
      VerificationCodeRepo,
      ActionLogRepo,
    ]),
    ActionLogModule,
    EmailModule,
  ],
})
export class AuthModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
