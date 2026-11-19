import { addDecimal, multiplyDecimal } from '../../../shared/domain/decimal';

export function availableSellSize(netSize: string, reservedSellSize: string): string {
  return addDecimal(netSize, multiplyDecimal(reservedSellSize, '-1'));
}
