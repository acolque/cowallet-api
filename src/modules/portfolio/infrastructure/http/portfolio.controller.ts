import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUserPortfolioUseCase } from '../../application/get-user-portfolio.use-case';
import {
  toUserPortfolioResponse,
  UserPortfolioResponse,
} from './user-portfolio.response';

@Controller('portfolio')
@ApiTags('portfolio')
export class PortfolioController {
  constructor(private readonly getUserPortfolio: GetUserPortfolioUseCase) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Return the user cash and asset balances' })
  async get(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserPortfolioResponse> {
    const portfolio = await this.getUserPortfolio.execute(userId);
    return toUserPortfolioResponse(portfolio);
  }
}
