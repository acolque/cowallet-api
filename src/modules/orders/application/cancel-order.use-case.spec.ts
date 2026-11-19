import { Order, OrderStatus } from '../domain/order';
import { OrderRepository } from '../domain/order.repository';
import { CancelOrderUseCase } from './cancel-order.use-case';
import {
  OrderNotCancellableError,
  OrderNotFoundError,
} from './order.errors';

describe('CancelOrderUseCase', () => {
  const orders = {
    userExists: jest.fn(),
    insert: jest.fn(),
    findById: jest.fn(),
    cancelIfNew: jest.fn(),
    executeWithUserLock: jest.fn(),
  };
  const useCase = new CancelOrderUseCase(orders as unknown as OrderRepository);

  beforeEach(() => {
    orders.cancelIfNew.mockReset();
    orders.findById.mockReset();
    orders.executeWithUserLock.mockReset();
    orders.executeWithUserLock.mockImplementation(
      (_userId: number, action: () => Promise<unknown>) => action(),
    );
  });

  it('cancels a NEW order owned by the user', async () => {
    const cancelled = order({ status: 'CANCELLED' });
    orders.cancelIfNew.mockResolvedValue(cancelled);

    await expect(useCase.execute(11, 7)).resolves.toBe(cancelled);
    expect(orders.executeWithUserLock).toHaveBeenCalledWith(7, expect.any(Function));
    expect(orders.cancelIfNew).toHaveBeenCalledWith(11, 7);
    expect(orders.findById).not.toHaveBeenCalled();
  });

  it('conflicts when the order exists but is not NEW', async () => {
    orders.cancelIfNew.mockResolvedValue(null);
    orders.findById.mockResolvedValue(order({ status: 'FILLED' }));

    await expect(useCase.execute(11, 7)).rejects.toBeInstanceOf(
      OrderNotCancellableError,
    );
  });

  it('reports not found when the order does not exist or belongs to someone else', async () => {
    orders.cancelIfNew.mockResolvedValue(null);
    orders.findById.mockResolvedValue(null);
    await expect(useCase.execute(11, 7)).rejects.toBeInstanceOf(OrderNotFoundError);

    orders.findById.mockResolvedValue(order({ userId: 8, status: 'NEW' }));
    await expect(useCase.execute(11, 7)).rejects.toBeInstanceOf(OrderNotFoundError);
  });
});

function order(overrides: { userId?: number; status?: OrderStatus } = {}): Order {
  return new Order(
    11,
    overrides.userId ?? 7,
    34,
    30,
    '950.00',
    'LIMIT',
    'SELL',
    overrides.status ?? 'NEW',
    new Date('2026-01-01T00:00:00Z'),
  );
}
