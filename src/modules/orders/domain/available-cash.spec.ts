import { availableCashArs } from './available-cash';

describe('availableCashArs', () => {
  it('subtracts open limit buy reservations from the cash balance', () => {
    expect(availableCashArs('1000.00', '300.50')).toBe('699.50');
  });
});
