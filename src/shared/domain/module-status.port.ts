export const APPLICATION_MODULES = [
  'orders',
  'portfolio',
  'instruments',
] as const;

export type ApplicationModuleName = (typeof APPLICATION_MODULES)[number];

export type ModuleReadiness = 'ready' | 'missing';

export interface ModuleStatusSnapshot {
  name: ApplicationModuleName;
  status: ModuleReadiness;
}

export interface ModuleStatusPort {
  readonly name: ApplicationModuleName;
  check(): ModuleStatusSnapshot;
}

export abstract class ModuleRegistryPort {
  abstract register(moduleStatus: ModuleStatusPort): void;
  abstract list(): ModuleStatusPort[];
}
