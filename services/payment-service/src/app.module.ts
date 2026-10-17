import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.service';
import { PaymentsService } from './payments/payments.service';
import { PaymentsController } from './payments/payments.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class AppModule {}
