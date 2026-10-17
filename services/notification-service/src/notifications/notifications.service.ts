import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange('food_events', 'topic', { durable: true });
      const q = await this.channel.assertQueue('notification_service_queue', { durable: true });
      await this.channel.bindQueue(q.queue, 'food_events', '#');

      this.channel.consume(q.queue, async (msg: any) => {
        if (!msg) return;
        try {
          const content = JSON.parse(msg.content.toString());
          this.logger.log(`📥 Received async event: ${msg.fields.routingKey} - payload: ${JSON.stringify(content)}`);
          if (content.payload?.userId) {
            await this.prisma.notification.create({
              data: {
                userId: content.payload.userId,
                type: msg.fields.routingKey,
                payload: content.payload,
              },
            });
          }
          this.channel.ack(msg);
        } catch (e: any) {
          this.logger.error(`Error processing event: ${e.message}`);
          this.channel.nack(msg, false, false);
        }
      });
      this.logger.log('🐰 RabbitMQ Consumer initialized successfully');
    } catch (e: any) {
      this.logger.warn(`RabbitMQ not available: ${e.message}. Running in standalone mode.`);
    }
  }

  async sendManualNotification(userId: string, type: string, payload: any) {
    return this.prisma.notification.create({
      data: { userId, type, payload },
    });
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
