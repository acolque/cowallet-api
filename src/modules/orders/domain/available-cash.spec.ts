import { availableCashArs } from './available-cash';

describe('availableCashArs', () => {
  it('subtracts orders limit buy reservations from the cash balance', () => {
    expect(availableCashArs('1000.00', '300.00')).toBe('700.00');
  });
});
