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

### Portfolio

* Una posición neta negativa (`size` de ventas mayor que el de compras para un instrumento) se trata como un dato inconsistente. Ese instrumento no entra en el valor de mercado ni en `totalBalanceArs`. Para no ocultar la inconsistencia (omitiendolo en el calculo del saldo total) se deja un log con nivel `error` con la información necesaria (`userId`, `instrumentId` y `netSize`) para realizar una investigación y correción manual de ser necesario. Para el alcance del challenge solo dejo el log, pero sí sería mejor alimentar una métrica y configurar alertas apropiadas.

* Una orden `BUY` de tipo `LIMIT` en estado `NEW` todavía no se ejecutó, pero reserva capital para esa compra. `availableCashArs` es el efectivo menos la suma de `size * price` de esas órdenes. `cashBalanceArs` y `totalBalanceArs` no descuentan esa reserva. Esto para evitar que el usuario pueda ejecutar ordenes LIMIT con capital que no posee.

* Para el rendimiento de los activos, se pidió el "rendimiento total", pero por simplicidad se optó dejar el rendimiento diario (el cual está explicito como se cálcula). El total exigiría comparar el precio de cada compra con el último `close`. Si el mismo activo se compró varias veces a precios distintos, el resultado depende de una estrategia (precio promedio, precio ponderado u otra). Para no elegir una, `dailyReturnPercentage` es la variación porcentual entre `close` y `previousclose` de la última fila de `marketdata`. Si `previousclose` es nulo o cero, el rendimiento queda en `null`.

### Órdenes

* `POST /api/v1/orders` acepta compras y ventas (`BUY`, `SELL`). `CASH_IN` y `CASH_OUT` siguen siendo movimientos de efectivo y no entran por este endpoint. `POST /api/v1/orders/:orderId/cancel` con `{ userId }` cancela solo una orden `NEW` de ese usuario. Si la orden no existe o es de otro usuario, responde 404. Si existe y no está `NEW`, responde 409.

* Una `MARKET` usa el último `close` y, si alcanza el efectivo o la tenencia, queda `FILLED` en el acto. Una `LIMIT` no se ejecuta sola: si la validación pasa queda `NEW` al precio enviado, aunque el close ya sea mejor que ese límite. No hay matcher ni ejecución parcial.

* Si no alcanza el efectivo (compra) o la tenencia (venta), la orden igual se persiste, en `REJECTED`. No hay columna de motivo. Un pedido mal formado, un instrumento que no es acción, un close ausente o un monto que no cubre una acción no se persisten.

* El cliente envía una cantidad entera de acciones o un monto en pesos, no ambos. El monto se convierte con `floor(monto / precio)` y no se recorta por el saldo ni por la tenencia. Después se valida el efectivo o la tenencia sobre esa cantidad.

* Una `SELL` `LIMIT` en `NEW` reserva esas acciones. La tenencia disponible es la posición neta `FILLED` menos las `SELL` `LIMIT` `NEW` del mismo instrumento, así una segunda venta no puede superar lo que todavía no se ejecutó. Cancelar la orden la saca de `NEW` y libera la reserva. El portfolio sigue mostrando `netSize` como la tenencia ejecutada: no expone las acciones reservadas, del mismo modo que `cashBalanceArs` no descuenta la reserva de las compras límite.
