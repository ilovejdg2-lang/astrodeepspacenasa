---
name: vitalink-docs
description: Mantener la documentación de VITALINK sincronizada con el código, los comandos y la guía de demostración. Usar al cambiar comportamiento, scripts o estado del proyecto.
---

# VITALINK documentación

## Propósito

Que `mds` describa el código que está en `astrodeepspacenasa`, no el que se quisiera tener.

## Cuándo usarla

Al cambiar un comando, un escenario, un límite de la IA o el estado del proyecto.

## Entradas

El diff y el documento fuente de ese tema. La lista está en `mds/AGENTS.md`.

## Pasos

1. Actualizá un solo documento por tema.
2. Enlazá con rutas relativas.
3. Separá implementado de pendiente.
4. Si corriste pruebas, volcá el resultado real en `mds/docs/TEST_REPORT.md`.
5. Dejá el `README.md` del repo apuntando a `mds` sin copiar toda la guía.

## Criterios

Un comando documentado existe en `package.json`. Un escenario documentado existe en `SCENARIO_IDS`.

## Evidencia

El archivo modificado y, si aplica, la salida del comando citado.

## Límites

No crees documentos genéricos paralelos. No declares certificaciones ni una prueba de IA real si se usó un mock. No muevas `mds` dentro del git salvo que se pida.
