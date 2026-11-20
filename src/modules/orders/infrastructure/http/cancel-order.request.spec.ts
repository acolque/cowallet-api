import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CancelOrderParams, CancelOrderRequest } from './cancel-order.request';

describe('CancelOrderRequest', () => {
  it('accepts a positive user id', async () => {
    const request = new CancelOrderRequest();
    request.userId = 7;

    await expect(validate(request)).resolves.toEqual([]);
  });

  it('rejects a user id below 1', async () => {
    const request = new CancelOrderRequest();
    request.userId = 0;
    const errors = await validate(request);

    expect(errors.some((error) => error.property === 'userId')).toBe(true);
  });
});

describe('CancelOrderParams', () => {
  it('accepts a positive integer order id from the path', async () => {
    const params = plainToInstance(CancelOrderParams, { orderId: '11' });

    await expect(validate(params)).resolves.toEqual([]);
    expect(params.orderId).toBe(11);
  });

  it('rejects zero, negatives, and non-integers', async () => {
    for (const orderId of ['0', '-1', '1.5', 'abc']) {
      const params = plainToInstance(CancelOrderParams, { orderId });
      const errors = await validate(params);

      expect(errors.some((error) => error.property === 'orderId')).toBe(true);
    }
  });
});
