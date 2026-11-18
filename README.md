# cowallet-api

Cocos Backend Challenge

API NestJS sobre Fastify, con arquitectura hexagonal por módulo.

## Módulos

En `src/modules/`:

- `orders`
- `portfolio`
- `instruments`

Cada módulo separa `domain`, `application` e `infrastructure`. Los controllers viven en infraestructura HTTP y corren sobre el adapter de Fastify. `health` es la excepción: un controller plano, sin esas capas.

## Arranque local

```bash
npm install
npm run start:dev
```

`GET http://localhost:3000/health` responde `ok` cuando los tres módulos se registraron al iniciar.

## Supuestos

Una posición neta negativa (`size` de ventas mayor que el de compras para un instrumento) se trata como un dato inconsistente. Ese instrumento no entra en el valor de mercado ni en `totalBalanceArs`. El caso de uso deja un log de Pino en nivel `error` con `userId`, `instrumentId` y `netSize` para investigar y corregir el dato a mano.
