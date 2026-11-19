import { validate } from 'class-validator';
import { SubmitOrderBody } from './submit-order.body';

describe('SubmitOrderBody', () => {
  it('accepts a market order with a share quantity and no price', async () => {
    await expect(messages(body({ type: 'MARKET', quantity: 2 }))).resolves.toEqual(
      [],
    );
  });

  it('accepts a limit order with a price greater than zero', async () => {
    await expect(
      messages(body({ type: 'LIMIT', quantity: 30, price: '710.50' })),
    ).resolves.toEqual([]);
  });

  it('accepts an amount instead of a quantity', async () => {
    await expect(
      messages(body({ type: 'LIMIT', amount: '10000', price: '710.50' })),
    ).resolves.toEqual([]);
  });

  it('rejects a body that sends both quantity and amount, or neither', async () => {
    await expect(
      messages(body({ type: 'LIMIT', quantity: 1, amount: '10', price: '10' })),
    ).resolves.toContain('Send either quantity or amount');
    await expect(
      messages(body({ type: 'LIMIT', price: '10' })),
    ).resolves.toContain('Send either quantity or amount');
  });

  it('rejects a market order that includes a price', async () => {
    await expect(
      messages(body({ type: 'MARKET', quantity: 2, price: '930.00' })),
    ).resolves.toContain(
      'Market orders use the latest close and do not take a price',
    );
  });

  it('rejects a limit order without a positive price', async () => {
    await expect(
      messages(body({ type: 'LIMIT', quantity: 1 })),
    ).resolves.toContain('Limit orders require a price greater than zero');
    await expect(
      messages(body({ type: 'LIMIT', quantity: 1, price: '0.00' })),
    ).resolves.toContain('Limit orders require a price greater than zero');
  });

  it('accepts a cash transfer as a peso amount', async () => {
    await expect(
      messages(body({ side: 'CASH_IN', type: 'MARKET', amount: '25000' })),
    ).resolves.toEqual([]);
    await expect(
      messages(body({ side: 'CASH_OUT', type: 'MARKET', amount: '25000' })),
    ).resolves.toEqual([]);
  });

  it('rejects a cash transfer with a quantity, a price, or a limit type', async () => {
    await expect(
      messages(body({ side: 'CASH_IN', type: 'MARKET', quantity: 10 })),
    ).resolves.toContain('Cash transfers send a peso amount as a market order');
    await expect(
      messages(
        body({ side: 'CASH_OUT', type: 'MARKET', amount: '10', price: '1.00' }),
      ),
    ).resolves.toContain('Cash transfers send a peso amount as a market order');
    await expect(
      messages(
        body({ side: 'CASH_IN', type: 'LIMIT', amount: '10', price: '1.00' }),
      ),
    ).resolves.toContain('Cash transfers send a peso amount as a market order');
  });

  it('rejects a quantity above the integer column limit', async () => {
    const result = await validate(
      body({ type: 'MARKET', quantity: 2_147_483_648 }),
    );

    expect(result.some((error) => error.property === 'quantity')).toBe(true);
  });
});

function body(overrides: Partial<SubmitOrderBody>): SubmitOrderBody {
  return Object.assign(new SubmitOrderBody(), {
    userId: 7,
    instrumentId: 34,
    side: 'BUY',
    ...overrides,
  });
}

async function messages(order: SubmitOrderBody): Promise<string[]> {
  const result = await validate(order);
  return result.flatMap((error) => Object.values(error.constraints ?? {}));
}
