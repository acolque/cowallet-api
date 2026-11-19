import { OrderReadRepository } from '../../orders/domain/order-read.repository';
import { GetAvailableSellSizeUseCase } from './get-available-sell-size.use-case';

describe('GetAvailableSellSizeUseCase', () => {
  const orderRead = {
    netFilledSizeByInstrument: jest.fn(),
    sumOpenLimitSellSize: jest.fn(),
  };
  const useCase = new GetAvailableSellSizeUseCase(
    orderRead as unknown as OrderReadRepository,
  );

  beforeEach(() => {
    orderRead.netFilledSizeByInstrument.mockReset();
    orderRead.sumOpenLimitSellSize.mockReset();
  });

  it('returns the filled net size when no limit sell is open', async () => {
    orderRead.netFilledSizeByInstrument.mockResolvedValue([
      { instrumentId: 34, netSize: '40' },
      { instrumentId: 35, netSize: '5' },
    ]);
    orderRead.sumOpenLimitSellSize.mockResolvedValue('0');

    await expect(useCase.execute(7, 34)).resolves.toBe('40');
    expect(orderRead.sumOpenLimitSellSize).toHaveBeenCalledWith(7, 34);
  });

  it('subtracts open limit sells from the filled net size', async () => {
    orderRead.netFilledSizeByInstrument.mockResolvedValue([
      { instrumentId: 34, netSize: '40' },
    ]);
    orderRead.sumOpenLimitSellSize.mockResolvedValue('30');

    await expect(useCase.execute(7, 34)).resolves.toBe('10');
  });

  it('returns zero when the user has no filled position', async () => {
    orderRead.netFilledSizeByInstrument.mockResolvedValue([]);
    orderRead.sumOpenLimitSellSize.mockResolvedValue('0');

    await expect(useCase.execute(7, 34)).resolves.toBe('0');
  });
});
