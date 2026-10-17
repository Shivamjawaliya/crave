import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private connection: any = null;
  private channel: any = null;
  private isConnected = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.connectRabbitMQ();
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch {
      // Ignore disconnect errors during shutdown
    }
  }

  private async connectRabbitMQ() {
    const url = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://guest:guest@localhost:5672',
    );
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange('food_events', 'topic', {
        durable: true,
      });
      await this.channel.assertQueue('notifications_queue', { durable: true });
      await this.channel.bindQueue(
        'notifications_queue',
        'food_events',
        'order.*',
      );
      this.isConnected = true;
      this.logger.log('Connected to RabbitMQ for event processing');
    } catch (err: any) {
      this.logger.warn(
        `RabbitMQ connection not established (${err.message}). Falling back to local dispatch mode.`,
      );
    }
  }

  async publishEvent(eventType: string, payload: any) {
    this.logger.log(`[Event Published] ${eventType}: ${JSON.stringify(payload)}`);

    if (this.isConnected && this.channel) {
      try {
        const message = Buffer.from(
          JSON.stringify({
            eventId: `evt_${Date.now()}`,
            type: eventType,
            payload,
            timestamp: new Date().toISOString(),
          }),
        );
        this.channel.publish('food_events', eventType, message, {
          persistent: true,
        });
      } catch (err: any) {
        this.logger.error(`Failed to publish to RabbitMQ: ${err.message}`);
      }
    }

    // Also persist in-app notification if userId is provided
    if (payload?.userId) {
      await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          type: eventType,
          payload,
        },
      });
    }
  }
}
