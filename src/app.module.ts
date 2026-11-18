import { Module } from '@nestjs/common';
import { LoggerModule, Params } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { InstrumentsModule } from './modules/instruments/instruments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: loggerParams,
    }),
    SharedModule,
    DatabaseModule,
    OrdersModule,
    PortfolioModule,
    InstrumentsModule,
    HealthModule,
  ],
})
export class AppModule {}

function loggerParams(): Params {
  if (process.env.NODE_ENV !== 'local') {
    return {};
  }

  return {
    pinoHttp: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname,context',
          messageFormat: '{if context}[{context}] {end}{msg}',
        },
      },
    },
  };
}
