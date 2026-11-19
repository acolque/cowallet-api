import { Module } from '@nestjs/common';
import { InstrumentsModule } from '../instruments/instruments.module';
import { CancelOrderUseCase } from './application/cancel-order.use-case';
import { SubmitOrderUseCase } from './application/submit-order.use-case';
import { OrderRepository } from './domain/order.repository';
import { OrdersController } from './infrastructure/http/orders.controller';
import { OrdersModuleStatusAdapter } from './infrastructure/orders-module-status.adapter';
import { DrizzleOrderRepository } from './infrastructure/persistence/drizzle-order.repository';
import { OrderReadModule } from './order-read.module';

@Module({
  imports: [InstrumentsModule, OrderReadModule],
  controllers: [OrdersController],
  providers: [
    OrdersModuleStatusAdapter,
    SubmitOrderUseCase,
    CancelOrderUseCase,
    {
      provide: OrderRepository,
      useClass: DrizzleOrderRepository,
    },
  ],
})
export class OrdersModule {}
