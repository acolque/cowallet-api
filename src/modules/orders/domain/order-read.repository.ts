export interface FilledInstrumentSize {
  instrumentId: number;
  netSize: string;
}

export abstract class OrderReadRepository {
  abstract sumFilledOrders(userId: number): Promise<string>;
  abstract sumLimitBuyOrders(userId: number): Promise<string>;
  abstract sumLimitSellSizeOrders(
    userId: number,
    instrumentId: number,
  ): Promise<string>;
  abstract netFilledSizeByInstrument(
    userId: number,
  ): Promise<FilledInstrumentSize[]>;
}
