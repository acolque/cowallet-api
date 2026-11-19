import { InstrumentRepository } from '../domain/instrument.repository';
import { SearchInstrumentsUseCase } from './search-instruments.use-case';

describe('SearchInstrumentsUseCase', () => {
  const instruments = {
    search: jest.fn(),
  };
  const useCase = new SearchInstrumentsUseCase(
    instruments as unknown as InstrumentRepository,
  );

  beforeEach(() => {
    instruments.search.mockReset();
  });

  it('returns matches for a search that arrives with the default limit', async () => {
    const matches = [
      {
        id: 34,
        ticker: 'GGAL',
        name: 'Grupo Financiero Galicia',
        type: 'ACCIONES',
      },
    ];
    instruments.search.mockResolvedValue(matches);

    const result = await useCase.execute({ query: 'gal', limit: 20 });

    expect(instruments.search).toHaveBeenCalledWith({
      query: 'gal',
      limit: 20,
      type: 'ACCIONES',
    });
    expect(result).toEqual(matches);
  });

  it('returns an empty list when the repository finds nothing', async () => {
    instruments.search.mockResolvedValue([]);

    await expect(
      useCase.execute({ query: 'zzzz', limit: 20 }),
    ).resolves.toEqual([]);
  });

  it('propagates repository errors', async () => {
    const failure = new Error('database unavailable');
    instruments.search.mockRejectedValue(failure);

    await expect(
      useCase.execute({ query: 'gal', limit: 20 }),
    ).rejects.toBe(failure);
  });
});
