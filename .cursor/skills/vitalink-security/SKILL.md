---
name: vitalink-security
description: Revisar validaciones, roles simulados, auditoría y límites del análisis de VITALINK. Usar al tocar el servidor de IA, el HMAC, permisos o mensajes de error.
---

# VITALINK seguridad

## Propósito

Distinguir un control que el código ejecuta de una etiqueta visual.

## Cuándo usarla

Al cambiar `server/`, `shared/aiSchema.ts`, `shared/mac.ts`, el reductor de permisos o la nota privada.

## Entradas

La acción sensible y quién puede ejecutarla según `src/domain/access.ts`.

## Pasos

1. Validá la entrada en el reductor o en el servidor, no solo en el formulario.
2. Comprobá idempotencia y transiciones.
3. Para IA, verificá esquema, referencias y que el síntoma no entre al prompt de sistema.
4. Confirmá que la clave no se imprime ni viaja al cliente.
5. Actualizá `mds/docs/SECURITY.md` si el control cambió.

## Criterios

Un intento inválido no modifica stock, mediciones ni mensajes, y el aviso explica por qué.

## Evidencia

Prueba de Vitest o de `server/app.test.ts`. Si el rol es simulado, la evidencia debe decirlo.

## Límites

No presentar el HMAC embebido como autenticación frente al usuario. No agregar un backend de cuentas sin pedirlo. No registrar secretos.
