import { Module } from '@nestjs/common';
import { SearchInstrumentsUseCase } from './application/search-instruments.use-case';
import { InstrumentRepository } from './domain/instrument.repository';
import { MarketDataRepository } from './domain/market-data.repository';
import { InstrumentsController } from './infrastructure/http/instruments.controller';
import { InstrumentsModuleStatusAdapter } from './infrastructure/instruments-module-status.adapter';
import { DrizzleInstrumentRepository } from './infrastructure/persistence/drizzle-instrument.repository';
import { DrizzleMarketDataRepository } from './infrastructure/persistence/drizzle-market-data.repository';

@Module({
  controllers: [InstrumentsController],
  providers: [
    InstrumentsModuleStatusAdapter,
    SearchInstrumentsUseCase,
    {
      provide: InstrumentRepository,
      useClass: DrizzleInstrumentRepository,
    },
    {
      provide: MarketDataRepository,
      useClass: DrizzleMarketDataRepository,
    },
  ],
  exports: [InstrumentRepository, MarketDataRepository],
})
export class InstrumentsModule {}
