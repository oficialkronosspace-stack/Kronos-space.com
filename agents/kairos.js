/**
 * KRONOS · KAIROS — ARQUITECTO EXPERTO DEL PROYECTO
 * ────────────────────────────────────────────────────────────────────────────
 * Agente experto en TODO lo que es y conlleva KRONOS (red social + e-commerce +
 * delivery + wallet/token + IA + web3). Su trabajo es responder una sola pregunta:
 *
 *      «¿Qué le hace falta a KRONOS para estar funcionando en la web?»
 *
 * Audita el proyecto de punta a punta — variables de entorno, despliegue
 * (Render + Vercel), cableado de rutas, integraciones (Stripe, Cloudinary,
 * OpenAI, DeepL, Web3, Push, Email, OAuth) y páginas del cliente — produce un
 * informe claro por severidad, encola tareas accionables en tasks.json para que
 * Builder Alpha / Pelos las implementen, y arregla por sí mismo lo que es seguro
 * automatizar (registrar rutas huérfanas, sincronizar la documentación de envs).
 *
 * Uso:
 *   node agents/kairos.js              → auditoría + informe + encola tareas
 *   node agents/kairos.js --report     → solo informe en consola (no escribe nada)
 *   node agents/kairos.js --fix        → además aplica los auto-fixes seguros
 *   node agents/kairos.js --json       → vuelca el informe como JSON
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TASKS_FILE = path.join(__dirname, 'tasks.json');
const LOG_FILE = path.join(__dirname, 'logs', 'kairos.log');
const REPORT_FILE = path.join(__dirname, 'logs', 'kairos-report.json');

// ─── Utilidades base ──────────────────────────────────────────────────────────

function log(msg) {
  const line = `[${new Date().toISOString()}] [KAIROS] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch { /* logging best-effort */ }
}

function read(rel) {
  const abs = path.join(ROOT, rel);
  try { return fs.readFileSync(abs, 'utf8'); } catch { return null; }
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

/** Recorre un directorio y devuelve rutas relativas a ROOT que cumplen el filtro. */
function walk(relDir, exts) {
  const out = [];
  const base = path.join(ROOT, relDir);
  if (!fs.existsSync(base)) return out;
  const stack = [base];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'build') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { stack.push(full); continue; }
      if (!exts || exts.some(x => e.name.endsWith(x))) {
        out.push(path.relative(ROOT, full));
      }
    }
  }
  return out;
}

// ─── Modelo de dominio: lo que ES KRONOS ───────────────────────────────────────
// Mapa de las integraciones que el proyecto declara querer tener. Kairos usa esto
// como "verdad esperada" y la contrasta contra lo que realmente está cableado.

const INTEGRATIONS = [
  {
    id: 'mongodb',     name: 'MongoDB (base de datos)',
    dep: 'mongoose',   env: ['MONGODB_URI'], code: ['server/config/database.js'], critical: true,
  },
  {
    id: 'auth-jwt',    name: 'Autenticación JWT',
    dep: 'jsonwebtoken', env: ['JWT_SECRET'], code: ['server/routes/auth.js'], critical: true,
  },
  {
    id: 'stripe',      name: 'Pagos / Suscripciones (Stripe)',
    dep: 'stripe',     env: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    code: ['server/routes/checkout.js', 'server/routes/subscription.js'], critical: true,
  },
  {
    id: 'cloudinary',  name: 'Almacenamiento multimedia (Cloudinary)',
    dep: 'cloudinary', env: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    code: ['server/routes/multimedia.js'], critical: true,
  },
  {
    id: 'openai',      name: 'IA generativa (OpenAI)',
    dep: 'openai',     env: ['OPENAI_API_KEY'], code: ['server/services/aiService.js'], critical: false,
  },
  {
    id: 'deepl',       name: 'Traducción (DeepL)',
    dep: null,         env: ['DEEPL_API_KEY'], code: ['server/routes/translation.js'], critical: false,
  },
  {
    id: 'web3',        name: 'Token KRO / Web3 (ethers + Infura)',
    dep: 'ethers',     env: ['INFURA_API_KEY', 'SEPOLIA_RPC_URL', 'KRONOS_TOKEN_ADDRESS'],
    code: ['server/services/tokenService.js'], critical: false,
  },
  {
    id: 'push',        name: 'Notificaciones push (Web Push / VAPID)',
    dep: 'web-push',   env: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'],
    code: ['server/services/pushService.js'], critical: false,
  },
  {
    id: 'email',       name: 'Email transaccional (Nodemailer)',
    dep: 'nodemailer', env: ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD'],
    code: ['server/services/emailService.js'], critical: false,
  },
  {
    id: 'oauth',       name: 'Login social (Google / Facebook OAuth)',
    dep: 'passport',   env: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    code: [], critical: false,
  },
];

// Valores que delatan un secreto SIN configurar (placeholder dejado en el ejemplo).
const PLACEHOLDER_RE = /^$|cambiame|tu_|tu-|xxxx|pk_test_$|sk-proj-tu|_aqui|direccion_del|example|changeme/i;

// ─── Auditoría: variables de entorno ────────────────────────────────────────────

function parseEnvKeys(content) {
  if (!content) return {};
  const map = {};
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    map[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return map;
}

function parseRenderKeys(content) {
  if (!content) return [];
  // Captura "- key: NOMBRE" del render.yaml sin dependencias YAML externas.
  return [...content.matchAll(/-\s*key:\s*([A-Z0-9_]+)/g)].map(m => m[1]);
}

function collectEnvUsage() {
  const server = new Set();
  const client = new Set();
  const re = /process\.env\.([A-Z0-9_]+)/g;
  for (const f of walk('server', ['.js'])) {
    const c = read(f); if (!c) continue;
    for (const m of c.matchAll(re)) server.add(m[1]);
  }
  for (const f of walk('client/src', ['.js', '.jsx'])) {
    const c = read(f); if (!c) continue;
    for (const m of c.matchAll(re)) client.add(m[1]);
  }
  return { server: [...server], client: [...client] };
}

function auditEnv() {
  const findings = [];
  const envExample = parseEnvKeys(read('.env.example'));
  const renderKeys = parseRenderKeys(read('render.yaml'));
  const usage = collectEnvUsage();

  const exampleKeys = new Set(Object.keys(envExample));
  const renderSet = new Set(renderKeys);

  // 1) Vars usadas en el servidor pero no documentadas en .env.example.
  for (const key of usage.server) {
    if (key === 'NODE_ENV' || key === 'PORT' || key === 'npm_package_version') continue;
    if (!exampleKeys.has(key)) {
      findings.push({
        sev: 'warn', area: 'env',
        msg: `El servidor usa process.env.${key} pero NO está en .env.example (riesgo: se olvida al desplegar).`,
        fixable: true, fixKind: 'env-doc', key,
      });
    }
    // Var de servidor (no REACT_APP_) que no está declarada en render.yaml.
    if (!key.startsWith('REACT_APP_') && !renderSet.has(key)) {
      findings.push({
        sev: 'warn', area: 'env',
        msg: `process.env.${key} no está declarada en render.yaml — Render no la inyectará en producción.`,
        fixable: false,
      });
    }
  }

  // 2) Secretos críticos con valor placeholder en .env.example (informativo).
  for (const [key, val] of Object.entries(envExample)) {
    const isSecret = /KEY|SECRET|TOKEN|URI|PASS|PASSWORD/i.test(key);
    if (isSecret && PLACEHOLDER_RE.test(val)) {
      findings.push({
        sev: 'info', area: 'env',
        msg: `${key} en .env.example es un placeholder — recuerda poner el valor real en Render/Vercel (no en Git).`,
        fixable: false,
      });
    }
  }

  // 3) Incoherencia conocida: nombres de env de email distintos entre archivos.
  const emailExample = Object.keys(envExample).filter(k => /^SMTP_/.test(k));
  const emailRender = renderKeys.filter(k => /^EMAIL_/.test(k));
  if (emailExample.length && emailRender.length) {
    findings.push({
      sev: 'error', area: 'env',
      msg: `Incoherencia de email: .env.example usa ${emailExample.join(', ')} pero render.yaml usa ${emailRender.join(', ')}. El código lee uno solo — unifica los nombres o el envío de correo fallará en producción.`,
      fixable: false,
    });
  }

  return findings;
}

// ─── Auditoría: cableado de rutas del servidor ─────────────────────────────────

function auditRoutes() {
  const findings = [];
  const serverJs = read('server/server.js');
  if (!serverJs) return findings;

  const routeFiles = walk('server/routes', ['.js']).map(f => path.basename(f, '.js'));
  for (const name of routeFiles) {
    const registered = new RegExp(`require\\(['"]\\./routes/${name}['"]\\)`).test(serverJs);
    if (!registered) {
      findings.push({
        sev: 'error', area: 'routes',
        msg: `La ruta server/routes/${name}.js existe pero NO está registrada en server.js (endpoint muerto, inaccesible desde la web).`,
        fixable: true, fixKind: 'register-route', route: name,
      });
    }
  }
  return findings;
}

// ─── Auditoría: páginas del cliente sin ruta ────────────────────────────────────

function auditClientPages() {
  const findings = [];
  const app = read('client/src/App.jsx');
  if (!app) return findings;

  const SKIP = new Set(['KronosMockups']); // showcases internos
  for (const f of walk('client/src/pages', ['.jsx'])) {
    const name = path.basename(f, '.jsx');
    if (SKIP.has(name)) continue;
    // Una página "conectada" se importa o referencia por nombre en App.jsx.
    if (!app.includes(name)) {
      findings.push({
        sev: 'warn', area: 'client',
        msg: `La página ${f} existe pero no aparece en App.jsx — probablemente no tiene <Route> y el usuario no puede llegar a ella.`,
        fixable: false,
      });
    }
  }
  return findings;
}

// ─── Auditoría: integraciones completas vs a medias ────────────────────────────

function loadDeps() {
  const s = JSON.parse(read('server/package.json') || '{}');
  const c = JSON.parse(read('client/package.json') || '{}');
  return {
    server: { ...(s.dependencies || {}), ...(s.devDependencies || {}) },
    client: { ...(c.dependencies || {}), ...(c.devDependencies || {}) },
  };
}

function auditIntegrations() {
  const findings = [];
  const deps = loadDeps();
  const envExample = parseEnvKeys(read('.env.example'));
  const renderKeys = new Set(parseRenderKeys(read('render.yaml')));
  const declared = new Set([...Object.keys(envExample), ...renderKeys]);

  for (const intg of INTEGRATIONS) {
    const missing = [];
    if (intg.dep && !deps.server[intg.dep]) missing.push(`dependencia "${intg.dep}" no instalada`);
    for (const e of intg.env) if (!declared.has(e)) missing.push(`falta var ${e}`);
    for (const c of intg.code) if (!exists(c)) missing.push(`falta archivo ${c}`);

    if (missing.length) {
      const sev = intg.critical ? 'error' : 'warn';
      findings.push({
        sev, area: 'integration', intg: intg.id,
        msg: `${intg.name}: integración incompleta → ${missing.join('; ')}.`,
        fixable: false,
      });
    }
  }
  return findings;
}

// ─── Auditoría: listo para desplegar en la web ─────────────────────────────────

function auditDeploy() {
  const findings = [];

  if (!exists('render.yaml')) {
    findings.push({ sev: 'error', area: 'deploy', msg: 'Falta render.yaml — el backend no tiene definición de despliegue en Render.', fixable: false });
  } else {
    const render = read('render.yaml');
    const m = render.match(/healthCheckPath:\s*(\S+)/);
    if (m) {
      const serverJs = read('server/server.js') || '';
      if (!serverJs.includes(m[1])) {
        findings.push({ sev: 'warn', area: 'deploy', msg: `healthCheckPath "${m[1]}" del render.yaml no parece existir en server.js — Render marcará el servicio como caído.`, fixable: false });
      }
    }
  }

  if (!exists('vercel.json')) {
    findings.push({ sev: 'error', area: 'deploy', msg: 'Falta vercel.json — el frontend no tiene configuración de build/SPA en Vercel.', fixable: false });
  }

  const clientPkg = JSON.parse(read('client/package.json') || '{}');
  if (!clientPkg.scripts || !clientPkg.scripts.build) {
    findings.push({ sev: 'error', area: 'deploy', msg: 'El cliente no tiene script "build" — Vercel no podrá compilar el frontend.', fixable: false });
  }

  // El cliente necesita apuntar al backend de producción, no a localhost.
  const example = parseEnvKeys(read('.env.example'));
  if (example.REACT_APP_API_URL && /localhost/.test(example.REACT_APP_API_URL)) {
    findings.push({ sev: 'info', area: 'deploy', msg: 'REACT_APP_API_URL apunta a localhost en .env.example — en Vercel debe ser la URL de Render terminada en /api.', fixable: false });
  }
  return findings;
}

// ─── Auto-fixes seguros ─────────────────────────────────────────────────────────

function applyFixes(findings, dryRun) {
  const applied = [];

  // 1) Registrar rutas huérfanas en server.js (antes del 404 handler / al final del bloque de rutas).
  const routeFixes = findings.filter(f => f.fixKind === 'register-route');
  if (routeFixes.length) {
    let serverJs = read('server/server.js');
    const anchor = "app.use('/api/health', require('./routes/health'));";
    if (serverJs && serverJs.includes(anchor)) {
      let insertion = '';
      for (const f of routeFixes) {
        const line = `app.use('/api/${f.route}', require('./routes/${f.route}')); // [auto] registrado por Kairos`;
        if (!serverJs.includes(`require('./routes/${f.route}')`)) insertion += '\n' + line;
        applied.push(`registrar ruta /api/${f.route}`);
      }
      if (insertion && !dryRun) {
        serverJs = serverJs.replace(anchor, anchor + insertion);
        fs.writeFileSync(path.join(ROOT, 'server/server.js'), serverJs);
      }
    }
  }

  // 2) Documentar en .env.example las vars que el código usa pero no están listadas.
  const envFixes = findings.filter(f => f.fixKind === 'env-doc');
  if (envFixes.length) {
    let envFile = read('.env.example') || '';
    let block = '\n# ============ Añadidas por Kairos (usadas en código, sin documentar) ============\n';
    let added = 0;
    for (const f of envFixes) {
      if (!new RegExp(`^${f.key}=`, 'm').test(envFile)) { block += `${f.key}=\n`; added++; applied.push(`documentar env ${f.key}`); }
    }
    if (added && !dryRun) fs.appendFileSync(path.join(ROOT, '.env.example'), block);
  }

  return applied;
}

// ─── Encolar tareas accionables en tasks.json ──────────────────────────────────

function pushTasks(findings) {
  let tasks = [];
  if (fs.existsSync(TASKS_FILE)) {
    try { tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8')); } catch { tasks = []; }
  }
  const known = new Set(tasks.map(t => t.id));
  let added = 0;

  for (const f of findings) {
    if (f.sev === 'info') continue; // info no genera tarea
    const id = `kairos-${f.area}-${(f.key || f.route || f.intg || f.msg).toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`;
    if (known.has(id)) continue;
    tasks.push({
      id,
      type: f.sev === 'error' ? 'security' : 'improvement',
      priority: f.sev === 'error' ? 1 : 4,
      title: f.msg.slice(0, 90),
      description: f.msg,
      files: f.route ? [`server/routes/${f.route}.js`, 'server/server.js'] : [],
      acceptance: ['Resuelto y verificado en producción'],
      status: f.fixable ? 'pending' : 'needs_human',
      source: 'kairos',
      detectedAt: new Date().toISOString(),
    });
    known.add(id);
    added++;
  }

  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  return added;
}

// ─── Informe en consola ─────────────────────────────────────────────────────────

function printReport(report) {
  const { findings } = report;
  const icon = { error: '🔴', warn: '🟡', info: '🔵' };
  const groups = { deploy: 'DESPLIEGUE / WEB', env: 'VARIABLES DE ENTORNO', routes: 'CABLEADO DE RUTAS', integration: 'INTEGRACIONES', client: 'FRONTEND' };

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   KAIROS · ¿QUÉ LE FALTA A KRONOS PARA ESTAR EN LA WEB?  ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const counts = findings.reduce((a, f) => { a[f.sev] = (a[f.sev] || 0) + 1; return a; }, {});
  console.log(`\n  🔴 Bloqueantes: ${counts.error || 0}   🟡 Pendientes: ${counts.warn || 0}   🔵 Notas: ${counts.info || 0}\n`);

  for (const [area, title] of Object.entries(groups)) {
    const items = findings.filter(f => f.area === area);
    if (!items.length) continue;
    console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 40 - title.length))}`);
    items.sort((a, b) => ({ error: 0, warn: 1, info: 2 }[a.sev] - { error: 0, warn: 1, info: 2 }[b.sev]));
    for (const f of items) {
      console.log(`  ${icon[f.sev]} ${f.msg}${f.fixable ? '  ⟵ auto-fix disponible' : ''}`);
    }
  }

  if (!findings.length) console.log('\n  ✅ Sin gaps detectados. KRONOS parece listo para producción.\n');
  console.log('');
}

// ─── Orquestación del agente ────────────────────────────────────────────────────

function audit() {
  log('=== KAIROS iniciando auditoría completa de KRONOS ===');
  const findings = [
    ...auditDeploy(),
    ...auditEnv(),
    ...auditRoutes(),
    ...auditIntegrations(),
    ...auditClientPages(),
  ];
  log(`Auditoría completada: ${findings.length} hallazgos`);
  return { generatedAt: new Date().toISOString(), findings };
}

function run(options = {}) {
  const { reportOnly = false, fix = false, json = false } = options;
  const report = audit();

  if (json) { console.log(JSON.stringify(report, null, 2)); return report; }

  printReport(report);

  if (reportOnly) {
    log('Modo --report: no se escriben tareas ni fixes.');
    return report;
  }

  try {
    fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  } catch { /* best-effort */ }

  const added = pushTasks(report.findings);
  log(`${added} tareas nuevas encoladas en tasks.json para Builder Alpha / Pelos.`);
  console.log(`  📋 ${added} tareas nuevas añadidas a la cola (node agents/orchestrator.js --status para verlas)`);

  if (fix) {
    const applied = applyFixes(report.findings, false);
    if (applied.length) {
      log(`Auto-fixes aplicados: ${applied.join(', ')}`);
      console.log(`  🔧 Auto-fixes aplicados (${applied.length}): ${applied.join(', ')}`);
    } else {
      console.log('  🔧 No había auto-fixes seguros pendientes.');
    }
  } else {
    const fixable = report.findings.filter(f => f.fixable).length;
    if (fixable) console.log(`  💡 ${fixable} hallazgos tienen auto-fix. Corre: node agents/kairos.js --fix`);
  }

  log('=== KAIROS finalizado ===');
  return report;
}

// ─── CLI / módulo ───────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  run({
    reportOnly: args.includes('--report'),
    fix: args.includes('--fix'),
    json: args.includes('--json'),
  });
} else {
  module.exports = { run, audit };
}
