import { Module } from '@nestjs/common';
import { OrdersModuleStatusAdapter } from './infrastructure/orders-module-status.adapter';

@Module({
  providers: [OrdersModuleStatusAdapter],
})
export class OrdersModule {}
