---
name: vitalink-qa
description: Ejecutar pruebas de VITALINK, guardar evidencia y reproducir fallos sin debilitar los controles. Usar al cerrar un cambio o investigar un test rojo.
---

# VITALINK QA

## Propósito

Demostrar el comportamiento con comandos reales.

## Cuándo usarla

Antes de dar por cerrado un cambio de lógica, de flujo o de accesibilidad.

## Entradas

El caso afectado y si hace falta navegador.

## Pasos

1. Reproducí el fallo con `npm run test` o `npm run test:e2e`.
2. Corregí la causa. No borres la prueba ni bajes el strict.
3. Repetí la prueba afectada y la regresión cercana.
4. Si hay UI, recorré el flujo en el navegador.
5. Anotá comando, fecha y resultado en `mds/docs/TEST_REPORT.md`.

## Criterios

Los estados quedan en aprobado, fallido, bloqueado o no ejecutado. No hay un “verde” sin salida.

## Evidencia

Salida de terminal, traza de Playwright si falló, y captura solo si se tomó.

## Límites

No inventes una corrida. No uses la clave real en las pruebas de rutina. No limpies datos ajenos. Una respuesta HTTP 200 del modelo no alcanza para darla por válida.
