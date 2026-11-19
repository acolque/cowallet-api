import { PortfolioRepository } from '../domain/portfolio.repository';
import { GetAvailableSellSizeUseCase } from './get-available-sell-size.use-case';

describe('GetAvailableSellSizeUseCase', () => {
  const portfolio = {
    getNetInstrumentPositions: jest.fn(),
    getReservedSellSize: jest.fn(),
  };
  const useCase = new GetAvailableSellSizeUseCase(
    portfolio as unknown as PortfolioRepository,
  );

  beforeEach(() => {
    portfolio.getNetInstrumentPositions.mockReset();
    portfolio.getReservedSellSize.mockReset();
  });

  it('returns the filled net size when no limit sell is open', async () => {
    portfolio.getNetInstrumentPositions.mockResolvedValue([
      { instrumentId: 34, netSize: '40' },
      { instrumentId: 35, netSize: '5' },
    ]);
    portfolio.getReservedSellSize.mockResolvedValue('0');

    await expect(useCase.execute(7, 34)).resolves.toBe('40');
    expect(portfolio.getReservedSellSize).toHaveBeenCalledWith(7, 34);
  });

  it('subtracts open limit sells from the filled net size', async () => {
    portfolio.getNetInstrumentPositions.mockResolvedValue([
      { instrumentId: 34, netSize: '40' },
    ]);
    portfolio.getReservedSellSize.mockResolvedValue('30');

    await expect(useCase.execute(7, 34)).resolves.toBe('10');
  });

  it('returns zero when the user has no filled position', async () => {
    portfolio.getNetInstrumentPositions.mockResolvedValue([]);
    portfolio.getReservedSellSize.mockResolvedValue('0');

    await expect(useCase.execute(7, 34)).resolves.toBe('0');
  });
});
