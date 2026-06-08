# KRONOS Agent System

Sistema de 4 agentes autónomos que analizan, planifican e implementan mejoras al proyecto de forma continua.

## Agentes

| Agente | Archivo | Rol |
|--------|---------|-----|
| **Kairos** | `kairos.js` | **Arquitecto experto.** Conoce todo KRONOS y responde "¿qué le falta para estar funcionando en la web?": audita envs, despliegue (Render/Vercel), cableado de rutas, integraciones y páginas; reporta por severidad, encola gaps y auto-arregla lo seguro |
| **Task Master** | `task-master.js` | Analiza el proyecto, detecta gaps y genera cola de tareas priorizada en `tasks.json` |
| **Builder Alpha** | `builder-alpha.js` | Implementa features y mejoras de UX/API pendientes |
| **Pelos** | `pelos.js` | Implementa seguridad, tests y auto-detecta problemas comunes |

## Kairos — el experto del proyecto

Kairos sabe qué ES y qué CONLLEVA KRONOS (red social + e-commerce + delivery + wallet/token + IA + web3) y audita si está listo para producción:

- **Despliegue/web** — render.yaml, vercel.json, build del cliente, healthCheck, API URL.
- **Variables de entorno** — vars usadas en código pero no documentadas en `.env.example`, no declaradas en `render.yaml`, secretos placeholder, e incoherencias (p.ej. `SMTP_*` vs `EMAIL_*`).
- **Cableado de rutas** — rutas en `server/routes/` que no están registradas en `server.js` (endpoints muertos).
- **Integraciones** — Stripe, Cloudinary, OpenAI, DeepL, Web3, Push, Email, OAuth: detecta las que están a medias.
- **Frontend** — páginas en `client/src/pages/` sin `<Route>` en `App.jsx`.

```powershell
node agents/kairos.js            # auditoría + informe + encola tareas
node agents/kairos.js --report   # solo informe en consola (no escribe nada)
node agents/kairos.js --fix      # además aplica los auto-fixes seguros
node agents/kairos.js --json     # informe como JSON
```

Auto-fixes seguros: registrar rutas huérfanas en `server.js` y documentar envs faltantes en `.env.example`. El informe completo queda en `agents/logs/kairos-report.json`.

## Uso

```powershell
# Ciclo completo (recomendado) — empieza por la auditoría de Kairos
node agents/orchestrator.js

# Solo auditoría experta de Kairos
node agents/orchestrator.js --audit

# Ver estado actual de la cola
node agents/orchestrator.js --status

# Solo generar tareas
node agents/orchestrator.js --plan

# Solo correr Builder Alpha
node agents/orchestrator.js --build

# Solo correr Pelos
node agents/orchestrator.js --fix

# Correr hasta vaciar la cola
node agents/orchestrator.js --all

# Dry run (no escribe archivos)
node agents/orchestrator.js --dry
```

## Cola de tareas (`tasks.json`)

El Task Master genera tareas con estos estados:

- `pending` — esperando ser ejecutada
- `in_progress` — siendo implementada ahora
- `done` — completada
- `error` — falló, revisar `notes`
- `needs_human` — requiere implementación manual

## Tipos de tareas

| Tipo | Agente | Descripción |
|------|--------|-------------|
| `security` | Pelos | Rate limiting, helmet, validaciones |
| `test` | Pelos | Smoke tests, unit tests |
| `feature` | Builder Alpha | Nuevas funcionalidades |
| `improvement` | Builder Alpha | Mejoras de UX, performance, API |

## Logs

- `agents/logs/orchestrator.log`
- `agents/logs/builder-alpha.log`
- `agents/logs/pelos.log`
- `agents/logs/completed.json` — historial de tareas completadas

## Agregar tareas custom

Edita `task-master.js` → array `TASK_CATALOG` y agrega tu tarea:

```js
{
  id: 'feat-mi-feature',          // único, kebab-case
  type: 'feature',                // feature | improvement | security | test
  priority: 3,                    // 1=urgente, 10=backlog
  title: 'Nombre descriptivo',
  description: 'Qué hace y por qué',
  files: ['client/src/...'],      // archivos involucrados
  acceptance: ['criterio 1'],     // cómo saber que está listo
}
```

Para que Builder Alpha lo implemente automáticamente, agrega también una entrada en `IMPLEMENTATIONS` de `builder-alpha.js`:

```js
'feat-mi-feature': () => {
  writeFile('client/src/...', `código aquí`);
}
```

## Próximas tareas en cola

Corre `node agents/orchestrator.js --status` para ver el estado actual.
