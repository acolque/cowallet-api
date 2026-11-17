import { Module } from '@nestjs/common';
import { PortfolioModuleStatusAdapter } from './infrastructure/portfolio-module-status.adapter';

@Module({
  providers: [PortfolioModuleStatusAdapter],
})
export class PortfolioModule {}
