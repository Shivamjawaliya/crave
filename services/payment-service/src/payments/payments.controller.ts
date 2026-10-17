import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payment Microservice')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('razorpay/order')
  @ApiOperation({ summary: 'Create Razorpay server order' })
  createOrder(@Body() body: { orderId: string }) {
    return this.paymentsService.createRazorpayOrder(body.orderId);
  }

  @Post('razorpay/verify')
  @ApiOperation({ summary: 'Verify Razorpay checkout signature' })
  verifyPayment(@Body() body: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    return this.paymentsService.verifyPayment(body.orderId, body);
  }

  @Post('webhooks/razorpay')
  @ApiOperation({ summary: 'Process Razorpay webhook' })
  webhook(@Headers('x-razorpay-signature') signature: string, @Body() payload: any) {
    return this.paymentsService.handleWebhook(signature || '', payload);
  }
}
