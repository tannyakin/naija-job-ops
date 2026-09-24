#!/usr/bin/env node
/**
 * tests/test-sources.mjs: Offline tests for the job-source scrapers
 *
 * Uses saved HTML/JSON fixtures and a mocked fetch(), so it runs without
 * network access and never touches real job sites.
 *
 * Run: node tests/test-sources.mjs
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

process.env.NAIJA_NO_DELAY = '1';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (name) => readFileSync(join(FIX, name), 'utf-8');

const util = await import('../sources/util.mjs');
const linkedin = await import('../sources/linkedin.mjs');
const boards = await import('../sources/boards.mjs');
const remote = await import('../sources/remote.mjs');
const ats = await import('../sources/ats.mjs');
const fit = await import('../sources/fit.mjs');
const tracker = await import('../tracker-lib.mjs');
const scan = await import('../scan.mjs');

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ❌ ${name}\n     ${err.message.split('\n').join('\n     ')}`);
  }
}

/** Route mocked fetch() calls to fixtures by URL substring. */
function mockFetch(routes) {
  globalThis.fetch = async (url) => {
    for (const [needle, body] of routes) {
      if (String(url).includes(needle)) {
        if (typeof body === 'number') return new Response('', { status: body });
        return new Response(body, { status: 200 });
      }
    }
    return new Response('not found', { status: 404 });
  };
}

console.log('\nutil');

await test('parseRelativeAge handles LinkedIn phrasing', () => {
  assert.equal(util.parseRelativeAge('2 hours ago'), 2);
  assert.equal(util.parseRelativeAge('35 minutes ago'), 35 / 60);
  assert.equal(util.parseRelativeAge('Reposted 1 week ago'), 168);
  assert.equal(util.parseRelativeAge('30+ days ago'), 720);
  assert.equal(util.parseRelativeAge('an hour ago'), 1);
  assert.equal(util.parseRelativeAge('nonsense'), null);
});

await test('parseApplicants', () => {
  assert.deepEqual(util.parseApplicants('Be among the first 25 applicants'), { count: 25, label: '<25' });
  assert.deepEqual(util.parseApplicants('Over 200 applicants'), { count: 200, label: '200+' });
  assert.deepEqual(util.parseApplicants('1,204 applicants'), { count: 1204, label: '1204' });
});

await test('freshness and competition favour new, uncrowded posts', () => {
  assert.ok(util.freshnessScore(1) > util.freshnessScore(48));
  assert.ok(util.freshnessScore(48) > util.freshnessScore(24 * 30));
  assert.ok(util.competitionScore(10) > util.competitionScore(200));
  assert.ok(util.competitionScore(200) > util.competitionScore(1000));
});

await test('remoteEligibility for a Nigeria-based candidate', () => {
  assert.equal(util.remoteEligibility('Worldwide'), 'yes');
  assert.equal(util.remoteEligibility('Africa, Europe'), 'yes');
  assert.equal(util.remoteEligibility('EMEA'), 'yes');
  assert.equal(util.remoteEligibility('USA Only'), 'no');
  assert.equal(util.remoteEligibility('Remote', 'Come join us!'), 'unclear');
  assert.equal(util.remoteEligibility('Remote', 'Must be based in the US'), 'no');
});

await test('scamSignals flags fees, personal emails and WhatsApp-only', () => {
  const f = util.scamSignals('Send CV to jobs123@gmail.com. Non-refundable application fee of N5,000. WhatsApp only.');
  assert.ok(f.includes('asks for a fee'));
  assert.ok(f.includes('personal email address for applications'));
  assert.ok(f.includes('WhatsApp-only application'));
  assert.deepEqual(util.scamSignals('Apply via careers.wemabank.com'), []);
});

await test('eligibilityHints finds Nigerian requirements', () => {
  const h = util.eligibilityHints('Candidates should not be older than 26 years, minimum Second Class Upper, must have completed NYSC, 5 credits in WAEC. 3 years experience.');
  assert.deepEqual(h, ['age limit 26', '2:1 minimum', 'NYSC completion required', "O'Level requirement", '3+ yrs experience']);
});

console.log('\nlinkedin');

await test('buildSearchUrl sets newest-first and time window', () => {
  const u = new URL(linkedin.buildSearchUrl({ keywords: 'data analyst', sinceHours: 1, experience: ['entry', 'internship'], workplace: ['remote'] }));
  assert.equal(u.searchParams.get('sortBy'), 'DD');
  assert.equal(u.searchParams.get('f_TPR'), 'r3600');
  assert.equal(u.searchParams.get('f_E'), '2,1');
  assert.equal(u.searchParams.get('f_WT'), '2');
  assert.equal(u.searchParams.get('location'), 'Nigeria');
});

await test('parseSearchResults extracts cards', () => {
  const jobs = linkedin.parseSearchResults(fx('linkedin-search.html'));
  assert.equal(jobs.length, 3);
  const [a, b, c] = jobs;
  assert.equal(a.id, '4012345678');
  assert.equal(a.title, 'Data Analyst');
  assert.equal(a.company, 'Moniepoint Inc.');
  assert.equal(a.location, 'Lagos, Lagos State, Nigeria');
  assert.equal(a.ageHours, 2);
  assert.equal(a.earlyApplicant, true);
  assert.equal(a.url, 'https://www.linkedin.com/jobs/view/4012345678/');
  assert.equal(b.ageHours, 96);
  assert.equal(c.title, 'Graduate Trainee & Data Analyst');
  assert.match(c.salary, /₦250,000/);
});

await test('parseJobDetail extracts applicants, criteria and description', () => {
  const d = linkedin.parseJobDetail(fx('linkedin-detail.html'));
  assert.equal(d.applicants, 25);
  assert.equal(d.applicantsLabel, '<25');
  assert.equal(d.seniority, 'Entry level');
  assert.equal(d.employmentType, 'Full-time');
  assert.equal(d.company, 'Moniepoint Inc.');
  assert.match(d.description, /Power BI/);
  assert.equal(d.closed, false);
});

await test('searchLinkedIn paginates, stops on empty page, enriches', async () => {
  let calls = 0;
  globalThis.fetch = async (url) => {
    url = String(url);
    if (url.includes('/jobPosting/')) return new Response(fx('linkedin-detail.html'));
    calls++;
    return new Response(url.includes('start=0') ? fx('linkedin-search.html') : '');
  };
  const r = await linkedin.searchLinkedIn({ keywords: 'data analyst' }, { maxResults: 50 });
  assert.equal(r.jobs.length, 3);
  assert.equal(calls, 2);
  const n = await linkedin.enrichLinkedIn(r.jobs, { limit: 1 });
  assert.equal(n, 1);
  assert.equal(r.jobs[0].applicants, 25);
  assert.ok(r.jobs[0].hints.includes('NYSC completion required'));
});

await test('searchLinkedIn reports rate limiting', async () => {
  mockFetch([['linkedin.com', 429]]);
  const r = await linkedin.searchLinkedIn({ keywords: 'x' }, { maxResults: 10 });
  assert.equal(r.rateLimited, true);
  assert.equal(r.jobs.length, 0);
});

console.log('\nboards');

await test('extractJobLinks dedupes and keeps best title', () => {
  const links = boards.extractJobLinks(fx('board-listing.html'), 'https://www.jobberman.com/jobs?q=data', '^https://www\\.jobberman\\.com/listings/[a-z0-9-]+');
  const urls = links.map((l) => l.url);
  assert.equal(links.length, 3); // nav link + two distinct jobs; '#apply' variant folded
  assert.ok(urls.includes('https://www.jobberman.com/listings/data-analyst-8xk2qp'));
  assert.ok(urls.includes('https://www.jobberman.com/listings/graduate-trainee-programme-2026-vv91na'));
  assert.equal(links.find((l) => l.url.endsWith('8xk2qp')).title, 'Data Analyst');
});

await test('parseDetailPage reads JSON-LD accurately', () => {
  const j = boards.parseDetailPage(fx('board-detail-jsonld.html'), 'https://x/1', Date.parse('2026-09-24T09:00:00+01:00'));
  assert.equal(j.company, 'Wema Bank Plc');
  assert.equal(j.location, 'Lagos, Lagos, NG');
  assert.equal(j.deadline, '2026-10-10');
  assert.equal(j.ageHours, 24);
  assert.match(j.salary, /NGN 300000 450000 MONTH/);
  assert.ok(j.hints.includes('age limit 27'));
  assert.ok(j.hints.includes('2:1 minimum'));
  assert.deepEqual(j.flags, []);
});

await test('parseDetailPage falls back to text and flags scams', () => {
  const j = boards.parseDetailPage(fx('board-detail-text.html'), 'https://x/2');
  assert.equal(j.title, 'Sales Executive at Bright Future Ventures');
  assert.equal(j.postedAt, '2026-09-20');
  assert.equal(j.deadline, '2026-09-30');
  assert.ok(j.flags.includes('asks for a fee'));
  assert.ok(j.flags.includes('personal email address for applications'));
  assert.ok(j.hints.includes("O'Level requirement"));
});

await test('scanBoard end-to-end with mocked site', async () => {
  mockFetch([
    ['/jobs?q=', fx('board-listing.html')],
    ['/listings/data-analyst', fx('board-detail-jsonld.html')],
    ['/listings/graduate-trainee', fx('board-detail-text.html')],
  ]);
  const board = boards.resolveBoards().find((b) => b.id === 'jobberman');
  const r = await boards.scanBoard(board, ['data analyst'], { detailLimit: 5 });
  const wema = r.jobs.find((j) => j.company === 'Wema Bank Plc');
  assert.ok(wema, 'expected Wema job');
  assert.equal(wema.source, 'jobberman');
  assert.equal(r.needsBrowser, false);
});

await test('scanBoard marks blocked boards as needing the browser', async () => {
  mockFetch([['jobberman', 403]]);
  const board = boards.resolveBoards().find((b) => b.id === 'jobberman');
  const r = await boards.scanBoard(board, ['data analyst']);
  assert.equal(r.needsBrowser, true);
  const indeed = boards.resolveBoards().find((b) => b.id === 'indeed-ng');
  assert.equal((await boards.scanBoard(indeed, ['x'])).needsBrowser, true);
});

await test('resolveBoards merges portals.yml overrides by id', () => {
  const list = boards.resolveBoards([{ id: 'jobberman', enabled: false }, { id: 'custom', name: 'Custom', latest_url: 'https://c', job_link: 'x' }]);
  assert.equal(list.find((b) => b.id === 'jobberman').enabled, false);
  assert.ok(list.find((b) => b.id === 'jobberman').search_url);
  assert.ok(list.find((b) => b.id === 'custom'));
});

console.log('\nremote');

await test('scanRemote keeps Nigeria-eligible, recent roles only', async () => {
  mockFetch([['remotive.com', fx('remotive.json')]]);
  const r = await remote.scanRemote(['data analyst'], { sources: ['remotive'], sinceHours: Infinity });
  const titles = r.jobs.map((j) => `${j.company}:${j.eligibility}`);
  assert.ok(titles.includes('Andela:yes'));
  assert.ok(!titles.some((t) => t.startsWith('Acme')), 'US-only role must be dropped');
});

console.log('\nats');

await test('detectApi recognises Workable and SmartRecruiters', () => {
  assert.equal(ats.detectApi({ careers_url: 'https://apply.workable.com/andela/' }).type, 'workable');
  assert.equal(ats.detectApi({ careers_url: 'https://careers.smartrecruiters.com/Interswitch' }).type, 'smartrecruiters');
  assert.equal(ats.detectApi({ careers_url: 'https://jobs.lever.co/flutterwave' }).type, 'lever');
  assert.equal(ats.detectApi({ careers_url: 'https://www.gtbank.com/careers' }), null);
});

await test('scanAts keeps Nigerian roles and lists custom sites for the browser', async () => {
  mockFetch([['apply.workable.com/api', fx('workable.json')]]);
  const r = await ats.scanAts([
    { name: 'Andela', careers_url: 'https://apply.workable.com/andela/' },
    { name: 'GTBank', careers_url: 'https://www.gtbank.com/careers' },
  ]);
  assert.equal(r.jobs.length, 1);
  assert.equal(r.jobs[0].title, 'Junior Data Analyst');
  assert.deepEqual(r.browserCompanies.map((c) => c.name), ['GTBank']);
});

console.log('\nfit + ranking');

const profile = {
  loaded: true,
  targetWords: ['data', 'analyst'],
  skillTerms: ['sql', 'power bi', 'excel'],
  excludeTerms: ['sales'],
  yearsExperience: 1,
  age: 28,
  nyscStatus: 'completed',
  degreeClass: 'Second Class Upper',
};

await test('quickFit rewards matching roles and skills', () => {
  const good = fit.quickFit({ title: 'Data Analyst', description: 'SQL and Power BI dashboards' }, profile);
  const bad = fit.quickFit({ title: 'Senior Sales Manager', description: '' }, profile);
  assert.ok(good.score >= 70, `good=${good.score}`);
  assert.ok(bad.score <= 10, `bad=${bad.score}`);
  assert.ok(bad.warnings.some((w) => w.includes('deal-breaker')));
});

await test('quickFit applies Nigerian hard limits (age)', () => {
  const r = fit.quickFit({ title: 'Data Analyst', hints: ['age limit 26'] }, profile);
  assert.ok(r.warnings.some((w) => w.includes('age limit 26')));
});

await test('rankJobs puts fresh, uncrowded, matching roles first', () => {
  const jobs = scan.rankJobs([
    { title: 'Data Analyst', company: 'Old Co', ageHours: 24 * 20, applicants: 900, url: 'a' },
    { title: 'Data Analyst', company: 'New Co', ageHours: 1, applicants: 12, url: 'b', description: 'SQL' },
    { title: 'Sales Rep', company: 'Fresh Co', ageHours: 1, applicants: 5, url: 'c' },
  ], profile);
  assert.equal(jobs[0].company, 'New Co');
  assert.equal(jobs[0].hot, true);
  assert.equal(jobs[jobs.length - 1].company === 'Old Co' || jobs[jobs.length - 1].company === 'Fresh Co', true);
});

await test('parseArgs handles repeated and comma keywords', () => {
  const a = scan.parseArgs(['--keywords', 'data analyst,bi analyst', '--keywords=product designer', '--source', 'linkedin,remote', '--since', '1h', '--dry-run']);
  assert.deepEqual(a.keywords, ['data analyst', 'bi analyst', 'product designer']);
  assert.deepEqual(a.sources, ['linkedin', 'remote']);
  assert.equal(a.since, '1h');
  assert.ok(a.flags.has('dry-run'));
});

console.log('\ntracker');

await test('tracker-lib reads 12-col and legacy 9-col rows', () => {
  const twelve = tracker.parseAppLine('| 3 | 2026-09-24 | Wema Bank | Data Analyst | Lagos | 4.2/5 | 2026-10-10 | <25 | Evaluated | ✅ | [3](reports/003-wema-2026-09-24.md) | Strong fit |');
  assert.equal(twelve.location, 'Lagos');
  assert.equal(twelve.score, '4.2/5');
  assert.equal(twelve.status, 'Evaluated');
  assert.equal(twelve.notes, 'Strong fit');
  const legacy = tracker.parseAppLine('| 1 | 2026-04-01 | GTBank | Graduate Trainee | 3.8/5 | Applied | ❌ | [1](reports/001.md) | note |');
  assert.equal(legacy.legacy, true);
  assert.equal(legacy.status, 'Applied');
  assert.equal(legacy.score, '3.8/5');
});

await test('formatAppLine round-trips', () => {
  const app = tracker.parseAppLine('| 3 | 2026-09-24 | Wema Bank | Data Analyst | Lagos | 4.2/5 | N/A | N/A | Evaluated | ✅ | [3](reports/x.md) | ok |');
  assert.equal(tracker.parseAppLine(tracker.formatAppLine(app)).role, 'Data Analyst');
  const up = tracker.formatAppLine(tracker.parseAppLine('| 1 | d | C | R | 3.8/5 | Applied | ❌ | [1](r.md) | n |'));
  assert.equal(tracker.splitRow(up).length, 12);
});

console.log('\nscan.mjs end-to-end (mocked network)');

await test('full scan ranks, dedups and writes pipeline + results', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, readFileSync: rf, existsSync } = await import('fs');
  const { tmpdir } = await import('os');
  const { execFileSync } = await import('child_process');
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const dir = mkdtempSync(join(tmpdir(), 'naija-scan-'));
  mkdirSync(join(dir, 'data'));
  mkdirSync(join(dir, 'config'));
  writeFileSync(join(dir, 'config/profile.yml'), 'target_roles:\n  primary: ["Data Analyst"]\nsearch:\n  skills: ["SQL", "Power BI"]\nexperience:\n  years_total: 1\nnysc_status: completed\n');
  writeFileSync(join(dir, 'portals.yml'), 'search:\n  keywords: ["data analyst"]\nlinkedin:\n  details: 2\njob_boards:\n  - { id: hotnigerianjobs, enabled: false }\n  - { id: ngcareers, enabled: false }\n  - { id: jobgurus, enabled: false }\n  - { id: myjobmag, enabled: false }\n  - { id: indeed-ng, enabled: false }\nremote_boards:\n  sources: [remotive]\n  since: 100000d\ntracked_companies:\n  - { name: Andela, careers_url: "https://apply.workable.com/andela/" }\n');
  const run = () => execFileSync(process.execPath, ['--import', join(root, 'tests/mock-fetch.mjs'), join(root, 'scan.mjs'), '--top', '5'], {
    cwd: dir, env: { ...process.env, NAIJA_NO_DELAY: '1', NAIJA_FIXTURES: FIX }, encoding: 'utf-8',
  });
  const out = run();
  assert.match(out, /Naija Job Scan/);
  const results = JSON.parse(rf(join(dir, 'data/scan-results.json'), 'utf-8'));
  const sources = new Set(results.jobs.map((j) => j.source));
  for (const s of ['linkedin', 'jobberman', 'remotive', 'workable-api']) assert.ok(sources.has(s), `missing source ${s}`);
  assert.ok(results.jobs[0].rank >= results.jobs[results.jobs.length - 1].rank, 'sorted by rank');
  const pipeline = rf(join(dir, 'data/pipeline.md'), 'utf-8');
  assert.match(pipeline, /- \[ \] https:\/\/www\.linkedin\.com\/jobs\/view\/4012345678\//);
  assert.ok(!/Bright Future/.test(pipeline), 'scam listing must not reach the pipeline');
  assert.ok(existsSync(join(dir, 'data/scan-history.tsv')));
  // Second run: everything already seen
  run();
  const again = JSON.parse(rf(join(dir, 'data/scan-results.json'), 'utf-8'));
  assert.equal(again.counts.new, 0);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
