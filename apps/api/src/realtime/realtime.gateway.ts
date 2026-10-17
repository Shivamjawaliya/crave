import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SocketEvents } from '@food-platform/shared-types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(SocketEvents.ORDER_SUBSCRIBE)
  handleOrderSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    if (!data?.orderId) return;
    const room = `order_${data.orderId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
    return { status: 'subscribed', room };
  }

  @SubscribeMessage(SocketEvents.ORDER_UNSUBSCRIBE)
  handleOrderUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    if (!data?.orderId) return;
    const room = `order_${data.orderId}`;
    client.leave(room);
    this.logger.log(`Socket ${client.id} left room ${room}`);
    return { status: 'unsubscribed', room };
  }

  broadcastOrderStatus(orderId: string, status: string, payload?: any) {
    const room = `order_${orderId}`;
    this.server.to(room).emit(SocketEvents.ORDER_STATUS, {
      orderId,
      status,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  }

  broadcastDeliveryLocation(
    orderId: string,
    location: { latitude: number; longitude: number },
  ) {
    const room = `order_${orderId}`;
    this.server.to(room).emit(SocketEvents.DELIVERY_LOCATION, {
      orderId,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date().toISOString(),
    });
  }
}
