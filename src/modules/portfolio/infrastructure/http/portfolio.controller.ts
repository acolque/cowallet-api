import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GetUserPortfolioUseCase } from '../../application/get-user-portfolio.use-case';
import { UserPortfolio } from '../../domain/user-portfolio';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly getUserPortfolio: GetUserPortfolioUseCase) {}

  @Get(':userId')
  get(@Param('userId', ParseIntPipe) userId: number): Promise<UserPortfolio> {
    return this.getUserPortfolio.execute(userId);
  }
}
