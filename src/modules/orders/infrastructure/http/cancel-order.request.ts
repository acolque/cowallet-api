import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CancelOrderParams {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId!: number;
}

export class CancelOrderRequest {
  @IsInt()
  @Min(1)
  userId!: number;
}
