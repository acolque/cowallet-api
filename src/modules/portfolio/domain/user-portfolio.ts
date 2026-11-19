export interface PortfolioAsset {
  instrumentId: number;
  ticker: string | null;
  name: string | null;
  netSize: string;
  positionValueArs: string;
  dailyReturnPercentage: string | null;
}

export interface UserPortfolio {
  userId: number;
  cashBalanceArs: string;
  availableCashArs: string;
  totalBalanceArs: string;
  assets: PortfolioAsset[];
}
