import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UnprocessableEntityException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CancelOrderUseCase } from '../../application/cancel-order.use-case';
import {
  AmountBelowOneSizeError,
  InstrumentNotFoundError,
  InstrumentNotTradableError,
  InvalidOrderRequestError,
  MarketPriceUnavailableError,
  OrderNotCancellableError,
  OrderNotFoundError,
  UserNotFoundError,
} from '../../application/order.errors';
import { SubmitOrderUseCase } from '../../application/submit-order.use-case';
import { Order } from '../../domain/order';
import { CancelOrderBody } from './cancel-order.body';
import { SubmitOrderBody } from './submit-order.body';

@Controller('orders')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
)
export class OrdersController {
  constructor(
    private readonly submitOrder: SubmitOrderUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
  ) {}

  @Post()
  submit(@Body() body: SubmitOrderBody): Promise<Order> {
    return this.submitOrder.execute(body).catch((error: unknown) => {
      throw toHttpException(error);
    });
  }

  @Post(':orderId/cancel')
  @HttpCode(200)
  cancel(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: CancelOrderBody,
  ): Promise<Order> {
    return this.cancelOrder.execute(orderId, body.userId).catch((error: unknown) => {
      throw toHttpException(error);
    });
  }
}

function toHttpException(error: unknown): Error {
  if (error instanceof InvalidOrderRequestError) {
    return new BadRequestException(error.message);
  }
  if (
    error instanceof UserNotFoundError ||
    error instanceof InstrumentNotFoundError ||
    error instanceof OrderNotFoundError
  ) {
    return new NotFoundException(error.message);
  }
  if (
    error instanceof InstrumentNotTradableError ||
    error instanceof MarketPriceUnavailableError ||
    error instanceof AmountBelowOneSizeError
  ) {
    return new UnprocessableEntityException(error.message);
  }
  if (error instanceof OrderNotCancellableError) {
    return new ConflictException(error.message);
  }
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unexpected order failure');
}
