import { Module } from '@nestjs/common';
import { ConversationRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { SocketGatewayService } from './socket.service';

@Module({
  imports: [TypeOrmExModule.forCustomRepository([ConversationRepo])],
  controllers: [],
  providers: [SocketGatewayService],
  exports: [SocketGatewayService],
})
export class SocketModule {}
