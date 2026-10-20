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
import { TelemetryService } from '../telemetry/telemetry.service';

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
    private readonly telemetryService: TelemetryService,
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

      this.channel.consume(q.queue, async (msg: any) => {
        if (!msg) return;
        try {
          const raw = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey || '';
          const payload = raw.payload || raw;
          this.logger.log(`🐰 Gateway RabbitMQ received [${routingKey}]: Order ${payload.orderNumber || payload.id}`);

          const orderId = payload.orderId || payload.id;
          const newStatus = payload.newStatus || payload.status;
          const isNewOrder =
            routingKey === 'order.placed' ||
            routingKey === 'order.created' ||
            (newStatus === 'PLACED' && !routingKey.includes('status'));

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

          // 2. Targeted WebSocket broadcasts (Deduplicated rooms)
          if (isNewOrder) {
            if (payload.restaurantId) {
              this.server
                .to([`restaurant:${payload.restaurantId}`, `restaurant_${payload.restaurantId}`])
                .emit('restaurant:new_order', payload);
            }
          } else {
            // Lifecycle status update (preparing, ready, delivered, etc.)
            if (payload.restaurantId) {
              this.server
                .to([`restaurant:${payload.restaurantId}`, `restaurant_${payload.restaurantId}`])
                .emit('order_status_updated', statusPayload);
              this.server
                .to([`restaurant:${payload.restaurantId}`, `restaurant_${payload.restaurantId}`])
                .emit('order:status', statusPayload);
            }
          }

          if (orderId) {
            this.server
              .to([`order:${orderId}`, `order_${orderId}`])
              .emit('order_status_updated', statusPayload);
            this.server
              .to([`order:${orderId}`, `order_${orderId}`])
              .emit(SocketEvents.ORDER_STATUS, payload);
          }

          // 🚀 Search for delivery partner when restaurant starts PREPARING (NOT on creation)
          if (newStatus === 'PREPARING') {
            this.logger.log(`🍳 Order ${orderId} is now PREPARING. Searching Redis for nearest delivery partner...`);
            await this.dispatchToNearestPartner(payload);
          } else if (newStatus === 'READY_FOR_PICKUP') {
            // Backup check: if order reached READY_FOR_PICKUP, trigger dispatch if still pending
            await this.dispatchToNearestPartner(payload);
          }

          if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
            if (orderId) {
              await this.telemetryService.cleanupOrderTelemetry(orderId, payload.deliveryId);

              // Notify customer sockets in room that tracking has concluded
              this.server
                .to([`order:${orderId}`, `order_${orderId}`])
                .emit('order:tracking_ended', { orderId, status: newStatus });

              // Disconnect and eject all sockets from the delivered order room
              setTimeout(() => {
                this.server
                  .in([`order:${orderId}`, `order_${orderId}`])
                  .socketsLeave([`order:${orderId}`, `order_${orderId}`]);
                this.logger.log(`🔌 [SOCKET SEVERED] All sockets disconnected from order:${orderId} after delivery`);
              }, 1000);
            }
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

  @SubscribeMessage('driver:offline')
  async handleDriverOffline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { partnerUserId?: string },
  ) {
    if (data?.partnerUserId) {
      await this.telemetryService.removeDriverFromPool(data.partnerUserId);
      this.logger.log(`🛵 Driver ${data.partnerUserId} marked offline in Redis pool`);
    }
    return { status: 'offline' };
  }

  @SubscribeMessage('driver:location')
  @SubscribeMessage('driver:location_update')
  async handleDriverLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      partnerUserId?: string;
      orderId?: string;
      deliveryId?: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      timestamp?: number;
      isAvailable?: boolean;
    },
  ) {
    if (!data || data.latitude === undefined || data.longitude === undefined) {
      return { status: 'error', message: 'Invalid coordinates' };
    }

    // 1. Always record driver presence in Redis geospatial pool if partnerUserId is present
    if (data.partnerUserId) {
      await this.telemetryService.recordDriverLocation({
        partnerUserId: data.partnerUserId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        isAvailable: data.isAvailable ?? (!data.orderId && !data.deliveryId),
      });
    }

    // 2. If on an active delivery trip, record order telemetry and stream to customer room
    if (data.orderId || data.deliveryId) {
      const orderId = data.orderId || data.deliveryId!;
      const telemetry = await this.telemetryService.recordLocation({
        ...data,
        orderId,
      });

      // Targeted real-time broadcast to the customer viewing this order
      this.server
        .to([`order:${orderId}`, `order_${orderId}`])
        .emit('driver:location_updated', telemetry);

      // Backward compatibility for existing listeners
      this.server
        .to([`order:${orderId}`, `order_${orderId}`])
        .emit('delivery:location', telemetry.curr);

      return { status: 'received', bearing: telemetry.bearing, timestamp: telemetry.updatedAt };
    }

    return { status: 'driver_presence_recorded' };
  }

  /**
   * Calculate nearest delivery partner from Redis coordinates and dispatch targeted job
   */
  async dispatchToNearestPartner(payload: any) {
    const orderId = payload.orderId || payload.id;
    let pickupLat = payload.restaurant?.latitude ? Number(payload.restaurant.latitude) : null;
    let pickupLng = payload.restaurant?.longitude ? Number(payload.restaurant.longitude) : null;

    if (!pickupLat || !pickupLng) {
      pickupLat = 23.2324;
      pickupLng = 77.4300;
    }

    const nearest = await this.telemetryService.findNearestDriver(pickupLat, pickupLng);

    if (nearest) {
      this.logger.log(
        `🎯 [DISPATCH TO NEAREST PARTNER] Order ${orderId} targeted directly to driver ${nearest.partnerUserId} (${nearest.distanceKm} km away)`,
      );

      // Targeted notification exclusively to this nearest driver
      this.server
        .to([`driver_${nearest.partnerUserId}`, `driver:${nearest.partnerUserId}`])
        .emit('delivery:broadcast_job', {
          ...payload,
          nearest: true,
          matchedDriverId: nearest.partnerUserId,
          distanceKm: nearest.distanceKm,
          estimatedPickupMinutes: nearest.estimatedPickupMinutes,
        });

      // Backup broadcast to all drivers after 15 seconds if unassigned
      setTimeout(() => {
        this.server.to('drivers').emit('delivery:broadcast_job', payload);
      }, 15000);
    } else {
      this.logger.warn(`No nearest driver found in Redis for order ${orderId}, broadcasting to general pool`);
      this.server.to('drivers').emit('delivery:broadcast_job', payload);
    }
  }
}
