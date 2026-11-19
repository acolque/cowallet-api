import { addDecimal, multiplyDecimal } from '../../../shared/domain/decimal';

export function availableCashArs(
  cashBalanceArs: string,
  reservedBuyCashArs: string,
): string {
  return addDecimal(cashBalanceArs, multiplyDecimal(reservedBuyCashArs, '-1'));
}
