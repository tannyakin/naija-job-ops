/**
 * sources/boards.mjs: Nigerian job boards (Jobberman, MyJobMag, HotNigerianJobs, …)
 *
 * Config-driven: each board is described by a search URL template and a
 * regex that recognises job-detail links. Defaults live in DEFAULT_BOARDS;
 * `job_boards:` in portals.yml overrides or extends them, so when a board
 * changes its URLs the fix is a one-line config edit, not a code change.
 *
 * Accuracy: listing pages only give us title + link. For the top results we
 * open the detail page and read its schema.org JobPosting JSON-LD (the data
 * boards publish for Google Jobs): company, location, datePosted,
 * validThrough (deadline), education, experience, salary. When JSON-LD is
 * missing we fall back to text patterns ("Deadline:", "Posted:").
 *
 * Boards that block scripts (e.g. Indeed) are marked needs_browser, and
 * the scan mode hands those to Playwright instead.
 */

import {
  fetchText, jitter, oneLine, cleanText, absUrl,
  extractJsonLdJobPostings, fromJsonLd, ageFromDate, parseRelativeAge,
  scamSignals, eligibilityHints, FetchError,
} from './util.mjs';

export const DEFAULT_BOARDS = [
  {
    id: 'jobberman',
    name: 'Jobberman',
    search_url: 'https://www.jobberman.com/jobs?q={q}',
    latest_url: 'https://www.jobberman.com/jobs',
    job_link: '^https://www\\.jobberman\\.com/listings/[a-z0-9-]+',
    enabled: true,
  },
  {
    id: 'myjobmag',
    name: 'MyJobMag',
    search_url: 'https://www.myjobmag.com/search/jobs?q={q}',
    latest_url: 'https://www.myjobmag.com/jobs',
    job_link: '^https://www\\.myjobmag\\.com/job/[a-z0-9-]+',
    enabled: true,
  },
  {
    id: 'hotnigerianjobs',
    name: 'HotNigerianJobs',
    // Newest-first feed; titles are filtered by keyword locally
    latest_url: 'https://www.hotnigerianjobs.com/',
    job_link: '^https://www\\.hotnigerianjobs\\.com/hotjobs/\\d+/[^#?]+\\.html',
    enabled: true,
  },
  {
    id: 'ngcareers',
    name: 'NgCareers',
    search_url: 'https://ngcareers.com/jobs?q={q}',
    latest_url: 'https://ngcareers.com/jobs',
    job_link: '^https://ngcareers\\.com/job/[^#?]+',
    enabled: true,
  },
  {
    id: 'jobgurus',
    name: 'Jobgurus',
    search_url: 'https://www.jobgurus.com.ng/jobs?keyword={q}',
    latest_url: 'https://www.jobgurus.com.ng/jobs',
    job_link: '^https://www\\.jobgurus\\.com\\.ng/jobs/view/[^#?]+',
    enabled: true,
  },
  {
    id: 'indeed-ng',
    name: 'Indeed Nigeria',
    search_url: 'https://ng.indeed.com/jobs?q={q}&l=Nigeria&sort=date&fromage={days}',
    job_link: '^https://ng\\.indeed\\.com/(?:viewjob|rc/clk)\\?jk=[a-f0-9]+',
    needs_browser: true, // Cloudflare blocks plain HTTP clients
    enabled: true,
  },
];

/** Merge defaults with portals.yml `job_boards:` (matched by id). */
export function resolveBoards(configBoards = []) {
  const byId = new Map(DEFAULT_BOARDS.map((b) => [b.id, { ...b }]));
  for (const b of configBoards || []) {
    if (!b?.id) continue;
    byId.set(b.id, { ...(byId.get(b.id) || {}), ...b });
  }
  return [...byId.values()];
}

/** Fill {q}, {q_slug}, {days} placeholders. */
export function fillTemplate(tpl, keywords, sinceHours) {
  const q = keywords.trim();
  const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return tpl
    .replace(/\{q\}/g, encodeURIComponent(q))
    .replace(/\{q_slug\}/g, slug)
    .replace(/\{days\}/g, String(Math.max(1, Math.ceil((sinceHours || 24) / 24))));
}

/**
 * Pull job-detail links out of a listing page.
 * Cards usually contain several anchors to the same job (image, title,
 * "view"), so we keep the longest non-trivial anchor text per URL.
 */
export function extractJobLinks(html, baseUrl, linkPattern) {
  const re = new RegExp(linkPattern, 'i');
  const found = new Map();
  for (const m of html.matchAll(/<a\s[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = absUrl(m[1], baseUrl);
    if (!url || !re.test(url)) continue;
    const clean = url.split('#')[0];
    const titleAttr = (m[0].match(/\btitle\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    let text = oneLine(m[2]) || oneLine(titleAttr);
    if (/^(view|apply|read more|details|more|see job)$/i.test(text)) text = oneLine(titleAttr);
    const prev = found.get(clean);
    if (!prev || (text && text.length > prev.length && text.length < 200)) found.set(clean, text || prev || '');
  }
  // Also accept JSON-LD ItemList on the listing page
  const jsonLd = extractJsonLdJobPostings(html).map(fromJsonLd).filter((j) => j.applyUrl);
  const jobs = [...found.entries()].map(([url, title]) => ({ url, title }));
  for (const j of jsonLd) if (!found.has(j.applyUrl)) jobs.push({ url: j.applyUrl, title: j.title, prefilled: j });
  return jobs;
}

const DATE_TEXT = /(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9},?\s+\d{4}|[A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/;

function parseLooseDate(s) {
  if (!s) return '';
  const cleaned = s.replace(/(\d)(st|nd|rd|th)/gi, '$1').replace(',', '');
  let ms = Date.parse(cleaned);
  if (isNaN(ms)) {
    const dm = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // Nigerian dd/mm/yyyy
    if (dm) ms = Date.UTC(+dm[3], +dm[2] - 1, +dm[1]);
  }
  return isNaN(ms) ? '' : new Date(ms).toISOString().slice(0, 10);
}

/** Parse a job-detail page into our job shape. */
export function parseDetailPage(html, url, now = Date.now()) {
  const ld = extractJsonLdJobPostings(html).map(fromJsonLd)[0];
  const text = cleanText(html.replace(/<(nav|footer|header)[\s\S]*?<\/\1>/gi, ' '));

  const job = ld ? { ...ld } : {
    title: oneLine((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || ''),
    company: '', location: '', postedAt: '', deadline: '', description: '',
  };

  if (!job.deadline) {
    const m = text.match(new RegExp(`(?:deadline|closing date|application closes?|closes on|apply before)\\s*[:\\-–]?\\s*(?:is\\s*)?${DATE_TEXT.source}`, 'i'));
    if (m) job.deadline = parseLooseDate(m[1]);
  }
  if (!job.postedAt) {
    const m = text.match(new RegExp(`(?:posted|date posted|published)\\s*(?:on)?\\s*[:\\-–]?\\s*${DATE_TEXT.source}`, 'i'));
    if (m) job.postedAt = parseLooseDate(m[1]);
    else {
      const rel = text.match(/(?:posted|published)\s*[:\-–]?\s*((?:\d+|an?)\s+(?:minute|hour|day|week|month)s?\s+ago|today|yesterday)/i);
      if (rel) job.postedText = rel[1];
    }
  }
  if (!job.description) job.description = text.slice(0, 8000);

  // JSON-LD descriptions live in <script> tags, which cleanText drops, so scan both
  const fullText = ld ? `${text}\n${job.description}` : text;
  const lower = fullText.toLowerCase();
  job.closed = /(this (?:job|position|vacancy) (?:has )?(?:expired|closed)|no longer (?:available|accepting)|application (?:is )?closed)/i.test(lower);
  job.flags = scamSignals(fullText);

  job.hints = eligibilityHints(fullText);

  job.ageHours = ageFromDate(job.postedAt, now) ?? parseRelativeAge(job.postedText || '');
  job.url = url;
  return job;
}

/**
 * Scan one board for a set of keywords.
 * @returns {Promise<{jobs: object[], errors: string[], needsBrowser: boolean}>}
 */
export async function scanBoard(board, keywordsList, { sinceHours = 24, maxPerBoard = 30, detailLimit = 12, keywordMatch = () => true, log = () => {} } = {}) {
  if (board.needs_browser) return { jobs: [], errors: [], needsBrowser: true };

  const urls = [];
  if (board.search_url && keywordsList.length) {
    for (const kw of keywordsList) urls.push({ url: fillTemplate(board.search_url, kw, sinceHours), kw });
  } else if (board.latest_url) {
    urls.push({ url: board.latest_url, kw: null });
  }

  const candidates = new Map();
  const errors = [];
  for (const { url, kw } of urls) {
    try {
      const html = await fetchText(url, { retries: 1 });
      const links = extractJobLinks(html, url, board.job_link);
      let kept = 0;
      for (const l of links) {
        // Search pages are already keyword-scoped; feeds need local filtering
        if (!kw && !keywordMatch(l.title)) continue;
        if (!candidates.has(l.url)) {
          candidates.set(l.url, l);
          kept++;
        }
      }
      log(`  ${board.name}${kw ? ` "${kw}"` : ''}: ${links.length} links, ${kept} kept`);
    } catch (err) {
      errors.push(`${board.name}: ${err instanceof FetchError ? err.message : err}`);
    }
    await jitter(600, 1500);
  }

  const list = [...candidates.values()].slice(0, maxPerBoard);
  const jobs = [];
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    let job = { title: c.title, company: '', location: '', url: c.url, ...(c.prefilled || {}) };
    if (i < detailLimit) {
      try {
        const html = await fetchText(c.url, { retries: 1 });
        const d = parseDetailPage(html, c.url);
        job = { ...job, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        job.enriched = true;
      } catch (err) {
        errors.push(`${board.name} detail: ${err.message}`);
      }
      await jitter(500, 1200);
    }
    jobs.push({ source: board.id, sourceName: board.name, ...job, url: c.url });
  }

  // A board that returned nothing and errored is probably blocking scripts
  const needsBrowser = jobs.length === 0 && errors.length > 0;
  return { jobs, errors, needsBrowser };
}
