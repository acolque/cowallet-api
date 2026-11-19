import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SearchInstrumentsUseCase } from '../../application/search-instruments.use-case';
import { Instrument } from '../../domain/instrument';
import { SearchInstrumentsQuery } from './search-instruments.query';

const DEFAULT_LIMIT = 20;

@Controller('instruments')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
)
export class InstrumentsController {
  constructor(private readonly searchInstruments: SearchInstrumentsUseCase) {}

  @Get()
  search(@Query() query: SearchInstrumentsQuery): Promise<Instrument[]> {
    return this.searchInstruments.execute({
      query: query.q,
      limit: query.limit ?? DEFAULT_LIMIT,
    });
  }
}
