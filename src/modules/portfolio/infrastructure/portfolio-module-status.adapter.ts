import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  ModuleRegistryPort,
  ModuleStatusPort,
  ModuleStatusSnapshot,
} from '../../../shared/domain/module-status.port';

@Injectable()
export class PortfolioModuleStatusAdapter
  implements ModuleStatusPort, OnModuleInit
{
  readonly name = 'portfolio' as const;

  constructor(private readonly moduleRegistry: ModuleRegistryPort) {}

  onModuleInit(): void {
    this.moduleRegistry.register(this);
  }

  check(): ModuleStatusSnapshot {
    return { name: this.name, status: 'ready' };
  }
}
