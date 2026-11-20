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
    update: jest.fn(),
    executeWithUserLock: jest.fn(),
  };
  const useCase = new CancelOrderUseCase(orders as unknown as OrderRepository);

  beforeEach(() => {
    orders.findById.mockReset();
    orders.update.mockReset();
    orders.executeWithUserLock.mockReset();
    orders.executeWithUserLock.mockImplementation(
      (_userId: number, action: () => Promise<unknown>) => action(),
    );
  });

  it('cancels a NEW order owned by the user', async () => {
    const existing = order({ status: 'NEW' });
    const cancelled = order({ status: 'CANCELLED' });
    orders.findById.mockResolvedValue(existing);
    orders.update.mockResolvedValue(cancelled);

    await expect(useCase.execute(11, 7)).resolves.toBe(cancelled);
    expect(orders.executeWithUserLock).toHaveBeenCalledWith(7, expect.any(Function));
    expect(orders.findById).toHaveBeenCalledWith(11);
    expect(orders.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 11, userId: 7, status: 'CANCELLED' }),
    );
  });

  it('conflicts when the order exists but is not NEW', async () => {
    orders.findById.mockResolvedValue(order({ status: 'FILLED' }));

    await expect(useCase.execute(11, 7)).rejects.toBeInstanceOf(
      OrderNotCancellableError,
    );
    expect(orders.update).not.toHaveBeenCalled();
  });

  it('reports not found when the order does not exist or belongs to someone else', async () => {
    orders.findById.mockResolvedValue(null);
    await expect(useCase.execute(11, 7)).rejects.toBeInstanceOf(OrderNotFoundError);

    orders.findById.mockResolvedValue(order({ userId: 8, status: 'NEW' }));
    await expect(useCase.execute(11, 7)).rejects.toBeInstanceOf(OrderNotFoundError);
    expect(orders.update).not.toHaveBeenCalled();
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
