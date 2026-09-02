import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { GoogleAuthController } from './google-auth.controller';

@Module({
  imports: [AuthModule],
  controllers: [GoogleAuthController],
})
export class GoogleAuthModule {}
