import { Instrument } from '../../domain/instrument';

export class InstrumentResponse {
  id!: number;
  ticker!: string;
  name!: string;
  type!: string;
}

export function toInstrumentResponse(instrument: Instrument): InstrumentResponse {
  return Object.assign(new InstrumentResponse(), {
    id: instrument.id,
    ticker: instrument.ticker,
    name: instrument.name,
    type: instrument.type,
  });
}
