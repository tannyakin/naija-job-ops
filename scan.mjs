#!/usr/bin/env node

/**
 * scan.mjs — Multi-source job scanner for Nigeria (zero Claude tokens)
 *
 * Sources (all additive, deduplicated):
 *   linkedin — logged-out LinkedIn search, newest first, with applicant counts
 *   boards   — Nigerian job boards (Jobberman, MyJobMag, HotNigerianJobs, NgCareers, Jobgurus…)
 *   remote   — remote boards filtered to roles a Nigeria-based candidate can take
 *   ats      — tracked companies on Greenhouse/Lever/Ashby/Workable/SmartRecruiters
 *
 * Every job gets:
 *   freshness   (how recently it was posted)
 *   competition (how few people have applied)
 *   quick fit   (keyword match against YOUR profile — see sources/fit.mjs)
 * and the list is ranked by a blend of the three, so brand-new, low-competition,
 * well-matched roles come first.
 *
 * Usage:
 *   node scan.mjs                                   # all enabled sources, keywords from your profile
 *   node scan.mjs --keywords "data analyst"         # any field — repeatable or comma-separated
 *   node scan.mjs --source linkedin --since 1h      # LinkedIn only, posted in the last hour
 *   node scan.mjs --source remote --since 3d        # remote roles open to Nigeria
 *   node scan.mjs --location Lagos --experience entry,internship
 *   node scan.mjs --dry-run                         # don't write pipeline/history
 *   node scan.mjs --json                            # machine-readable output
 *
 * Outputs:
 *   data/scan-results.json  — full ranked results of the latest scan (for /naija-jobs match)
 *   data/pipeline.md        — new listings appended under ## Pending
 *   data/scan-history.tsv   — dedup history
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import yaml from 'js-yaml';
import { pathToFileURL } from 'url';
import { parseSince, freshnessScore, competitionScore, formatAge, jobKey, normalise } from './sources/util.mjs';
import { searchLinkedIn, enrichLinkedIn } from './sources/linkedin.mjs';
import { resolveBoards, scanBoard } from './sources/boards.mjs';
import { scanRemote, REMOTE_SOURCES } from './sources/remote.mjs';
import { scanAts } from './sources/ats.mjs';
import { loadProfile, quickFit } from './sources/fit.mjs';
import { parseTracker } from './tracker-lib.mjs';

const PORTALS_PATH = 'portals.yml';
const SCAN_HISTORY_PATH = 'data/scan-history.tsv';
const PIPELINE_PATH = 'data/pipeline.md';
const APPLICATIONS_PATH = 'data/applications.md';
const RESULTS_PATH = 'data/scan-results.json';
const ALL_SOURCES = ['linkedin', 'boards', 'remote', 'ats'];

// ── CLI ─────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = { keywords: [], sources: null, flags: new Set() };
  const valueOpts = ['--keywords', '--source', '--since', '--location', '--experience', '--workplace', '--company', '--max', '--details', '--top'];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const [name, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    if (valueOpts.includes(name)) {
      const v = inline ?? argv[++i];
      if (v === undefined) continue;
      if (name === '--keywords') args.keywords.push(...v.split(',').map((s) => s.trim()).filter(Boolean));
      else if (name === '--source') args.sources = v.split(',').map((s) => s.trim());
      else args[name.slice(2)] = v;
    } else if (a.startsWith('--')) {
      args.flags.add(a.slice(2));
    }
  }
  return args;
}

// ── Dedup sources ───────────────────────────────────────────────────

function loadSeen() {
  const urls = new Set();
  const keys = new Set();
  if (existsSync(SCAN_HISTORY_PATH)) {
    for (const line of readFileSync(SCAN_HISTORY_PATH, 'utf-8').split('\n').slice(1)) {
      const [url, , , title, company] = line.split('\t');
      if (url) urls.add(url);
      if (title && company) keys.add(jobKey(company, title));
    }
  }
  if (existsSync(PIPELINE_PATH)) {
    for (const m of readFileSync(PIPELINE_PATH, 'utf-8').matchAll(/- \[[ x!]\] (https?:\/\/[^\s|]+)/g)) urls.add(m[1]);
  }
  if (existsSync(APPLICATIONS_PATH)) {
    const text = readFileSync(APPLICATIONS_PATH, 'utf-8');
    for (const m of text.matchAll(/https?:\/\/[^\s|)]+/g)) urls.add(m[0]);
    for (const app of parseTracker(text)) keys.add(jobKey(app.company, app.role));
  }
  return { urls, keys };
}

// ── Title filter ────────────────────────────────────────────────────

function buildTitleFilter(tf = {}) {
  const positive = (tf.positive || []).map((k) => k.toLowerCase());
  const negative = (tf.negative || []).map((k) => k.toLowerCase());
  return {
    positive: (title) => positive.length === 0 || positive.some((k) => title.toLowerCase().includes(k)),
    negative: (title) => negative.some((k) => title.toLowerCase().includes(k)),
  };
}

// ── Merge + rank ────────────────────────────────────────────────────

function mergeDuplicates(jobs) {
  const byKey = new Map();
  for (const j of jobs) {
    const key = j.company ? jobKey(j.company, j.title) : j.url;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...j, alsoOn: [] });
      continue;
    }
    // Keep the richer record; remember the other source
    const richer = (j.enriched && !prev.enriched) || (j.applicants != null && prev.applicants == null) ? j : prev;
    const other = richer === j ? prev : j;
    const merged = { ...other, ...Object.fromEntries(Object.entries(richer).filter(([, v]) => v !== '' && v != null)) };
    merged.alsoOn = [...new Set([...(prev.alsoOn || []), other.sourceName || other.source])];
    merged.ageHours = Math.min(prev.ageHours ?? Infinity, j.ageHours ?? Infinity);
    if (merged.ageHours === Infinity) merged.ageHours = null;
    byKey.set(key, merged);
  }
  return [...byKey.values()];
}

export function rankJobs(jobs, profile) {
  for (const j of jobs) {
    const fit = quickFit(j, profile);
    const applicants = j.applicants ?? (j.earlyApplicant ? 20 : null);
    j.freshness = freshnessScore(j.ageHours);
    j.competition = competitionScore(applicants);
    j.fit = fit.score;
    j.fitReasons = fit.reasons;
    j.warnings = fit.warnings;
    j.rank = Math.round(0.4 * j.freshness + 0.25 * j.competition + 0.35 * j.fit);
    j.hot = (j.ageHours ?? 999) <= 24 && (applicants ?? 999) <= 50 && j.fit >= 50 && !j.warnings.some((w) => w.startsWith('⚠'));
  }
  return jobs.sort((a, b) => b.rank - a.rank);
}

// ── Writers ─────────────────────────────────────────────────────────

const cell = (s) => String(s ?? '').replace(/[|\t\n]/g, ' ').trim();

function pipelineLine(j) {
  const bits = [j.url, cell(j.company) || '?', cell(j.title), cell(j.location) || '—', formatAge(j.ageHours), j.applicantsText ? cell(j.applicantsText) : j.applicants != null ? `${j.applicants} applicants` : 'applicants ?', cell(j.sourceName || j.source), `rank ${j.rank}`];
  return `- [ ] ${bits.join(' | ')}${j.hot ? ' | 🔥' : ''}`;
}

function appendToPipeline(jobs) {
  if (!existsSync(PIPELINE_PATH)) writeFileSync(PIPELINE_PATH, '# Pipeline\n\n## Pending\n\n## Processed\n', 'utf-8');
  let text = readFileSync(PIPELINE_PATH, 'utf-8');
  const block = jobs.map(pipelineLine).join('\n') + '\n';
  const idx = text.indexOf('## Pending');
  if (idx === -1) {
    const procIdx = text.indexOf('## Processed');
    const at = procIdx === -1 ? text.length : procIdx;
    text = `${text.slice(0, at)}\n## Pending\n\n${block}\n${text.slice(at)}`;
  } else {
    const next = text.indexOf('\n## ', idx + 10);
    const at = next === -1 ? text.length : next + 1;
    const before = text.slice(0, at).replace(/\n*$/, '\n');
    text = `${before}${block}${next === -1 ? '' : '\n'}${text.slice(at)}`;
  }
  writeFileSync(PIPELINE_PATH, text, 'utf-8');
}

function appendToHistory(jobs, date, status) {
  if (!existsSync(SCAN_HISTORY_PATH)) {
    writeFileSync(SCAN_HISTORY_PATH, 'url\tfirst_seen\tsource\ttitle\tcompany\tstatus\tposted\tapplicants\tlocation\trank\n', 'utf-8');
  }
  const lines = jobs.map((j) => [j.url, date, j.source, cell(j.title), cell(j.company), status, formatAge(j.ageHours), j.applicants ?? '', cell(j.location), j.rank ?? ''].join('\t'));
  if (lines.length) appendFileSync(SCAN_HISTORY_PATH, lines.join('\n') + '\n', 'utf-8');
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args.flags.has('dry-run');
  const asJson = args.flags.has('json');
  const quiet = asJson;
  const log = quiet ? () => {} : (m) => console.log(m);

  const config = existsSync(PORTALS_PATH) ? yaml.load(readFileSync(PORTALS_PATH, 'utf-8')) || {} : {};
  if (!existsSync(PORTALS_PATH)) log('ℹ portals.yml not found — using built-in defaults (run /naija-jobs onboard to personalise).');

  const search = config.search || {};
  const profile = loadProfile('.');

  // Keywords: CLI → portals.yml search.keywords → profile.yml search.keywords → profile target roles
  let keywords = args.keywords.length ? args.keywords : search.keywords || [];
  if (!keywords.length) keywords = profile.searchKeywords;
  if (!keywords.length) keywords = profile.targets.slice(0, 5).map((t) => t.split(/[—(]/)[0].trim());
  if (!keywords.length) {
    console.error('No keywords. Pass --keywords "your role" or set search.keywords in portals.yml (or run /naija-jobs onboard).');
    process.exit(2);
  }

  const sources = (args.sources || search.sources || ALL_SOURCES).filter((s) => ALL_SOURCES.includes(s));
  const sinceHours = parseSince(args.since || search.since || '24h');
  const location = args.location || search.location || 'Nigeria';
  const experience = (args.experience || (search.experience || []).join(',')).split(',').map((s) => s.trim()).filter(Boolean);
  const workplace = (args.workplace || '').split(',').map((s) => s.trim()).filter(Boolean);
  const max = parseInt(args.max || search.max_per_source || 40, 10);
  const detailLimit = parseInt(args.details ?? config.linkedin?.details ?? 15, 10);
  const titleFilter = buildTitleFilter(config.title_filter);
  const kwWords = [...new Set(keywords.flatMap((k) => normalise(k).split(' ')).filter((w) => w.length > 2))];
  const keywordMatch = (title) => kwWords.some((w) => normalise(title).includes(w)) || titleFilter.positive(title) && (config.title_filter?.positive || []).length > 0;

  log(`Scanning ${sources.join(', ')} for: ${keywords.join(' · ')}  (last ${formatAge(sinceHours).replace(' ago', '')}, ${location})`);

  const all = [];
  const errors = [];
  const needsBrowser = [];
  let browserCompanies = [];
  let rateLimited = false;

  const tasks = [];

  if (sources.includes('linkedin') && config.linkedin?.enabled !== false) {
    tasks.push((async () => {
      const found = [];
      for (const kw of keywords) {
        const r = await searchLinkedIn(
          { keywords: kw, location, geoId: config.linkedin?.geo_id, sinceHours, experience, workplace: workplace.length ? workplace : config.linkedin?.workplace || [] },
          { maxResults: max, log }
        );
        found.push(...r.jobs);
        errors.push(...r.errors);
        if (r.rateLimited) { rateLimited = true; break; }
      }
      // Newest first, then fetch applicant counts for the freshest
      found.sort((a, b) => (a.ageHours ?? 999) - (b.ageHours ?? 999));
      const unique = [...new Map(found.map((j) => [j.id, j])).values()];
      if (detailLimit > 0 && !rateLimited) await enrichLinkedIn(unique, { limit: detailLimit, log });
      all.push(...unique.filter((j) => !j.closed));
    })());
  }

  if (sources.includes('boards')) {
    const boards = resolveBoards(config.job_boards).filter((b) => b.enabled !== false);
    tasks.push(Promise.all(boards.map(async (b) => {
      const r = await scanBoard(b, keywords, { sinceHours, maxPerBoard: max, detailLimit: Math.min(detailLimit, 12), keywordMatch, log });
      if (r.needsBrowser) needsBrowser.push({ name: b.name, url: b.search_url || b.latest_url });
      errors.push(...r.errors);
      all.push(...r.jobs.filter((j) => !j.closed).filter((j) => j.ageHours === null || j.ageHours <= Math.max(sinceHours, 72)));
    })));
  }

  if (sources.includes('remote') && config.remote_boards?.enabled !== false) {
    const remoteSince = args.since ? sinceHours : parseSince(config.remote_boards?.since || '7d');
    tasks.push((async () => {
      const r = await scanRemote(keywords, {
        sources: config.remote_boards?.sources || Object.keys(REMOTE_SOURCES),
        sinceHours: remoteSince,
        includeRestricted: args.flags.has('include-restricted') || config.remote_boards?.include_restricted,
        log,
      });
      errors.push(...r.errors);
      all.push(...r.jobs.slice(0, max * 3));
    })());
  }

  if (sources.includes('ats')) {
    tasks.push((async () => {
      const r = await scanAts(config.tracked_companies || [], { filterCompany: args.company?.toLowerCase(), log });
      errors.push(...r.errors);
      browserCompanies = r.browserCompanies;
      all.push(...r.jobs.filter((j) => titleFilter.positive(j.title)));
    })());
  }

  await Promise.all(tasks);

  // Filter, dedup, rank
  const seen = loadSeen();
  const filtered = all.filter((j) => j.title && j.url && !titleFilter.negative(j.title));
  const merged = mergeDuplicates(filtered);
  const ranked = rankJobs(merged, profile);
  const fresh = ranked.filter((j) => !seen.urls.has(j.url) && !(j.company && seen.keys.has(jobKey(j.company, j.title))));
  const dupes = ranked.length - fresh.length;
  const date = new Date().toISOString().slice(0, 10);

  const results = {
    scanned_at: new Date().toISOString(),
    params: { keywords, sources, sinceHours, location, experience },
    profile_loaded: profile.loaded,
    counts: { found: all.length, after_filters: merged.length, duplicates: dupes, new: fresh.length },
    needs_browser: needsBrowser,
    browser_companies: browserCompanies,
    rate_limited: rateLimited,
    errors,
    jobs: ranked.map((j) => ({ ...j, description: (j.description || '').slice(0, 3000), isNew: fresh.includes(j) })),
  };

  if (!dryRun) {
    if (!existsSync('data')) mkdirSync('data', { recursive: true });
    writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf-8');
    // Only reasonably-matched, non-flagged roles go to the pipeline
    const minRank = config.search?.min_rank ?? 35;
    const minFit = config.search?.min_fit ?? 40;
    const toPipeline = fresh.filter((j) => j.rank >= minRank && j.fit >= minFit && !j.warnings.some((w) => w.startsWith('⚠')));
    if (toPipeline.length) appendToPipeline(toPipeline);
    appendToHistory(toPipeline, date, 'added');
    appendToHistory(fresh.filter((j) => !toPipeline.includes(j)), date, 'skipped_low_fit');
    results.counts.added_to_pipeline = toPipeline.length;
  }

  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Human summary
  const top = parseInt(args.top || 25, 10);
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`Naija Job Scan — ${date}`);
  console.log('━'.repeat(60));
  console.log(`Listings found:        ${all.length}`);
  console.log(`After filters/merge:   ${merged.length}`);
  console.log(`Already seen:          ${dupes}`);
  console.log(`New:                   ${fresh.length}${dryRun ? '' : `  (${results.counts.added_to_pipeline} added to pipeline)`}`);
  if (!profile.loaded) console.log('\n⚠ No profile found — ranking uses freshness/competition only. Run /naija-jobs onboard for better matches.');

  if (fresh.length) {
    console.log(`\nTop ${Math.min(top, fresh.length)} new (🔥 = posted <24h, few applicants, good fit):\n`);
    fresh.slice(0, top).forEach((j, i) => {
      const applicants = j.applicantsText || (j.applicants != null ? `${j.applicants} applicants` : '');
      console.log(`${String(i + 1).padStart(2)}. ${j.hot ? '🔥 ' : ''}${j.title} — ${j.company || '?'}`);
      console.log(`    ${[j.location || '—', formatAge(j.ageHours), applicants, j.eligibility ? `remote: ${j.eligibility}` : '', j.sourceName || j.source].filter(Boolean).join(' · ')}  [rank ${j.rank} | fit ${j.fit}]`);
      if (j.warnings.length) console.log(`    ! ${j.warnings.join('; ')}`);
      console.log(`    ${j.url}`);
    });
  }

  if (needsBrowser.length) {
    console.log(`\nNeeds browser (blocked plain HTTP): ${needsBrowser.map((b) => b.name).join(', ')}`);
  }
  if (browserCompanies.length && sources.includes('ats')) {
    console.log(`Companies on custom career sites (check with browser): ${browserCompanies.length}`);
  }
  if (rateLimited) console.log('\n⚠ LinkedIn rate-limited this scan — wait 15–30 minutes before scanning LinkedIn again.');
  if (errors.length) {
    console.log(`\nSource errors (${errors.length}):`);
    for (const e of errors.slice(0, 15)) console.log(`  ✗ ${e}`);
  }
  console.log(`\n→ /naija-jobs match     rank these against your full CV and pick what to apply for`);
  console.log(`→ /naija-jobs pipeline  evaluate everything added to data/pipeline.md`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
}
