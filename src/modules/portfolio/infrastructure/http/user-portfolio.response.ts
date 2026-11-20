import {
  PortfolioAsset,
  UserPortfolio,
} from '../../domain/user-portfolio';

export class PortfolioAssetResponse {
  instrumentId!: number;
  ticker!: string | null;
  name!: string | null;
  netSize!: string;
  positionValueArs!: string;
  dailyReturnPercentage!: string | null;
}

export class UserPortfolioResponse {
  userId!: number;
  cashBalanceArs!: string;
  availableCashArs!: string;
  totalBalanceArs!: string;
  assets!: PortfolioAssetResponse[];
}

export function toUserPortfolioResponse(
  portfolio: UserPortfolio,
): UserPortfolioResponse {
  return Object.assign(new UserPortfolioResponse(), {
    userId: portfolio.userId,
    cashBalanceArs: portfolio.cashBalanceArs,
    availableCashArs: portfolio.availableCashArs,
    totalBalanceArs: portfolio.totalBalanceArs,
    assets: portfolio.assets.map((asset) => toPortfolioAssetResponse(asset)),
  });
}

function toPortfolioAssetResponse(asset: PortfolioAsset): PortfolioAssetResponse {
  return Object.assign(new PortfolioAssetResponse(), {
    instrumentId: asset.instrumentId,
    ticker: asset.ticker,
    name: asset.name,
    netSize: asset.netSize,
    positionValueArs: asset.positionValueArs,
    dailyReturnPercentage: asset.dailyReturnPercentage,
  });
}
