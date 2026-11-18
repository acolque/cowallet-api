import { Injectable } from '@nestjs/common';
import { Instrument } from '../domain/instrument';
import { InstrumentRepository } from '../domain/instrument.repository';

const STOCK_TYPE = 'ACCIONES';

export interface SearchInstrumentsInput {
  query: string;
  limit: number;
}

@Injectable()
export class SearchInstrumentsUseCase {
  constructor(private readonly instruments: InstrumentRepository) {}

  execute(input: SearchInstrumentsInput): Promise<Instrument[]> {
    return this.instruments.search({
      query: input.query,
      limit: input.limit,
      type: STOCK_TYPE,
    });
  }
}
