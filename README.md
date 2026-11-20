# cowallet-api

Cocos Backend Challenge

## techs
* API NestJS sobre Fastify, con arquitectura hexagonal por módulo.
* Drizzle como ORM
* PostgresSQL DB
* jest para unit test
* Pino para logging

## Módulos

En `src/modules/`:

- `orders`
- `portfolio`
- `instruments`

Cada módulo separa `domain`, `application` e `infrastructure`. Los controllers viven en infraestructura HTTP y corren sobre el adapter de Fastify.

## Arranque local

```bash
npm install
npm run start:dev
```

`GET http://localhost:3000/health` responde `ok` cuando los tres módulos se registraron al iniciar.

## Test de integración
* Se agrega un test de integración con `testcontainers` para simular una conexión a la DB con el fin de probar un caso borde de concurrencia: `usuario 1 posee 40 de size de un instrument, envia 2 requests al mismo tiempo de SELL con LIMIT, uno con size 30 y otro con size 20. El primero en llegar debe aceptarse y el segundo esperar el impacto del primero y luego rechazarse`
* Para esta prueba se requiere tener docker ejecutandose localmente
* El test se excluye para el comando npm test, para ejecutarlo: `npm run test:integration`

## Supuestos

### Portfolio

* Una posición neta negativa (`size` de ventas mayor que el de compras para un instrumento) se trata como un dato inconsistente. Ese instrumento no entra en el valor de mercado ni en `totalBalanceArs`. Para no ocultar la inconsistencia (omitiendolo en el calculo del saldo total) se deja un log con nivel `error` con la información necesaria (`userId`, `instrumentId` y `netSize`) para realizar una investigación y correción manual de ser necesario. Para el alcance del challenge solo dejo el log, pero sí sería mejor alimentar una métrica y configurar alertas apropiadas.

* Una orden `BUY` de tipo `LIMIT` en estado `NEW` todavía no se ejecutó, pero reserva capital para esa compra. `availableCashArs` es el efectivo menos la suma de `size * price` de esas órdenes. `cashBalanceArs` y `totalBalanceArs` no descuentan esa reserva. Esto para evitar que el usuario pueda ejecutar ordenes LIMIT con capital que no posee.

* Para el rendimiento de los activos, se pidió el "rendimiento total", pero por simplicidad se optó dejar el rendimiento diario (el cual está explicito como se cálcula). El total exigiría comparar el precio de cada compra con el último `close`. Si el mismo activo se compró varias veces a precios distintos, el resultado depende de una estrategia (precio promedio, precio ponderado u otra). Para no elegir una, `dailyReturnPercentage` es la variación porcentual entre `close` y `previousclose` de la última fila de `marketdata`. Si `previousclose` es nulo o cero, el rendimiento queda en `null`.

### Órdenes

* Para ordenes de tipo `LIMIT`, si el `price` de ejecución supera o es inferior al último close según corresponde (`SELL` o `BUY`), la orden queda `NEW` igualmente. Ya que para el alcance de este challenge no estamos simulando el mercado, también se agrega el supuesto de no simular las ejecuciones. Si las ordenes son válidas más allá del price, quedan en `NEW` como es requerido. Ejemplo: `Se envia una orden BUY con LIMIT 100.00, pero el ultimo close de dicho activo es 95.00`

* Una `SELL` `LIMIT` en `NEW` reserva esas acciones. La tenencia disponible es la posición neta `FILLED` menos las `SELL` `LIMIT` `NEW` del mismo instrumento, así una segunda venta no puede superar lo que todavía no se ejecutó. Cancelar la orden la saca de `NEW` y libera la reserva. Ejemplo: `Se tiene 40 de size de un activo, se decide realizar una orden de SELL LIMIT con 30, por lo que quedan 10 de dicho activo disponibles para operar`
