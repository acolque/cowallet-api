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
  constructor(message = 'Instrument is not a stock') {
    super(message);
    this.name = 'InstrumentNotTradableError';
  }
}

export class MarketPriceUnavailableError extends Error {
  constructor() {
    super('Market price is unavailable');
    this.name = 'MarketPriceUnavailableError';
  }
}

export class AmountBelowOneSizeError extends Error {
  constructor() {
    super('Amount does not cover one size');
    this.name = 'AmountBelowOneSizeError';
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
