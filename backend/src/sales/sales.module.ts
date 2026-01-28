import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
