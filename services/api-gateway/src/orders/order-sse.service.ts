import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class OrderSseService implements OnModuleDestroy {
  private readonly logger = new Logger(OrderSseService.name);
  private customerClients = new Map<string, Set<Response>>();
  private orderClients = new Map<string, Set<Response>>();
  private keepAliveTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Keep-alive heartbeat every 20 seconds to prevent proxy timeouts
    this.keepAliveTimer = setInterval(() => {
      this.sendKeepAlive();
    }, 20000);
  }

  onModuleDestroy() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }
    this.customerClients.clear();
    this.orderClients.clear();
  }

  addCustomerClient(customerId: string, res: Response) {
    if (!this.customerClients.has(customerId)) {
      this.customerClients.set(customerId, new Set());
    }
    const clients = this.customerClients.get(customerId)!;
    clients.add(res);

    this.logger.log(
      `⚡ [Customer SSE] Client connected for customerId=${customerId} (Active streams: ${clients.size})`,
    );

    // Initial connection handshake message
    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        transport: 'SSE',
        customerId,
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );

    res.on('close', () => {
      const set = this.customerClients.get(customerId);
      if (set) {
        set.delete(res);
        if (set.size === 0) {
          this.customerClients.delete(customerId);
        }
      }
      this.logger.log(`[Customer SSE] Client disconnected: customerId=${customerId}`);
    });
  }

  addOrderClient(orderId: string, res: Response) {
    if (!this.orderClients.has(orderId)) {
      this.orderClients.set(orderId, new Set());
    }
    const clients = this.orderClients.get(orderId)!;
    clients.add(res);

    this.logger.log(
      `⚡ [Order SSE] Client connected for orderId=${orderId} (Active streams: ${clients.size})`,
    );

    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        transport: 'SSE',
        orderId,
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );

    res.on('close', () => {
      const set = this.orderClients.get(orderId);
      if (set) {
        set.delete(res);
        if (set.size === 0) {
          this.orderClients.delete(orderId);
        }
      }
    });
  }

  broadcast(payload: any) {
    const dataString = `data: ${JSON.stringify(payload)}\n\n`;

    // 1. Send to single order subscribers
    const orderId = payload.orderId || payload.id;
    if (orderId && this.orderClients.has(orderId)) {
      for (const res of this.orderClients.get(orderId)!) {
        try {
          res.write(dataString);
        } catch {
          // Socket might be closed
        }
      }
    }

    // 2. Send to customer subscribers
    const customerId = payload.customerId;
    if (customerId && this.customerClients.has(customerId)) {
      for (const res of this.customerClients.get(customerId)!) {
        try {
          res.write(dataString);
        } catch {
          // Socket might be closed
        }
      }
    }
  }

  private sendKeepAlive() {
    for (const [_, set] of this.customerClients) {
      for (const res of set) {
        try {
          res.write(': keepalive\n\n');
        } catch {}
      }
    }
    for (const [_, set] of this.orderClients) {
      for (const res of set) {
        try {
          res.write(': keepalive\n\n');
        } catch {}
      }
    }
  }
}
