import { Injectable, OnModuleInit, OnModuleDestroy, Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    let url = process.env.DATABASE_URL || '';
    // Fix: Supabase direct db.*.supabase.co:5432 is IPv6-only, which cloud hosts like Render cannot reach.
    // Automatically translate to Supabase's dedicated IPv4 Pooler:
    if (url.includes('db.wizavsjoszlmiffmdqib.supabase.co')) {
      url = url
        .replace('db.wizavsjoszlmiffmdqib.supabase.co', 'aws-0-ap-northeast-1.pooler.supabase.com')
        .replace('postgres:', 'postgres.wizavsjoszlmiffmdqib:');
    }

    super({
      datasources: url ? { db: { url } } : undefined,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma connected to PostgreSQL successfully');
    } catch (err: any) {
      console.error('⚠️ Database connection warning (non-fatal):', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
