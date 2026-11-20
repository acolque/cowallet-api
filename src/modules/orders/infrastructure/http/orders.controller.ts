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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { CancelOrderRequest } from './cancel-order.request';
import { OrderResponse, toOrderResponse } from './order.response';
import { SubmitOrderRequest } from './submit-order.request';

@Controller('orders')
@ApiTags('orders')
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
  @ApiOperation({
    summary: 'Submit an order',
    description:
      'Cash transfers send a peso amount as a market order. Buy and sell send either size or amount, not both. Limit orders require a price.',
  })
  submit(@Body() request: SubmitOrderRequest): Promise<OrderResponse> {
    return this.submitOrder
      .execute(request)
      .then(toOrderResponse)
      .catch((error: unknown) => {
        throw toHttpException(error);
      });
  }

  @Post(':orderId/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a NEW order for the given user' })
  cancel(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() request: CancelOrderRequest,
  ): Promise<OrderResponse> {
    return this.cancelOrder
      .execute(orderId, request.userId)
      .then(toOrderResponse)
      .catch((error: unknown) => {
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
