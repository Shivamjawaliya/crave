import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { SocketEvents } from '@food-platform/shared-types';
import { OrderSseService } from '../orders/order-sse.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class GatewaySocketGateway implements OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GatewaySocketGateway.name);
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly orderSseService: OrderSseService,
  ) {}

  async onModuleInit() {
    await this.initRabbitMQ();
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch {}
  }

  private async initRabbitMQ() {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
    try {
      this.connection = await amqp.connect(url);
      this.connection.on('error', (err: any) => {
        this.logger.warn(`RabbitMQ connection error: ${err.message}`);
      });
      this.channel = await this.connection.createChannel();
      this.channel.on('error', (err: any) => {
        this.logger.warn(`RabbitMQ channel error: ${err.message}`);
      });

      await this.channel.assertExchange('food_events', 'topic', { durable: true });
      const q = await this.channel.assertQueue('api_gateway_realtime_queue', {
        durable: true,
      });
      await this.channel.bindQueue(q.queue, 'food_events', 'order.#');

      this.channel.consume(q.queue, (msg: any) => {
        if (!msg) return;
        try {
          const raw = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;
          const payload = raw.payload || raw;
          this.logger.log(`🐰 Gateway RabbitMQ received [${routingKey}]: Order ${payload.orderNumber || payload.id}`);

          const orderId = payload.orderId || payload.id;
          const newStatus = payload.newStatus || payload.status;
          const statusPayload = {
            orderId,
            id: orderId,
            orderNumber: payload.orderNumber,
            newStatus,
            status: newStatus,
            changedBy: payload.changedBy || 'SYSTEM',
            timestamp: payload.timestamp || new Date().toISOString(),
            restaurantId: payload.restaurantId,
            customerId: payload.customerId,
          };

          // 1. Broadcast to SSE (Lightweight 1-Way Customer Stream for millions of users)
          this.orderSseService.broadcast(statusPayload);

          // 2. Broadcast to connected WebSocket clients (Restaurant Dashboards, Drivers & KDS)
          this.server.emit('restaurant:new_order', payload);
          this.server.emit('order:placed', payload);
          this.server.emit('order_status_updated', statusPayload);
          this.server.emit(SocketEvents.ORDER_STATUS, payload);
          this.server.to('drivers').emit('delivery:broadcast_job', payload);
          this.server.emit('delivery:broadcast_job', payload);

          if (payload.restaurantId) {
            this.server.to(`restaurant_${payload.restaurantId}`).emit('restaurant:new_order', payload);
            this.server.to(`restaurant:${payload.restaurantId}`).emit('restaurant:new_order', payload);
            this.server.to(`restaurant_${payload.restaurantId}`).emit('order_status_updated', statusPayload);
            this.server.to(`restaurant:${payload.restaurantId}`).emit('order_status_updated', statusPayload);
          }

          if (orderId) {
            this.server.to(`order:${orderId}`).emit('order_status_updated', statusPayload);
            this.server.to(`order_${orderId}`).emit('order_status_updated', statusPayload);
            this.server.to(`order:${orderId}`).emit(SocketEvents.ORDER_STATUS, payload);
            this.server.to(`order_${orderId}`).emit(SocketEvents.ORDER_STATUS, payload);
          }

          this.channel.ack(msg);
        } catch (err: any) {
          this.logger.error(`Error handling RabbitMQ message: ${err.message}`);
          this.channel.nack(msg, false, false);
        }
      });

      this.logger.log('🐰 Gateway: RabbitMQ consumer subscribed to order.# events successfully');
    } catch (e: any) {
      this.logger.warn(`RabbitMQ not available: ${e.message}. Running WebSocket without MQ subscription.`);
    }
  }

  @SubscribeMessage('restaurant:subscribe')
  handleRestaurantSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string },
  ) {
    if (!data?.restaurantId) return;
    client.join(`restaurant_${data.restaurantId}`);
    client.join(`restaurant:${data.restaurantId}`);
    this.logger.log(`Socket ${client.id} joined restaurant rooms for ${data.restaurantId}`);
    return { status: 'subscribed', restaurantId: data.restaurantId };
  }

  @SubscribeMessage(SocketEvents.ORDER_SUBSCRIBE)
  handleOrderSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string } | string,
  ) {
    const orderId = typeof data === 'string' ? data : data?.orderId;
    if (!orderId) return;
    client.join(`order:${orderId}`);
    client.join(`order_${orderId}`);
    this.logger.log(`Socket ${client.id} joined rooms order:${orderId} and order_${orderId}`);
    return { status: 'subscribed', orderId };
  }

  @SubscribeMessage('join_order')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string } | string,
  ) {
    const orderId = typeof data === 'string' ? data : data?.orderId;
    if (!orderId) return;
    client.join(`order:${orderId}`);
    client.join(`order_${orderId}`);
    this.logger.log(`Socket ${client.id} joined order:${orderId}`);
    return { status: 'joined', orderId };
  }

  @SubscribeMessage(SocketEvents.ORDER_UNSUBSCRIBE)
  handleOrderUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string } | string,
  ) {
    const orderId = typeof data === 'string' ? data : data?.orderId;
    if (!orderId) return;
    client.leave(`order:${orderId}`);
    client.leave(`order_${orderId}`);
    return { status: 'unsubscribed', orderId };
  }

  @SubscribeMessage('driver:subscribe')
  handleDriverSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { partnerUserId?: string },
  ) {
    client.join('drivers');
    if (data?.partnerUserId) {
      client.join(`driver_${data.partnerUserId}`);
      client.join(`driver:${data.partnerUserId}`);
    }
    this.logger.log(`🛵 Driver socket ${client.id} subscribed to dispatch pool`);
    return { status: 'subscribed', room: 'drivers' };
  }

  @SubscribeMessage('driver:location_update')
  handleDriverLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { partnerUserId?: string; orderId?: string; latitude: number; longitude: number },
  ) {
    if (!data) return;
    if (data.orderId) {
      this.server.to(`order:${data.orderId}`).emit('delivery:location', data);
      this.server.to(`order_${data.orderId}`).emit('delivery:location', data);
      this.server.to(`order:${data.orderId}`).emit('driver:location', data);
      this.server.to(`order_${data.orderId}`).emit('driver:location', data);
    }
    this.server.emit('driver:live_coordinates', data);
    return { status: 'received', timestamp: new Date().toISOString() };
  }
}
