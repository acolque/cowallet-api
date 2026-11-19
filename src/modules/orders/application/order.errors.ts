export class InvalidOrderRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrderRequestError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}

export class InstrumentNotFoundError extends Error {
  constructor() {
    super('Instrument not found');
    this.name = 'InstrumentNotFoundError';
  }
}

export class InstrumentNotTradableError extends Error {
  constructor() {
    super('Instrument is not a stock');
    this.name = 'InstrumentNotTradableError';
  }
}

export class MarketPriceUnavailableError extends Error {
  constructor() {
    super('Market price is unavailable');
    this.name = 'MarketPriceUnavailableError';
  }
}

export class AmountBelowOneShareError extends Error {
  constructor() {
    super('Amount does not cover one share');
    this.name = 'AmountBelowOneShareError';
  }
}

export class OrderNotFoundError extends Error {
  constructor() {
    super('Order not found');
    this.name = 'OrderNotFoundError';
  }
}

export class OrderNotCancellableError extends Error {
  constructor() {
    super('Only NEW orders can be cancelled');
    this.name = 'OrderNotCancellableError';
  }
}
