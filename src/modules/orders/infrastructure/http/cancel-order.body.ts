import { IsInt, Min } from 'class-validator';

export class CancelOrderBody {
  @IsInt()
  @Min(1)
  userId!: number;
}
