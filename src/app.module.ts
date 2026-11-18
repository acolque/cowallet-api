import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { InstrumentsModule } from './modules/instruments/instruments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    LoggerModule.forRoot(),
    SharedModule,
    DatabaseModule,
    OrdersModule,
    PortfolioModule,
    InstrumentsModule,
    HealthModule,
  ],
})
export class AppModule {}
