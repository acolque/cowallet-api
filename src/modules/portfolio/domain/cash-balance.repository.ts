export abstract class CashBalanceRepository {
  abstract getCashBalanceArs(userId: number): Promise<string>;
}
