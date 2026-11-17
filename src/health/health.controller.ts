import { Controller, Get } from '@nestjs/common';
import {
  APPLICATION_MODULES,
  ModuleRegistryPort,
  ModuleStatusSnapshot,
} from '../shared/domain/module-status.port';

interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  modules: ModuleStatusSnapshot[];
}

@Controller('health')
export class HealthController {
  constructor(private readonly moduleRegistry: ModuleRegistryPort) {}

  @Get()
  get(): HealthResponse {
    const registered = new Map(
      this.moduleRegistry.list().map((moduleStatus) => [
        moduleStatus.name,
        moduleStatus.check(),
      ]),
    );

    const modules: ModuleStatusSnapshot[] = APPLICATION_MODULES.map(
      (name) => registered.get(name) ?? { name, status: 'missing' },
    );

    return {
      status: modules.every((moduleStatus) => moduleStatus.status === 'ready')
        ? 'ok'
        : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      modules,
    };
  }
}
