import { Module } from '@nestjs/common';
import { OrderReadRepository } from './domain/order-read.repository';
import { DrizzleOrderReadRepository } from './infrastructure/persistence/drizzle-order-read.repository';

@Module({
  providers: [
    {
      provide: OrderReadRepository,
      useClass: DrizzleOrderReadRepository,
    },
  ],
  exports: [OrderReadRepository],
})
export class OrderReadModule {}
