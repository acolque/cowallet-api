import {
  ApplicationModuleName,
  ModuleReadiness,
} from '../shared/domain/module-status.port';

export class ModuleStatusResponse {
  name!: ApplicationModuleName;
  status!: ModuleReadiness;
}

export class HealthResponse {
  status!: 'ok' | 'degraded';
  uptimeSeconds!: number;
  modules!: ModuleStatusResponse[];
}
