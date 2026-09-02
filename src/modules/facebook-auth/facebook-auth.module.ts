import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { FacebookAuthController } from './facebook-auth.controller';

@Module({
  imports: [AuthModule],
  controllers: [FacebookAuthController],
})
export class FacebookAuthModule {}
