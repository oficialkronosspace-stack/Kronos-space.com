/**
 * KRONOS AGENT ORCHESTRATOR
 * Runs all three agents in sequence: Task Master → Builder Alpha → Pelos
 * Can be run manually or scheduled via cron.
 *
 * Usage:
 *   node agents/orchestrator.js              → full cycle
 *   node agents/orchestrator.js --audit      → only run Kairos (auditoría experta)
 *   node agents/orchestrator.js --plan       → only generate tasks (Task Master)
 *   node agents/orchestrator.js --build      → only run Builder Alpha
 *   node agents/orchestrator.js --fix        → only run Pelos
 *   node agents/orchestrator.js --dry        → dry run, no file writes
 *   node agents/orchestrator.js --all        → run all agents until queue empty
 *   node agents/orchestrator.js --status     → show current task queue status
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = __dirname;
const LOG_FILE = path.join(AGENTS_DIR, 'logs', 'orchestrator.log');
const TASKS_FILE = path.join(AGENTS_DIR, 'tasks.json');

function log(msg) {
  const line = `[${new Date().toISOString()}] [ORCHESTRATOR] ${msg}`;
  console.log(line);
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function printBanner(title) {
  const border = '─'.repeat(50);
  log(border);
  log(`  ${title}`);
  log(border);
}

function showStatus() {
  if (!fs.existsSync(TASKS_FILE)) {
    console.log('\nNo hay tareas generadas. Corre: node agents/orchestrator.js --plan\n');
    return;
  }
  const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  const counts = { pending: 0, in_progress: 0, done: 0, error: 0, needs_human: 0 };
  for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1;

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║       KRONOS AGENT STATUS            ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Total tasks:    ${String(tasks.length).padEnd(19)}║`);
  console.log(`║  ✅ Done:        ${String(counts.done || 0).padEnd(19)}║`);
  console.log(`║  🔄 In progress: ${String(counts.in_progress || 0).padEnd(19)}║`);
  console.log(`║  ⏳ Pending:     ${String(counts.pending || 0).padEnd(19)}║`);
  console.log(`║  ❌ Error:       ${String(counts.error || 0).padEnd(19)}║`);
  console.log(`║  👤 Needs human: ${String(counts.needs_human || 0).padEnd(19)}║`);
  console.log('╚══════════════════════════════════════╝\n');

  const pending = tasks.filter(t => t.status === 'pending');
  if (pending.length > 0) {
    console.log('Next 5 tasks in queue:');
    for (const t of pending.slice(0, 5)) {
      const prio = t.effectivePriority ?? t.priority;
      console.log(`  [${t.type.toUpperCase().padEnd(11)}] P${prio} ${t.id} — ${t.title}`);
    }
    console.log('');
  }

  const errors = tasks.filter(t => t.status === 'error');
  if (errors.length > 0) {
    console.log('Tasks with errors:');
    for (const t of errors) {
      console.log(`  ❌ ${t.id}: ${t.notes || 'unknown error'}`);
    }
    console.log('');
  }
}

async function runCycle(options = {}) {
  const { dryRun = false, runAll = false } = options;

  printBanner('KRONOS AGENT ORCHESTRATOR');
  log(`Mode: ${runAll ? 'ALL' : 'SINGLE CYCLE'} | DryRun: ${dryRun}`);

  // ── Step 0: Kairos — auditoría experta (qué falta para estar en la web) ───
  log('');
  log('STEP 0: Kairos — auditando proyecto y encolando gaps de producción...');
  try {
    const { run: runKairos } = require('./kairos');
    runKairos({ reportOnly: dryRun, fix: !dryRun });
    log('Kairos completado');
  } catch (err) {
    log(`Kairos ERROR: ${err.message}`);
  }

  // ── Step 1: Task Master ──────────────────────────────────────────────────
  log('');
  log('STEP 1: Task Master — generando cola de tareas...');
  try {
    const { run: runTaskMaster } = require('./task-master');
    runTaskMaster();
    log('Task Master completado');
  } catch (err) {
    log(`Task Master ERROR: ${err.message}`);
    process.exit(1);
  }

  // ── Step 2: Pelos — auto-fix primero ────────────────────────────
  log('');
  log('STEP 2: Pelos — auto-detect & fix...');
  try {
    const { run: runFixer } = require('./pelos');
    runFixer({ autoFixOnly: true, dryRun });
    log('Pelos (auto-fix) completado');
  } catch (err) {
    log(`Pelos (auto-fix) ERROR: ${err.message}`);
  }

  // ── Step 3: Builder Alpha ────────────────────────────────────────────────
  log('');
  log('STEP 3: Builder Alpha — implementando features...');

  if (runAll) {
    let iterations = 0;
    const MAX = 20;
    while (iterations++ < MAX) {
      const tasks = fs.existsSync(TASKS_FILE)
        ? JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'))
        : [];
      const pending = tasks.filter(t => t.status === 'pending' && ['feature', 'improvement'].includes(t.type));
      if (pending.length === 0) break;

      try {
        const { run: runBuilder } = require('./builder-alpha');
        runBuilder({ dryRun });
      } catch (err) {
        log(`Builder Alpha ERROR: ${err.message}`);
        break;
      }
    }
  } else {
    try {
      const { run: runBuilder } = require('./builder-alpha');
      runBuilder({ dryRun });
    } catch (err) {
      log(`Builder Alpha ERROR: ${err.message}`);
    }
  }

  // ── Step 4: Pelos — security/test tasks ─────────────────────────
  log('');
  log('STEP 4: Pelos — seguridad y tests...');

  if (runAll) {
    let iterations = 0;
    const MAX = 10;
    while (iterations++ < MAX) {
      const tasks = fs.existsSync(TASKS_FILE)
        ? JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'))
        : [];
      const pending = tasks.filter(t => t.status === 'pending' && ['security', 'test'].includes(t.type));
      if (pending.length === 0) break;

      try {
        const { run: runFixer } = require('./pelos');
        runFixer({ dryRun });
      } catch (err) {
        log(`Pelos ERROR: ${err.message}`);
        break;
      }
    }
  } else {
    try {
      const { run: runFixer } = require('./pelos');
      runFixer({ dryRun });
    } catch (err) {
      log(`Pelos ERROR: ${err.message}`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  log('');
  printBanner('CICLO COMPLETADO');
  showStatus();
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--status')) {
  showStatus();
  process.exit(0);
}

if (args.includes('--audit')) {
  log('Running Kairos only...');
  const { run } = require('./kairos');
  run({ reportOnly: args.includes('--dry'), fix: args.includes('--fix') });
  process.exit(0);
}

if (args.includes('--plan')) {
  log('Running Task Master only...');
  const { run } = require('./task-master');
  run();
  showStatus();
  process.exit(0);
}

if (args.includes('--build')) {
  log('Running Builder Alpha only...');
  const { run } = require('./builder-alpha');
  run({ dryRun: args.includes('--dry') });
  showStatus();
  process.exit(0);
}

if (args.includes('--fix')) {
  log('Running Pelos only...');
  const { run } = require('./pelos');
  run({ dryRun: args.includes('--dry') });
  showStatus();
  process.exit(0);
}

const dryRun = args.includes('--dry');
const runAll = args.includes('--all');

runCycle({ dryRun, runAll }).catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
