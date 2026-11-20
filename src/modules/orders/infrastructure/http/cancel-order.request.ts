import { IsInt, Min } from 'class-validator';

export class CancelOrderRequest {
  @IsInt()
  @Min(1)
  userId!: number;
}
