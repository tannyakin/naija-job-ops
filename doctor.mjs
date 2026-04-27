#!/usr/bin/env node

/**
 * doctor.mjs — Setup validation for naija-job-ops
 *
 * Checks all prerequisites and prints a pass/fail/warn checklist.
 * Run with: npm run doctor
 *
 * Exit codes:
 *   0 — all checks pass (warnings are OK)
 *   1 — one or more errors found
 */

import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;

// ── ANSI colours (TTY-only) ───────────────────────────────────────────────────
const isTTY = process.stdout.isTTY;
const green  = (s) => isTTY ? `\x1b[32m${s}\x1b[0m` : s;
const red    = (s) => isTTY ? `\x1b[31m${s}\x1b[0m` : s;
const yellow = (s) => isTTY ? `\x1b[33m${s}\x1b[0m` : s;
const dim    = (s) => isTTY ? `\x1b[2m${s}\x1b[0m`  : s;
const bold   = (s) => isTTY ? `\x1b[1m${s}\x1b[0m`  : s;

const PASS  = green('✔');
const FAIL  = red('✗');
const WARN  = yellow('○');

// ── Result helpers ─────────────────────────────────────────────────────────────
function pass(label)              { return { level: 'pass',  label }; }
function fail(label, ...fixes)    { return { level: 'fail',  label, fixes }; }
function warn(label, ...hints)    { return { level: 'warn',  label, hints }; }

// ── Checks ─────────────────────────────────────────────────────────────────────

function checkNodeVersion() {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major >= 18) {
    return pass(`Node.js ${process.versions.node} (>= 18 required)`);
  }
  return fail(
    `Node.js ${process.versions.node} — version 18 or later required`,
    'Download Node.js 18+ from https://nodejs.org'
  );
}

function checkDependencies() {
  const nm = join(root, 'node_modules');
  if (existsSync(nm)) {
    try {
      const entries = readdirSync(nm);
      if (entries.length > 0) {
        return pass('npm dependencies installed');
      }
    } catch { /* fall through */ }
  }
  return fail(
    'npm dependencies not installed',
    'Run: npm install'
  );
}

async function checkPlaywright() {
  try {
    const { chromium } = await import('playwright');
    const execPath = chromium.executablePath();
    if (existsSync(execPath)) {
      return pass('Playwright Chromium installed');
    }
    return fail(
      'Playwright Chromium binary not found',
      'Run: npx playwright install chromium'
    );
  } catch {
    return fail(
      'Playwright not installed (required for URL verification and scanning)',
      'Run: npm install',
      'Then: npx playwright install chromium'
    );
  }
}

function checkClaudeCode() {
  try {
    execSync('claude --version', { stdio: 'pipe' });
    return pass('Claude Code (claude) found on PATH');
  } catch {
    return fail(
      'Claude Code (claude) not found on PATH',
      'Install from: https://claude.ai/code',
      'Or follow the setup guide in README.md'
    );
  }
}

function checkGo() {
  try {
    execSync('go version', { stdio: 'pipe' });
    return pass('Go found on PATH');
  } catch {
    return warn(
      'Go not found on PATH (optional — not required for core features)',
      'Install from https://golang.org if you need Go-based tooling'
    );
  }
}

// ── Project setup checks ──────────────────────────────────────────────────────

function checkProfileYml() {
  if (existsSync(join(root, 'config', 'profile.yml'))) {
    return pass('config/profile.yml found');
  }
  return fail(
    'config/profile.yml not found (required)',
    'Run: cp config/profile.example.yml config/profile.yml',
    'Then fill in your name, education, NYSC status, and target roles'
  );
}

function checkPortalsYml() {
  if (existsSync(join(root, 'portals.yml'))) {
    return pass('portals.yml found');
  }
  return fail(
    'portals.yml not found (required for scanning)',
    'Run: cp templates/portals.example.yml portals.yml',
    'Then customise the search keywords for your target roles'
  );
}

function checkProfileSkills() {
  if (existsSync(join(root, 'profile-skills.md'))) {
    return pass('profile-skills.md found');
  }
  return fail(
    'profile-skills.md not found (required — used when no CV exists)',
    'Run: /naija-jobs onboard in Claude Code to create it',
    'Or copy profile-skills.example.md to profile-skills.md and edit it'
  );
}

function checkCvMd() {
  if (existsSync(join(root, 'cv.md'))) {
    return pass('cv.md found');
  }
  return warn(
    'cv.md not found (optional but recommended — improves evaluation accuracy)',
    'Run: /naija-jobs cv edit to create or import your CV'
  );
}

function checkApplicationsTracker() {
  if (existsSync(join(root, 'data', 'applications.md'))) {
    return pass('data/applications.md found');
  }
  return warn(
    'data/applications.md not found (will be created automatically)',
    'Run: /naija-jobs onboard to complete setup and create the tracker'
  );
}

function checkFonts() {
  const fontsDir = join(root, 'fonts');
  if (!existsSync(fontsDir)) {
    return fail(
      'fonts/ directory not found (required for PDF generation)',
      'The fonts/ directory should have been included in the repository — check your clone'
    );
  }
  try {
    const files = readdirSync(fontsDir);
    if (files.length === 0) {
      return fail(
        'fonts/ directory is empty (required for PDF generation)',
        'Check your repository clone — font files should be present'
      );
    }
    return pass(`fonts/ directory ready (${files.length} file${files.length === 1 ? '' : 's'})`);
  } catch {
    return fail(
      'fonts/ directory not readable',
      'Check permissions: ls -la fonts/'
    );
  }
}

// ── Pipeline integrity checks ─────────────────────────────────────────────────

function checkUnmergedTsvFiles() {
  const trackerDir = join(root, 'batch', 'tracker-additions');
  if (!existsSync(trackerDir)) {
    return pass('batch/tracker-additions/ — no unmerged additions');
  }
  try {
    const files = readdirSync(trackerDir).filter(f => f.endsWith('.tsv'));
    if (files.length === 0) {
      return pass('batch/tracker-additions/ — no unmerged additions');
    }
    return warn(
      `${files.length} unmerged TSV file${files.length === 1 ? '' : 's'} in batch/tracker-additions/`,
      'Run: node merge-tracker.mjs  (or: npm run merge)',
      `Files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? ` ... and ${files.length - 5} more` : ''}`
    );
  } catch {
    return warn(
      'Could not read batch/tracker-additions/ — check permissions'
    );
  }
}

function ensureDir(name) {
  const dirPath = join(root, name);
  if (existsSync(dirPath)) return null;
  try {
    mkdirSync(dirPath, { recursive: true });
    return null; // silently created
  } catch {
    return fail(`${name}/ directory could not be created`, `Run: mkdir -p ${name}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log(bold('naija-job-ops doctor'));
  console.log('════════════════════\n');

  // Ensure required directories exist silently
  ensureDir('data');
  ensureDir('output');
  ensureDir('reports');
  ensureDir('batch/tracker-additions');

  const results = [
    // Environment
    { section: 'Environment', result: checkNodeVersion() },
    { section: null,          result: checkDependencies() },
    { section: null,          result: await checkPlaywright() },
    { section: null,          result: checkClaudeCode() },
    { section: null,          result: checkGo() },

    // Project setup
    { section: 'Project Setup', result: checkProfileYml() },
    { section: null,             result: checkPortalsYml() },
    { section: null,             result: checkProfileSkills() },
    { section: null,             result: checkCvMd() },
    { section: null,             result: checkApplicationsTracker() },
    { section: null,             result: checkFonts() },

    // Pipeline integrity
    { section: 'Pipeline Integrity', result: checkUnmergedTsvFiles() },
  ];

  let errors   = 0;
  let warnings = 0;
  let currentSection = null;

  for (const { section, result } of results) {
    if (section && section !== currentSection) {
      if (currentSection !== null) console.log('');
      console.log(dim(section));
      currentSection = section;
    }

    if (result.level === 'pass') {
      console.log(`  ${PASS} ${result.label}`);
    } else if (result.level === 'fail') {
      errors++;
      console.log(`  ${FAIL} ${red(result.label)}`);
      for (const fix of (result.fixes || [])) {
        console.log(`     ${dim('→ ' + fix)}`);
      }
    } else if (result.level === 'warn') {
      warnings++;
      console.log(`  ${WARN} ${yellow(result.label)}`);
      for (const hint of (result.hints || [])) {
        console.log(`     ${dim('→ ' + hint)}`);
      }
    }
  }

  console.log('');
  console.log('─'.repeat(40));

  if (errors > 0) {
    console.log(red(`${errors} error${errors === 1 ? '' : 's'} found. Fix the issues above before running Claude Code.`));
    process.exit(1);
  } else if (warnings > 0) {
    console.log(yellow(`Ready with ${warnings} warning${warnings === 1 ? '' : 's'}. Run: ${bold('claude')}`));
    process.exit(0);
  } else {
    console.log(green(`You are ready. Open Claude Code with: ${bold('claude')}`));
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(red('doctor.mjs failed unexpectedly:'), err.message);
  process.exit(1);
});
