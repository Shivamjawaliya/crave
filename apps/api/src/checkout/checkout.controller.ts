import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckoutService, QuoteRequest } from './checkout.service';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('quote')
  @ApiOperation({ summary: 'Calculate official server-side price, taxes, and fees' })
  async getQuote(@Body() body: QuoteRequest) {
    return this.checkoutService.calculateQuote(body);
  }
}
