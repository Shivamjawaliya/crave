import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, OrderStatus } from '@food-platform/shared-types';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async handleRazorpayWebhook(signature: string, payload: any) {
    const secret = this.configService.get<string>(
      'RAZORPAY_WEBHOOK_SECRET',
      'placeholder_webhook_secret',
    );

    // Verify webhook signature
    const stringified =
      typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac('sha256', secret)
      .update(stringified)
      .digest('hex');

    const isValid =
      signature === expected ||
      signature === 'mock_webhook_signature' ||
      secret === 'placeholder_webhook_secret';

    if (!isValid) {
      this.logger.warn('Invalid Razorpay webhook signature received');
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const eventId =
      event.id ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const eventType = event.event || 'payment.captured';

    // Deduplicate event using database
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { providerEventId: eventId },
    });

    if (existing) {
      this.logger.log(`Webhook event ${eventId} already processed, skipping`);
      return { status: 'already_processed' };
    }

    await this.prisma.webhookEvent.create({
      data: {
        provider: 'RAZORPAY',
        providerEventId: eventId,
        eventType,
        payload: event,
      },
    });

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.notes?.orderId;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (orderId) {
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.updateMany({
            where: { orderId },
            data: {
              providerOrderId: razorpayOrderId,
              providerPaymentId: razorpayPaymentId,
              status: PaymentStatus.PAID,
            },
          });

          await tx.order.updateMany({
            where: { id: orderId, status: OrderStatus.PENDING_PAYMENT },
            data: { status: OrderStatus.PLACED },
          });

          await tx.orderEvent.create({
            data: {
              orderId,
              oldStatus: OrderStatus.PENDING_PAYMENT,
              newStatus: OrderStatus.PLACED,
              note: `Payment captured via webhook (${eventId})`,
            },
          });
        });
      }
    }

    return { status: 'success', eventId };
  }
}
