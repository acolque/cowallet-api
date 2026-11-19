import { Injectable } from '@nestjs/common';
import { PortfolioRepository } from '../domain/portfolio.repository';

@Injectable()
export class GetLatestCloseUseCase {
  constructor(private readonly portfolio: PortfolioRepository) {}

  async execute(instrumentId: number): Promise<string | null> {
    const [price] = await this.portfolio.getLatestPrices([instrumentId]);
    return price?.close ?? null;
  }
}
