import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { enumData } from '~/common/enums/base.enum';
import { ConversationRepo } from '~/repositories';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGatewayService implements OnGatewayInit {
  @WebSocketServer()
  server: Socket;

  constructor(private readonly conversationRepo: ConversationRepo) {}

  setSocketConnect: Set<string> = new Set();
  userSockets: Map<string, Set<string>> = new Map();
  // Map of roomId -> Map of socketId -> participantData
  speakingRooms: Map<string, Map<string, any>> = new Map();
  // Map of requestId -> { requestId, roomId, applicant, applicantSocketId }
  speakingJoinRequests: Map<
    string,
    { requestId: string; roomId: string; applicant: any; applicantSocketId: string }
  > = new Map();

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

  private async checkAndCloseEmptyRoom(roomId: string): Promise<void> {
    if (!this.speakingRooms.has(roomId)) {
      try {
        await this.conversationRepo.update(
          { id: roomId },
          { status: enumData.CONVERSATION_STATUS.CLOSED.code, isDeleted: true },
        );
        console.log(
          `[SpeakingRoom] Room ${roomId} was deleted/closed because the last participant left.`,
        );
      } catch (err) {
        console.error(`[SpeakingRoom] Failed to close room ${roomId}:`, err);
      }
    }
  }

  @SubscribeMessage('sendMessage')
  handleMessage(client: Socket, payload: any): void {
    console.log('Received message:', payload);
  }

  // --- SPEAKING ROOM REALTIME GATEWAY ---
  @SubscribeMessage('joinSpeakingRoom')
  handleJoinSpeakingRoom(client: Socket, payload: { roomId: string; user: any }): void {
    const { roomId, user } = payload || {};
    if (!roomId || !user) return;

    client.join(`speaking_room_${roomId}`);

    if (!this.speakingRooms.has(roomId)) {
      this.speakingRooms.set(roomId, new Map());
    }

    const roomMembers = this.speakingRooms.get(roomId);
    const participantInfo = {
      socketId: client.id,
      ...user,
    };
    roomMembers.set(client.id, participantInfo);

    // Send existing members to the newly joined client
    const allMembers = Array.from(roomMembers.values());
    client.emit('speakingRoomMembers', { members: allMembers });

    // Notify other members in the room
    client.to(`speaking_room_${roomId}`).emit('userJoinedSpeakingRoom', {
      participant: participantInfo,
    });
    console.log(`User ${user.username || user.name} joined speaking room ${roomId}`);
  }

  @SubscribeMessage('leaveSpeakingRoom')
  async handleLeaveSpeakingRoom(
    client: Socket,
    payload: { roomId: string; userId?: string },
  ): Promise<void> {
    const { roomId, userId } = payload || {};
    if (!roomId) return;

    client.leave(`speaking_room_${roomId}`);

    if (this.speakingRooms.has(roomId)) {
      const roomMembers = this.speakingRooms.get(roomId);
      const memberData = roomMembers.get(client.id);
      roomMembers.delete(client.id);
      if (roomMembers.size === 0) {
        this.speakingRooms.delete(roomId);
        await this.checkAndCloseEmptyRoom(roomId);
      }

      client.to(`speaking_room_${roomId}`).emit('userLeftSpeakingRoom', {
        socketId: client.id,
        userId: userId || memberData?.username || memberData?.id,
      });
    }
  }

  // --- SPEAKING ROOM KNOCKING / WAITING ROOM APPROVAL FLOW ---
  @SubscribeMessage('requestJoinSpeakingRoom')
  async handleRequestJoinSpeakingRoom(
    client: Socket,
    payload: { roomId: string; user: any },
  ): Promise<void> {
    const { roomId, user } = payload || {};
    if (!roomId || !user) return;

    // Check if the user is the Host of this room
    let isHost = Boolean(user.isHost);
    if (!isHost && user.id) {
      const roomEntity = await this.conversationRepo.findOne({
        where: { id: roomId, isDeleted: false },
      });
      if (roomEntity && (roomEntity.hostUserId === user.id || roomEntity.createdBy === user.id)) {
        isHost = true;
      }
    }

    // If the user is the Host, admit immediately without approval!
    if (isHost) {
      client.emit('joinRequestApproved', { roomId, isHost: true });
      return;
    }

    // For non-hosts: check if the room exists and host is currently online in the room
    const roomMembers = this.speakingRooms.get(roomId);
    if (!roomMembers || roomMembers.size === 0) {
      client.emit('joinRequestRejected', {
        roomId,
        reason: 'Phòng hiện chưa có người hoặc Chủ phòng chưa vào. Vui lòng thử lại sau.',
      });
      return;
    }

    // Find host socket(s) in the room
    const hostMembers = Array.from(roomMembers.values()).filter(m => Boolean(m.isHost));
    if (hostMembers.length === 0) {
      client.emit('joinRequestRejected', {
        roomId,
        reason: 'Chủ phòng hiện không có trong phòng để duyệt yêu cầu.',
      });
      return;
    }

    // Create a pending join request
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.speakingJoinRequests.set(requestId, {
      requestId,
      roomId,
      applicant: user,
      applicantSocketId: client.id,
    });

    // Notify host socket(s)
    hostMembers.forEach(h => {
      this.server.to(h.socketId).emit('incomingJoinRequest', {
        requestId,
        roomId,
        applicant: user,
        applicantSocketId: client.id,
      });
    });

    // Notify applicant that request has been submitted to the host
    client.emit('waitingForHostApproval', {
      requestId,
      roomId,
      message: 'Yêu cầu tham gia đã được gửi đến Chủ phòng.',
    });
  }

  @SubscribeMessage('respondJoinRequest')
  handleRespondJoinRequest(
    client: Socket,
    payload: { roomId: string; requestId: string; applicantSocketId: string; approved: boolean },
  ): void {
    const { roomId, requestId, applicantSocketId, approved } = payload || {};
    if (!requestId) return;

    const request = this.speakingJoinRequests.get(requestId);
    this.speakingJoinRequests.delete(requestId);

    const targetSocketId = applicantSocketId || request?.applicantSocketId;
    if (!targetSocketId) return;

    if (approved) {
      this.server.to(targetSocketId).emit('joinRequestApproved', { roomId });
    } else {
      this.server.to(targetSocketId).emit('joinRequestRejected', {
        roomId,
        reason: 'Chủ phòng đã từ chối yêu cầu tham gia phòng.',
      });
    }

    // Broadcast to other host devices if any that request has been handled
    client.to(`speaking_room_${roomId}`).emit('joinRequestHandled', { requestId });
  }

  @SubscribeMessage('cancelJoinRequest')
  handleCancelJoinRequest(client: Socket, payload: { requestId: string; roomId: string }): void {
    const { requestId, roomId } = payload || {};
    if (!requestId) return;

    this.speakingJoinRequests.delete(requestId);
    if (roomId) {
      client.to(`speaking_room_${roomId}`).emit('joinRequestCancelled', { requestId });
    }
  }

  @SubscribeMessage('toggleSpeakingMedia')
  handleToggleSpeakingMedia(
    client: Socket,
    payload: { roomId: string; userId: string; mediaState: any },
  ): void {
    const { roomId, userId, mediaState } = payload || {};
    if (!roomId) return;

    if (this.speakingRooms.has(roomId)) {
      const roomMembers = this.speakingRooms.get(roomId);
      if (roomMembers.has(client.id)) {
        const current = roomMembers.get(client.id);
        roomMembers.set(client.id, { ...current, ...mediaState });
      }
    }

    client.to(`speaking_room_${roomId}`).emit('userMediaToggled', {
      socketId: client.id,
      userId,
      mediaState,
    });
  }

  @SubscribeMessage('sendSpeakingChat')
  handleSendSpeakingChat(client: Socket, payload: { roomId: string; message: any }): void {
    const { roomId, message } = payload || {};
    if (!roomId || !message) return;

    // Broadcast message to everyone in the room (including sender)
    this.server.to(`speaking_room_${roomId}`).emit('newSpeakingChat', message);
  }

  @SubscribeMessage('sendSpeakingReaction')
  handleSendSpeakingReaction(client: Socket, payload: { roomId: string; reaction: any }): void {
    const { roomId, reaction } = payload || {};
    if (!roomId || !reaction) return;

    this.server.to(`speaking_room_${roomId}`).emit('newSpeakingReaction', reaction);
  }

  @SubscribeMessage('speakingSignal')
  handleSpeakingSignal(
    client: Socket,
    payload: { roomId: string; toSocketId?: string; signal: any },
  ): void {
    const { roomId, toSocketId, signal } = payload || {};
    if (toSocketId) {
      this.server.to(toSocketId).emit('speakingSignal', {
        fromSocketId: client.id,
        signal,
      });
    } else if (roomId) {
      client.to(`speaking_room_${roomId}`).emit('speakingSignal', {
        fromSocketId: client.id,
        signal,
      });
    }
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

    // Cleanup speaking rooms on disconnect
    for (const [roomId, roomMembers] of this.speakingRooms.entries()) {
      if (roomMembers.has(client.id)) {
        const memberData = roomMembers.get(client.id);
        roomMembers.delete(client.id);
        client.to(`speaking_room_${roomId}`).emit('userLeftSpeakingRoom', {
          socketId: client.id,
          userId: memberData?.username || memberData?.id,
        });
        if (roomMembers.size === 0) {
          this.speakingRooms.delete(roomId);
          this.checkAndCloseEmptyRoom(roomId);
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
