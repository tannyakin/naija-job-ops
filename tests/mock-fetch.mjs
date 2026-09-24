/**
 * tests/mock-fetch.mjs — preload for end-to-end scan tests.
 * Usage: node --import ./tests/mock-fetch.mjs scan.mjs   (with NAIJA_FIXTURES set)
 * Routes every fetch() to a local fixture; nothing leaves the machine.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const FIX = process.env.NAIJA_FIXTURES;
const fx = (n) => readFileSync(join(FIX, n), 'utf-8');

const routes = [
  ['/jobPosting/', () => fx('linkedin-detail.html')],
  ['seeMoreJobPostings', (url) => (url.includes('start=0') ? fx('linkedin-search.html') : '')],
  ['jobberman.com/jobs', () => fx('board-listing.html')],
  ['jobberman.com/listings/data-analyst', () => fx('board-detail-jsonld.html')],
  ['jobberman.com/listings/', () => fx('board-detail-text.html')],
  ['remotive.com/api', () => fx('remotive.json')],
  ['apply.workable.com/api', () => fx('workable.json')],
];

globalThis.fetch = async (input) => {
  const url = String(input);
  for (const [needle, body] of routes) {
    if (url.includes(needle)) return new Response(body(url), { status: 200 });
  }
  return new Response('blocked in tests', { status: 403 });
};
