import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGatewayService implements OnGatewayInit {
  @WebSocketServer()
  server: Socket;

  setSocketConnect: Set<string> = new Set();
  userSockets: Map<string, Set<string>> = new Map();

  afterInit(server: Socket) {
    console.log('Server initialized');
  }

  handleConnection(client: Socket) {
    this.setSocketConnect.add(client.id);
    const userId = client.handshake.query?.userId as string;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);
      console.log(`Registered connection socket ${client.id} for user ${userId}`);
    }
  }

  @SubscribeMessage('sendMessage')
  handleMessage(client: Socket, payload: any): void {
    console.log('Received message:', payload);
  }

  handleDisconnect(client: Socket) {
    this.setSocketConnect.delete(client.id);
    for (const [userId, socketIds] of this.userSockets.entries()) {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);
        if (socketIds.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  sendChangeResultMatch(matchId: string) {
    this.server
      .to([...this.setSocketConnect])
      .emit('sendChangeResultMatch', { isChangeData: true, matchId });
  }

  sendSuccessPayment() {
    this.server.to([...this.setSocketConnect]).emit('sendSuccessPayment', { isChangeData: true });
  }

  sendNotifyProgressToUser(
    userId: string,
    data: {
      sent: number;
      total: number;
      percentage: number;
      taskId: string;
      message?: string;
      status: 'processing' | 'success' | 'error';
    },
  ) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds && socketIds.size > 0) {
      this.server.to([...socketIds]).emit('notifyProgressUpdate', data);
    }
  }
}
