import { OrderReadRepository } from '../../orders/domain/order-read.repository';
import { GetAvailableCashUseCase } from './get-available-cash.use-case';

describe('GetAvailableCashUseCase', () => {
  const orderRead = {
    sumFilledCashEffect: jest.fn(),
    sumOpenLimitBuyNotional: jest.fn(),
  };
  const useCase = new GetAvailableCashUseCase(
    orderRead as unknown as OrderReadRepository,
  );

  beforeEach(() => {
    orderRead.sumFilledCashEffect.mockReset();
    orderRead.sumOpenLimitBuyNotional.mockReset();
  });

  it('subtracts open limit buy reservations from the cash balance', async () => {
    orderRead.sumFilledCashEffect.mockResolvedValue('1000.00');
    orderRead.sumOpenLimitBuyNotional.mockResolvedValue('300.50');

    await expect(useCase.execute(7)).resolves.toBe('699.50');
    expect(orderRead.sumFilledCashEffect).toHaveBeenCalledWith(7);
    expect(orderRead.sumOpenLimitBuyNotional).toHaveBeenCalledWith(7);
  });
});
