import { Module } from '@nestjs/common';
import { InstrumentsModuleStatusAdapter } from './infrastructure/instruments-module-status.adapter';

@Module({
  providers: [InstrumentsModuleStatusAdapter],
})
export class InstrumentsModule {}
