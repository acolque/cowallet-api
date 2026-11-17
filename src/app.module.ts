import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { InstrumentsModule } from './modules/instruments/instruments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    OrdersModule,
    PortfolioModule,
    InstrumentsModule,
    HealthModule,
  ],
})
export class AppModule {}
