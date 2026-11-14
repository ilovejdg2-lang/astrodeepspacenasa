---
name: vitalink-simulation
description: Implementar o revisar escenarios reproducibles, el reloj y las invariantes compartidas de VITALINK. Usar al tocar escenarios, mediciones, alertas o el reductor.
---

# VITALINK simulación

## Propósito

Que el mismo escenario y la misma semilla produzcan el mismo estado, y que ese estado se vea igual en todas las pantallas.

## Cuándo usarla

Al cambiar `src/domain/scenarios.ts`, `reduce.ts`, el reloj o un selector.

## Entradas

Escenario, semilla y la invariante que debe seguir siendo cierta.

## Pasos

1. Generá lecturas solo desde la semilla y el reloj de la misión.
2. Separá `measuredAt`, `receivedAt` y `simulatedAt`.
3. Si faltan datos, el estado observado no es estable.
4. Un rechazo de mensaje no crea evidencia confiable ni una alerta duplicada.
5. Resolver un sensor no cierra el episodio.
6. Agregá el caso en `src/domain/domain.test.ts` y corré `npm run test`.

## Criterios

Pausa, velocidad y reinicio se comportan como dice `mds/docs/SIMULATION.md`.

## Evidencia

Salida de Vitest del caso nuevo y, si cambia la pantalla, una pasada por monitor y alertas.

## Límites

No usar aleatoriedad por render. No llamar ataque a una serie congelada. No avanzar la cola de Tierra solo porque el reloj corre.
