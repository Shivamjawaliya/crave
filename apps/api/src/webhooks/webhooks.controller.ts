import {
  Controller,
  Post,
  Headers,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive and verify Razorpay webhook' })
  async handleRazorpay(
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.webhooksService.handleRazorpayWebhook(signature || '', payload);
  }
}
