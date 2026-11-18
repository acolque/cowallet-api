export interface InstrumentPosition {
  instrumentId: number;
  netSize: string;
}

export interface InstrumentPrice {
  instrumentId: number;
  close: string;
}

export abstract class PortfolioRepository {
  abstract getCashBalanceArs(userId: number): Promise<string>;
  abstract getReservedBuyCashArs(userId: number): Promise<string>;
  abstract getNetInstrumentPositions(
    userId: number,
  ): Promise<InstrumentPosition[]>;
  abstract getLatestPrices(instrumentIds: number[]): Promise<InstrumentPrice[]>;
}
