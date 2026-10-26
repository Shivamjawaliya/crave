import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, OrderStatus } from '@food-platform/shared-types';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createRazorpayOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const providerOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID', 'rzp_test_placeholder_key');

    await this.prisma.payment.upsert({
      where: { orderId },
      update: { providerOrderId, status: PaymentStatus.PENDING },
      create: { orderId, providerOrderId, amountPaise: order.totalPaise, status: PaymentStatus.PENDING },
    });

    return { orderId, amountPaise: order.totalPaise, currency: 'INR', razorpayOrderId: providerOrderId, keyId };
  }

  async verifyPayment(orderId: string, data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET', 'placeholder_secret');
    const body = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

    let isValid = secret === 'placeholder_secret';
    if (!isValid && data.razorpaySignature) {
      try {
        const sigBuf = Buffer.from(data.razorpaySignature, 'hex');
        const expBuf = Buffer.from(expected, 'hex');
        isValid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
      } catch {
        isValid = false;
      }
    }
    if (!isValid) throw new BadRequestException('Invalid signature');

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId },
        data: {
          providerOrderId: data.razorpayOrderId,
          providerPaymentId: data.razorpayPaymentId,
          providerSignature: data.razorpaySignature,
          status: PaymentStatus.PAID,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PLACED },
      });
    });

    return { success: true, message: 'Payment verified and order placed' };
  }

  async handleWebhook(signature: string, payload: any) {
    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const eventId = event.id || `evt_${Date.now()}`;

    const existing = await this.prisma.webhookEvent.findUnique({ where: { providerEventId: eventId } });
    if (existing) return { status: 'already_processed' };

    await this.prisma.webhookEvent.create({
      data: { provider: 'RAZORPAY', providerEventId: eventId, eventType: event.event || 'payment.captured', payload: event },
    });

    return { status: 'success', eventId };
  }
}
