---
name: vitalink-ui
description: Crear o revisar pantallas de VITALINK según sus tokens, temas, responsive y accesibilidad. Usar al tocar páginas, CSS, gráficos o diálogos del simulador.
---

# VITALINK UI

## Propósito

Mantener la interfaz espacial y médica sobria, legible en claro y oscuro, y usable con teclado.

## Cuándo usarla

Al agregar o cambiar una pantalla, un diálogo, un gráfico o el shell.

## Entradas

Pantalla afectada, tema a revisar y ancho relevante (como mínimo uno estrecho y uno de escritorio).

## Pasos

1. Reutilizá variables de `src/index.css` y componentes de `src/components`.
2. Conectá los datos con `useApp`. No dupliques el estado.
3. Revisá foco visible, nombre accesible, error de formulario junto al campo y texto además de color.
4. En menos de 1024 px, comprobá que la acción principal siga en pantalla y que no haya scroll horizontal de página.
5. Mirala en claro y oscuro.

## Criterios

El cambio responde qué pasa, qué tan confiable es el dato o qué se puede hacer, sin tarjetas repetidas sin función.

## Evidencia

Captura o revisión de navegador en los anchos tocados. Si no hubo navegador, decirlo.

## Límites

No cambiar reglas de dominio para que una pantalla se vea estable. No usar capturas de wireframes como UI. No ocultar un dato sensible solo con CSS y llamarlo permiso.
