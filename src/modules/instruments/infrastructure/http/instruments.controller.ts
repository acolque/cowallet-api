import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchInstrumentsUseCase } from '../../application/search-instruments.use-case';
import {
  InstrumentResponse,
  toInstrumentResponse,
} from './instrument.response';
import { SearchInstrumentsRequest } from './search-instruments.request';

const DEFAULT_LIMIT = 20;

@Controller('instruments')
@ApiTags('instruments')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
)
export class InstrumentsController {
  constructor(private readonly searchInstruments: SearchInstrumentsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Search instruments by ticker or name' })
  async search(
    @Query() request: SearchInstrumentsRequest,
  ): Promise<InstrumentResponse[]> {
    const instruments = await this.searchInstruments.execute({
      query: request.q,
      limit: request.limit ?? DEFAULT_LIMIT,
    });
    return instruments.map(toInstrumentResponse);
  }
}
