import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  APPLICATION_MODULES,
  ModuleRegistryPort,
  ModuleStatusSnapshot,
} from '../shared/domain/module-status.port';
import { HealthResponse, ModuleStatusResponse } from './health.response';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly moduleRegistry: ModuleRegistryPort) {}

  @Get()
  @ApiOperation({ summary: 'Report whether each module registered at startup' })
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

    return Object.assign(new HealthResponse(), {
      status: modules.every((moduleStatus) => moduleStatus.status === 'ready')
        ? 'ok'
        : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      modules: modules.map((moduleStatus) =>
        Object.assign(new ModuleStatusResponse(), moduleStatus),
      ),
    });
  }
}
