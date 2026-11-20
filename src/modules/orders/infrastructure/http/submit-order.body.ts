import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { compareDecimal } from '../../../../shared/domain/decimal';
import { OrderSide, OrderType } from '../../domain/order';

const MAX_SHARE_QUANTITY = 2_147_483_647;
const PRICE = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

@ValidatorConstraint({ name: 'submitOrderShape', async: false })
class SubmitOrderShapeConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    return shapeMessage(args.object as SubmitOrderBody) === null;
  }

  defaultMessage(args: ValidationArguments): string {
    return shapeMessage(args.object as SubmitOrderBody) ?? 'Invalid order';
  }
}

export class SubmitOrderBody {
  @IsInt()
  @Min(1)
  userId!: number;

  @IsInt()
  @Min(1)
  instrumentId!: number;

  @IsIn(['BUY', 'SELL', 'CASH_IN', 'CASH_OUT'])
  side!: OrderSide;

  @IsIn(['MARKET', 'LIMIT'])
  @Validate(SubmitOrderShapeConstraint)
  type!: OrderType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_SHARE_QUANTITY)
  quantity?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/, {
    message: 'Amount must be a positive whole number of pesos',
  })
  amount?: string;

  @IsOptional()
  @IsString()
  @Matches(PRICE, {
    message: 'Price must be a number with up to two decimal places',
  })
  price?: string;
}

function shapeMessage(body: SubmitOrderBody): string | null {
  if (body.side === 'CASH_IN' || body.side === 'CASH_OUT') {
    if (
      body.type !== 'MARKET' ||
      body.amount === undefined ||
      body.quantity !== undefined ||
      body.price !== undefined
    ) {
      return 'Cash transfers send a peso amount as a market order';
    }
    return null;
  }

  const hasQuantity = body.quantity !== undefined;
  const hasAmount = body.amount !== undefined;
  if (hasQuantity === hasAmount) {
    return 'Send either quantity or amount';
  }
  if (body.type === 'MARKET' && body.price !== undefined) {
    return 'Market orders use the latest close and do not take a price';
  }
  if (body.type === 'LIMIT' && body.price === undefined) {
    return 'Limit orders require a price greater than zero';
  }
  if (
    body.type === 'LIMIT' &&
    typeof body.price === 'string' &&
    PRICE.test(body.price) &&
    compareDecimal(body.price, '0') <= 0
  ) {
    return 'Limit orders require a price greater than zero';
  }

  return null;
}
