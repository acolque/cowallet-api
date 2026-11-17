import { Global, Module } from '@nestjs/common';
import { ModuleRegistryPort } from './domain/module-status.port';
import { InMemoryModuleRegistry } from './infrastructure/in-memory-module-registry';

@Global()
@Module({
  providers: [
    {
      provide: ModuleRegistryPort,
      useClass: InMemoryModuleRegistry,
    },
  ],
  exports: [ModuleRegistryPort],
})
export class SharedModule {}
