import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SocketEvents } from '@food-platform/shared-types';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class GatewaySocketGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GatewaySocketGateway.name);

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
    return { status: 'unsubscribed', room };
  }
}
