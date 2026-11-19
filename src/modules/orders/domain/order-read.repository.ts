export interface FilledInstrumentSize {
  instrumentId: number;
  netSize: string;
}

export abstract class OrderReadRepository {
  abstract sumFilledCashEffect(userId: number): Promise<string>;
  abstract sumOpenLimitBuyNotional(userId: number): Promise<string>;
  abstract sumOpenLimitSellSize(
    userId: number,
    instrumentId: number,
  ): Promise<string>;
  abstract netFilledSizeByInstrument(
    userId: number,
  ): Promise<FilledInstrumentSize[]>;
}
