import { Instrument } from './instrument';

export interface SearchInstrumentsCriteria {
  query: string;
  limit: number;
  type: string;
}

export abstract class InstrumentRepository {
  abstract search(criteria: SearchInstrumentsCriteria): Promise<Instrument[]>;
  abstract findById(id: number): Promise<Instrument | null>;
}
