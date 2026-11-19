import { PortfolioRepository } from '../domain/portfolio.repository';
import { GetAvailableCashUseCase } from './get-available-cash.use-case';

describe('GetAvailableCashUseCase', () => {
  const portfolio = {
    getCashBalanceArs: jest.fn(),
    getReservedBuyCashArs: jest.fn(),
  };
  const useCase = new GetAvailableCashUseCase(
    portfolio as unknown as PortfolioRepository,
  );

  beforeEach(() => {
    portfolio.getCashBalanceArs.mockReset();
    portfolio.getReservedBuyCashArs.mockReset();
  });

  it('subtracts open limit buy reservations from the cash balance', async () => {
    portfolio.getCashBalanceArs.mockResolvedValue('1000.00');
    portfolio.getReservedBuyCashArs.mockResolvedValue('300.50');

    await expect(useCase.execute(7)).resolves.toBe('699.50');
    expect(portfolio.getCashBalanceArs).toHaveBeenCalledWith(7);
    expect(portfolio.getReservedBuyCashArs).toHaveBeenCalledWith(7);
  });
});
