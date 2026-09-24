/**
 * sources/linkedin.mjs — Logged-out LinkedIn job search
 *
 * Uses LinkedIn's public "guest" job endpoints — the same ones that power
 * linkedin.com/jobs for visitors who are not signed in. No account, no
 * cookies, no login: nobody's LinkedIn account is ever put at risk.
 *
 *   Search: /jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=…&location=…&f_TPR=r86400&sortBy=DD&start=0
 *   Detail: /jobs-guest/jobs/api/jobPosting/{jobId}
 *
 * sortBy=DD returns newest first; f_TPR=r{seconds} limits to postings from
 * the last N seconds (r3600 = last hour, r86400 = last 24h).
 *
 * Be polite: requests are sequential with a 1.5–3.5s random delay, and the
 * scan stops early on HTTP 429. This is for personal job searching only.
 */

import {
  fetchText, jitter, oneLine, cleanText,
  parseRelativeAge, ageFromDate, parseApplicants, FetchError,
  eligibilityHints, scamSignals,
} from './util.mjs';

const BASE = 'https://www.linkedin.com/jobs-guest/jobs/api';

/** LinkedIn filter codes */
export const EXPERIENCE_CODES = {
  internship: 1, entry: 2, associate: 3, mid: 4, 'mid-senior': 4, director: 5, executive: 6,
};
export const WORKPLACE_CODES = { onsite: 1, remote: 2, hybrid: 3 };
export const JOB_TYPE_CODES = { 'full-time': 'F', 'part-time': 'P', contract: 'C', temporary: 'T', internship: 'I', volunteer: 'V' };

/**
 * Build a guest search URL.
 * @param {object} o
 * @param {string} o.keywords
 * @param {string} [o.location='Nigeria']
 * @param {number} [o.sinceHours=24]
 * @param {string[]} [o.experience]   e.g. ['entry','associate']
 * @param {string[]} [o.workplace]    e.g. ['remote']
 * @param {string[]} [o.jobType]      e.g. ['full-time','internship']
 * @param {number} [o.start=0]
 */
export function buildSearchUrl({ keywords, location = 'Nigeria', geoId, sinceHours = 24, experience = [], workplace = [], jobType = [], start = 0 }) {
  const p = new URLSearchParams();
  p.set('keywords', keywords);
  if (location) p.set('location', location);
  if (geoId) p.set('geoId', String(geoId));
  if (sinceHours) p.set('f_TPR', `r${Math.round(sinceHours * 3600)}`);
  const e = experience.map((x) => EXPERIENCE_CODES[x]).filter(Boolean);
  if (e.length) p.set('f_E', [...new Set(e)].join(','));
  const w = workplace.map((x) => WORKPLACE_CODES[x]).filter(Boolean);
  if (w.length) p.set('f_WT', [...new Set(w)].join(','));
  const j = jobType.map((x) => JOB_TYPE_CODES[x]).filter(Boolean);
  if (j.length) p.set('f_JT', [...new Set(j)].join(','));
  p.set('sortBy', 'DD');
  p.set('start', String(start));
  return `${BASE}/seeMoreJobPostings/search?${p.toString()}`;
}

/** Public, shareable job URL (works logged-out). */
export const jobUrl = (id) => `https://www.linkedin.com/jobs/view/${id}/`;

const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1] : '';
};

/** Parse the HTML fragment returned by the search endpoint. */
export function parseSearchResults(html, now = Date.now()) {
  const jobs = [];
  // Each card is an <li>; split on card roots to be tolerant of markup changes.
  const chunks = html.split(/<li[\s>]/i).slice(1);
  for (const card of chunks) {
    const id =
      pick(card, /urn:li:jobPosting:(\d+)/) ||
      pick(card, /\/jobs\/view\/[^"?]*?-(\d{6,})(?:[/?"])/) ||
      pick(card, /currentJobId=(\d+)/);
    if (!id) continue;

    const title = oneLine(pick(card, /<h3[^>]*base-search-card__title[^>]*>([\s\S]*?)<\/h3>/i) || pick(card, /<span class="sr-only">([\s\S]*?)<\/span>/i));
    const company = oneLine(pick(card, /<h4[^>]*base-search-card__subtitle[^>]*>([\s\S]*?)<\/h4>/i));
    const location = oneLine(pick(card, /<span[^>]*job-search-card__location[^>]*>([\s\S]*?)<\/span>/i));
    const timeTag = card.match(/<time[^>]*class="([^"]*)"[^>]*datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);
    const postedText = timeTag ? oneLine(timeTag[3]) : '';
    const postedAt = timeTag ? timeTag[2] : '';
    const salary = oneLine(pick(card, /<span[^>]*job-search-card__salary-info[^>]*>([\s\S]*?)<\/span>/i));
    const benefits = oneLine(pick(card, /<span[^>]*job-posting-benefits__text[^>]*>([\s\S]*?)<\/span>/i));

    // Relative text ("3 hours ago") is more precise than the date-only datetime attribute.
    let ageHours = parseRelativeAge(postedText);
    if (ageHours === null) ageHours = ageFromDate(postedAt, now);

    const early = /early applicant/i.test(benefits);

    jobs.push({
      source: 'linkedin',
      id,
      title,
      company,
      location,
      url: jobUrl(id),
      postedAt,
      postedText,
      ageHours,
      salary,
      applicants: null,
      earlyApplicant: early, // LinkedIn's "Be an early applicant" badge (<~25 applicants)
      applicantsText: early ? 'Be an early applicant' : '',
      badges: benefits ? [benefits] : [],
    });
  }
  return jobs;
}

/** Parse the HTML returned by the job detail endpoint. */
export function parseJobDetail(html) {
  const applicantsText = oneLine(
    pick(html, /class="[^"]*num-applicants__caption[^"]*"[^>]*>([\s\S]*?)<\/(?:span|figcaption)>/i)
  );
  const parsedApplicants = parseApplicants(applicantsText);
  const postedText = oneLine(pick(html, /class="[^"]*posted-time-ago__text[^"]*"[^>]*>([\s\S]*?)<\/span>/i));
  const description = cleanText(pick(html, /<div[^>]*show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/i));

  const criteria = {};
  for (const m of html.matchAll(
    /description__job-criteria-subheader[^>]*>([\s\S]*?)<\/h3>\s*<span[^>]*description__job-criteria-text[^>]*>([\s\S]*?)<\/span>/gi
  )) {
    criteria[oneLine(m[1]).toLowerCase()] = oneLine(m[2]);
  }

  const closed = /no longer accepting applications/i.test(html);
  const offsiteApply = /apply-link-offsite|sign-up-modal__outlet[^>]*offsite|"applyUrl"/i.test(html);

  return {
    title: oneLine(pick(html, /<h2[^>]*top-card-layout__title[^>]*>([\s\S]*?)<\/h2>/i)),
    company: oneLine(pick(html, /topcard__org-name-link[^>]*>([\s\S]*?)<\/a>/i)),
    location: oneLine(pick(html, /topcard__flavor--bullet[^>]*>([\s\S]*?)<\/span>/i)),
    postedText,
    ageHours: parseRelativeAge(postedText),
    applicants: parsedApplicants?.count ?? null,
    applicantsLabel: parsedApplicants?.label ?? '',
    applicantsText,
    description,
    seniority: criteria['seniority level'] || '',
    employmentType: criteria['employment type'] || '',
    jobFunction: criteria['job function'] || '',
    industries: criteria['industries'] || '',
    closed,
    offsiteApply,
  };
}

/**
 * Search LinkedIn (logged-out), newest first.
 * @returns {Promise<{jobs: object[], errors: string[], rateLimited: boolean}>}
 */
export async function searchLinkedIn(opts, { maxResults = 50, log = () => {} } = {}) {
  const jobs = [];
  const seen = new Set();
  const errors = [];
  let rateLimited = false;

  for (let start = 0; start < maxResults; ) {
    const url = buildSearchUrl({ ...opts, start });
    let html;
    try {
      html = await fetchText(url, { retries: 1 });
    } catch (err) {
      if (err instanceof FetchError && err.status === 429) rateLimited = true;
      errors.push(`LinkedIn "${opts.keywords}" start=${start}: ${err.message}`);
      break;
    }
    const page = parseSearchResults(html);
    if (page.length === 0) break;
    let added = 0;
    for (const j of page) {
      if (seen.has(j.id)) continue;
      seen.add(j.id);
      jobs.push(j);
      added++;
    }
    log(`  linkedin "${opts.keywords}" @${start}: +${added}`);
    if (added === 0) break;
    start += page.length;
    await jitter(1500, 3500);
  }
  return { jobs: jobs.slice(0, maxResults), errors, rateLimited };
}

/**
 * Fetch detail pages for the given jobs (sequential, polite) and merge in
 * applicant count, description, seniority, and closed status.
 */
export async function enrichLinkedIn(jobs, { limit = 15, log = () => {} } = {}) {
  let done = 0;
  for (const job of jobs.slice(0, limit)) {
    try {
      const html = await fetchText(`${BASE}/jobPosting/${job.id}`, { retries: 1 });
      const d = parseJobDetail(html);
      Object.assign(job, {
        applicants: d.applicants ?? job.applicants,
        applicantsText: d.applicantsText || job.applicantsText,
        description: d.description,
        seniority: d.seniority,
        employmentType: d.employmentType,
        jobFunction: d.jobFunction,
        industries: d.industries,
        closed: d.closed,
        ageHours: d.ageHours ?? job.ageHours,
        postedText: d.postedText || job.postedText,
        hints: eligibilityHints(d.description),
        flags: scamSignals(d.description),
        enriched: true,
      });
      done++;
    } catch (err) {
      if (err instanceof FetchError && err.status === 429) {
        log('  linkedin detail: rate limited — stopping enrichment');
        break;
      }
    }
    await jitter(1500, 3500);
  }
  return done;
}

