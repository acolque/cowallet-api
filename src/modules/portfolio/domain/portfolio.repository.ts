export interface InstrumentPosition {
  instrumentId: number;
  netSize: string;
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
}
