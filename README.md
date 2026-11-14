# VITALINK

Simulador local de monitoreo de salud para una tripulación ficticia. No es una herramienta clínica y no produce diagnósticos.

La documentación extendida está en la carpeta hermana [`../mds/README.md`](../mds/README.md) cuando el repo se usa dentro de la carpeta de trabajo `Nasa`. Esa carpeta no forma parte de este repositorio git.

## Requisitos

Node.js 20 o superior.

## Ejecutar

```bash
npm install
copy .env.example .env
npm run dev
```

La aplicación queda en `http://127.0.0.1:5173`. Las rutas `/api` las atiende el backend Nest en `../NASA_SPACE_APP-BACKEND`, puerto 3000. Sin `AI_API_KEY` el motor local sigue funcionando y la interfaz marca el servicio como no configurado. `npm run dev:api` inicia el backend oficial NestJS en el puerto 3000. Las variables AI_* se configuran únicamente en `../NASA_SPACE_APP-BACKEND/.env`.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Vite y backend NestJS |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run build` | Typecheck y build de producción |

El escenario inicial es “Cambio y cansancio”, con Elena Torres en 104 lpm y un autorreporte. El reloj arranca en pausa.

## Estado y continuidad local

NestJS conserva el estado de simulación por sesión y ejecuta las acciones del dominio. IndexedDB conserva una copia local. El indicador de la barra superior muestra “NestJS conectado” o “Simulador local”. Si la API deja de responder, se continúa localmente y se prepara una sesión nueva para importar esa copia al recargar. La sesión remota anterior se conserva. El enlace simulado con Tierra se controla de forma independiente.

Los diez escenarios y las reglas de análisis siguen disponibles sin API. La copia del dominio en React sirve al simulador local y a los selectores de presentación. La suite Jest del backend comprueba su paridad. Los archivos server/ conservan el servicio Hono histórico con sus pruebas y los comandos oficiales ejecutan NestJS.

La arquitectura, los contratos, las variables, los endpoints y los recursos científicos se documentan en el [README del backend](../NASA_SPACE_APP-BACKEND/README.md).
