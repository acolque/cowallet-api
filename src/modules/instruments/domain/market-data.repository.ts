export interface LatestPrice {
  instrumentId: number;
  close: string;
  previousClose: string | null;
}

export abstract class MarketDataRepository {
  abstract getLatestPrices(instrumentIds: number[]): Promise<LatestPrice[]>;
}
