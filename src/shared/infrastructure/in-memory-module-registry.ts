import { Injectable } from '@nestjs/common';
import {
  ModuleRegistryPort,
  ModuleStatusPort,
} from '../domain/module-status.port';

@Injectable()
export class InMemoryModuleRegistry extends ModuleRegistryPort {
  private readonly modules = new Map<string, ModuleStatusPort>();

  register(moduleStatus: ModuleStatusPort): void {
    this.modules.set(moduleStatus.name, moduleStatus);
  }

  list(): ModuleStatusPort[] {
    return [...this.modules.values()];
  }
}
