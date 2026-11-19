export interface InstrumentPosition {
  instrumentId: number;
  netSize: string;
}

export interface InstrumentPrice {
  instrumentId: number;
  close: string;
  previousClose: string | null;
  ticker: string | null;
  name: string | null;
}

export abstract class PortfolioRepository {
  abstract getCashBalanceArs(userId: number): Promise<string>;
  abstract getReservedBuyCashArs(userId: number): Promise<string>;
  abstract getReservedSellSize(
    userId: number,
    instrumentId: number,
  ): Promise<string>;
  abstract getNetInstrumentPositions(
    userId: number,
  ): Promise<InstrumentPosition[]>;
  abstract getLatestPrices(instrumentIds: number[]): Promise<InstrumentPrice[]>;
}
