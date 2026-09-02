import { Module } from '@nestjs/common';
import { SocketGatewayService } from './socket.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SocketGatewayService],
  exports: [SocketGatewayService],
})
export class SocketModule {}
