import { Module } from '@nestjs/common';
import { SearchInstrumentsUseCase } from './application/search-instruments.use-case';
import { InstrumentRepository } from './domain/instrument.repository';
import { InstrumentsController } from './infrastructure/http/instruments.controller';
import { InstrumentsModuleStatusAdapter } from './infrastructure/instruments-module-status.adapter';
import { DrizzleInstrumentRepository } from './infrastructure/persistence/drizzle-instrument.repository';

@Module({
  controllers: [InstrumentsController],
  providers: [
    InstrumentsModuleStatusAdapter,
    SearchInstrumentsUseCase,
    {
      provide: InstrumentRepository,
      useClass: DrizzleInstrumentRepository,
    },
  ],
})
export class InstrumentsModule {}
