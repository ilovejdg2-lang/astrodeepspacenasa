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

La aplicación queda en `http://127.0.0.1:5173`. Las rutas `/api` las atiende el backend Nest en `../NASA_SPACE_APP-BACKEND`, puerto 3000. Sin `AI_API_KEY` el motor local sigue funcionando y la interfaz marca el servicio como no configurado. `npm run dev:api` levanta el servidor de IA que vive dentro de este repositorio, en el puerto 8787, y no es el que usa la interfaz.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Vite y servidor de IA |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run build` | Typecheck y build de producción |

El escenario inicial es “Cambio y cansancio”, con Elena Torres en 104 lpm y un autorreporte. El reloj arranca en pausa.
