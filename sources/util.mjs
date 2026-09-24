/**
 * sources/util.mjs — Shared helpers for all job sources
 *
 * Fetching (polite, with retries), HTML cleanup, posting-age and
 * applicant-count parsing, freshness/competition scoring, and
 * remote-eligibility detection for Nigeria-based candidates.
 */

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Random delay between min and max ms — keeps request cadence human-like.
 * NAIJA_NO_DELAY=1 disables it (tests only — never for real scans).
 */
export const jitter = (min, max) => (process.env.NAIJA_NO_DELAY ? Promise.resolve() : sleep(min + Math.random() * (max - min)));

// ── Fetching ────────────────────────────────────────────────────────

export class FetchError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Fetch a URL as text. Retries on 429/5xx with exponential backoff.
 * Throws FetchError with .status on final failure (status 0 = network).
 */
export async function fetchText(url, { timeoutMs = 15_000, retries = 2, headers = {} } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en-GB,en;q=0.9',
          Accept: 'text/html,application/json,application/xml;q=0.9,*/*;q=0.8',
          ...headers,
        },
      });
      if (res.ok) return await res.text();
      lastErr = new FetchError(`HTTP ${res.status}`, res.status);
      // Only 429 and 5xx are worth retrying
      if (res.status !== 429 && res.status < 500) throw lastErr;
    } catch (err) {
      if (err instanceof FetchError && err.status !== 429 && err.status < 500) throw err;
      lastErr = err instanceof FetchError ? err : new FetchError(err.name === 'AbortError' ? 'timeout' : err.message, 0);
    } finally {
      clearTimeout(timer);
    }
    if (attempt < retries) await sleep(2000 * 2 ** attempt);
  }
  throw lastErr;
}

export async function fetchJson(url, opts = {}) {
  const text = await fetchText(url, { ...opts, headers: { Accept: 'application/json', ...(opts.headers || {}) } });
  return JSON.parse(text);
}

/** Run async tasks with a concurrency limit, preserving input order. */
export async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

// ── HTML helpers ────────────────────────────────────────────────────

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', naira: '₦' };

export function decodeEntities(s = '') {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

/** Strip tags, decode entities, collapse whitespace. */
export function cleanText(html = '') {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|div|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/** Collapse to a single line. */
export const oneLine = (s = '') => cleanText(s).replace(/\s+/g, ' ').trim();

/** Resolve a possibly-relative href against a base URL. */
export function absUrl(href, base) {
  try {
    return new URL(decodeEntities(href), base).toString();
  } catch {
    return null;
  }
}

/**
 * Extract every schema.org JobPosting object from JSON-LD blocks in a page.
 * Most Nigerian boards (and Google-for-Jobs-optimised career sites) embed these,
 * and they are far more accurate than scraping visible text.
 */
export function extractJsonLdJobPostings(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try {
      data = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const stack = Array.isArray(data) ? [...data] : [data];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      const type = node['@type'];
      if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) out.push(node);
      if (Array.isArray(node['@graph'])) stack.push(...node['@graph']);
      if (Array.isArray(node.itemListElement)) stack.push(...node.itemListElement.map((e) => e.item || e));
    }
  }
  return out;
}

/** Normalise a JSON-LD JobPosting into our job shape (partial). */
export function fromJsonLd(jp) {
  const org = jp.hiringOrganization;
  const locs = [].concat(jp.jobLocation || []);
  const location = locs
    .map((l) => {
      const a = l.address || {};
      if (typeof a === 'string') return a;
      return [a.addressLocality, a.addressRegion, a.addressCountry?.name || a.addressCountry].filter(Boolean).join(', ');
    })
    .filter(Boolean)
    .join(' / ');
  const salary = jp.baseSalary?.value
    ? [jp.baseSalary.currency, jp.baseSalary.value.minValue ?? jp.baseSalary.value.value, jp.baseSalary.value.maxValue, jp.baseSalary.value.unitText]
        .filter((x) => x !== undefined && x !== null)
        .join(' ')
    : '';
  return {
    title: oneLine(jp.title || ''),
    company: oneLine(typeof org === 'string' ? org : org?.name || ''),
    location: location || (jp.jobLocationType === 'TELECOMMUTE' ? 'Remote' : ''),
    remote: jp.jobLocationType === 'TELECOMMUTE',
    postedAt: jp.datePosted || '',
    deadline: jp.validThrough ? String(jp.validThrough).slice(0, 10) : '',
    employmentType: [].concat(jp.employmentType || []).join(', '),
    education: oneLine(typeof jp.educationRequirements === 'string' ? jp.educationRequirements : jp.educationRequirements?.credentialCategory || ''),
    experience: oneLine(
      typeof jp.experienceRequirements === 'string'
        ? jp.experienceRequirements
        : jp.experienceRequirements?.monthsOfExperience
          ? `${Math.round(jp.experienceRequirements.monthsOfExperience / 12)} years`
          : ''
    ),
    salary,
    description: cleanText(decodeEntities(jp.description || '')),
    applyUrl: jp.url || '',
  };
}

// ── Age, applicants, freshness ──────────────────────────────────────

/**
 * Parse "2 hours ago", "Just now", "Yesterday", "3 days ago", "1 week ago",
 * "30+ days ago", "Posted today", "an hour ago" → hours (number) or null.
 */
export function parseRelativeAge(text = '') {
  const t = text.toLowerCase().replace(/^(posted|reposted)\s+/, '').trim();
  if (!t) return null;
  if (/just now|moments? ago|seconds? ago|today/.test(t)) return 0.5;
  if (/yesterday/.test(t)) return 24;
  const m = t.match(/(\d+|an?|one)\+?\s*(minute|min|hour|hr|day|week|wk|month|mo|year|yr)s?\b/);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : 1;
  const unit = m[2];
  if (unit.startsWith('min')) return n / 60;
  if (unit === 'hour' || unit === 'hr') return n;
  if (unit === 'day') return n * 24;
  if (unit === 'week' || unit === 'wk') return n * 24 * 7;
  if (unit === 'month' || unit === 'mo') return n * 24 * 30;
  return n * 24 * 365;
}

/** Hours since an ISO date / unix timestamp (seconds or ms). null if unparseable. */
export function ageFromDate(value, now = Date.now()) {
  if (value === undefined || value === null || value === '') return null;
  let ms;
  if (typeof value === 'number') ms = value < 1e12 ? value * 1000 : value;
  else ms = Date.parse(value);
  if (isNaN(ms)) return null;
  return Math.max(0, (now - ms) / 3_600_000);
}

/** Human label for an age in hours. */
export function formatAge(hours) {
  if (hours === null || hours === undefined) return 'age unknown';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 48) return `${Math.round(hours)}h ago`;
  if (hours < 24 * 14) return `${Math.round(hours / 24)}d ago`;
  return `${Math.round(hours / 24 / 7)}w ago`;
}

/**
 * "Be among the first 25 applicants" → { count: 25, label: '<25' }
 * "Over 200 applicants"               → { count: 200, label: '200+' }
 * "47 applicants"                     → { count: 47, label: '47' }
 */
export function parseApplicants(text = '') {
  const t = text.toLowerCase().replace(/,/g, '');
  let m;
  if ((m = t.match(/first\s+(\d+)\s+applicants?/))) return { count: parseInt(m[1], 10), label: `<${m[1]}` };
  if ((m = t.match(/(?:over|more than)\s+(\d+)\s+applicants?/))) return { count: parseInt(m[1], 10), label: `${m[1]}+` };
  if ((m = t.match(/(\d+)\+?\s+applicants?/))) return { count: parseInt(m[1], 10), label: m[1] };
  if ((m = t.match(/(\d+)\s+(?:people )?(?:clicked apply|applied)/))) return { count: parseInt(m[1], 10), label: m[1] };
  return null;
}

/** Parse a "since" window like "1h", "24h", "3d", "1w" → hours. */
export function parseSince(s = '24h') {
  const m = String(s).trim().toLowerCase().match(/^(\d+)\s*(h|d|w|m)?$/);
  if (!m) return 24;
  const n = parseInt(m[1], 10);
  return { h: n, d: n * 24, w: n * 24 * 7, m: n * 24 * 30 }[m[2] || 'h'];
}

/**
 * Freshness 0–100. A 1-hour-old posting scores ~100; a week-old ~35;
 * a month-old ~10. Unknown age gets a neutral 40.
 */
export function freshnessScore(ageHours) {
  if (ageHours === null || ageHours === undefined) return 40;
  return Math.round(100 * Math.exp(-ageHours / 150) * (ageHours <= 24 ? 1 : 0.9));
}

/**
 * Competition 0–100 (higher = less competition = better).
 * <25 applicants ~95, 100 ~65, 200+ ~40, 1000 ~10. Unknown → 50.
 */
export function competitionScore(applicantCount) {
  if (applicantCount === null || applicantCount === undefined) return 50;
  return Math.round(100 / (1 + applicantCount / 180) ** 1.2);
}

// ── Remote eligibility ──────────────────────────────────────────────

const OPEN_WORLD = /\b(worldwide|anywhere|global(ly)?|international|all countries|any location|no location restriction)\b/i;
const INCLUDES_NG = /\b(nigeria|africa|emea|west africa|sub-saharan|lagos|abuja|gmt\s*[+±]?\s*[0-2]\b|wat\b|cet\b)/i;
const RESTRICTED =
  /\b(us|usa|u\.s\.|united states|canada|north america|americas|latam|latin america|uk only|united kingdom only|eu only|europe only|australia|new zealand|india|philippines|brazil|mexico|germany only|us[- ]based|must be (?:located|based) in (?!nigeria|africa))\b/i;

const RESTRICTED_TEXT =
  /\b(us[- ]based|based in the (?:us|united states|uk|eu)|(?:us|usa|uk|eu|canada) (?:only|residents only)|must (?:be|reside) (?:located|based|in) (?:the )?(?:us|usa|united states|canada|uk|europe)|authori[sz]ed to work in the (?:us|united states|uk))\b/i;

/**
 * Can a Nigeria-based candidate take this remote job?
 * Returns 'yes' | 'likely' | 'no' | 'unclear'.
 */
export function remoteEligibility(locationText = '', extraText = '') {
  const loc = `${locationText}`.trim();
  const all = `${loc} ${extraText}`;
  if (INCLUDES_NG.test(loc)) return 'yes';
  if (OPEN_WORLD.test(loc)) return RESTRICTED.test(loc) ? 'unclear' : 'yes';
  if (RESTRICTED.test(loc)) return 'no';
  if (INCLUDES_NG.test(all) || OPEN_WORLD.test(all)) return 'likely';
  // Free text: skip the bare "us" token ("join us") and only trust explicit phrasing
  if (RESTRICTED_TEXT.test(extraText)) return 'no';
  return 'unclear';
}

/** Does a location string point at Nigeria (or remote, which may still fit)? */
export function isNigeriaLocation(loc = '') {
  return /\b(nigeria|lagos|abuja|port harcourt|ibadan|kano|enugu|kaduna|benin city|warri|uyo|calabar|owerri|abeokuta|ilorin|jos|onitsha|asaba|akure|osogbo|ogun|rivers|oyo|delta|anambra|fct)\b/i.test(loc);
}

// ── Misc ────────────────────────────────────────────────────────────

export function normalise(s = '') {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function jobKey(company, title) {
  return `${normalise(company)}::${normalise(title)}`;
}

/** Scam / legitimacy red flags visible in listing text. */
export function scamSignals(text = '') {
  const flags = [];
  const t = text.toLowerCase();
  if (/(application|processing|registration|screening|training|form)\s+fee|pay\s+(?:a\s+)?(?:fee|₦|n\d)|non-refundable/.test(t)) flags.push('asks for a fee');
  if (/@(gmail|yahoo|hotmail|outlook|ymail)\.com/.test(t)) flags.push('personal email address for applications');
  if (/whatsapp\s*(?:only|us|:|\+?234)|send\s+(?:your\s+)?cv\s+(?:via|to|on)\s+whatsapp/.test(t)) flags.push('WhatsApp-only application');
  if (/no experience needed.*(?:earn|salary)\s*(?:of\s*)?₦?\s*\d{3},?\d{3}/.test(t)) flags.push('unrealistic pay for no experience');
  if (/bank (?:details|account) (?:for|to receive)|bvn/.test(t)) flags.push('requests bank details / BVN');
  return flags;
}

/** Nigerian eligibility requirements worth surfacing before a full evaluation. */
export function eligibilityHints(fullText = '') {
  const hints = [];
  const age = fullText.match(
    /(?:not (?:be )?(?:older|above|more)(?: than)?|maximum age(?: of| limit(?: of| is)?)?\s*:?|age limit(?: of| is)?\s*:?|below the age of|(?:be )?under(?: the age of)?|aged? between \d{2} (?:and|-|to))\s*(\d{2})\s*(?:years?)?/i
  );
  if (age) hints.push(`age limit ${age[1]}`);
  if (/second class upper|2\s*:\s*1|2\.1\b/i.test(fullText)) hints.push('2:1 minimum');
  if (/\bhnd\b/i.test(fullText)) hints.push('HND mentioned');
  if (/nysc (?:discharge|certificate|completion)|completed (?:the )?nysc|must have completed nysc/i.test(fullText)) hints.push('NYSC completion required');
  if (/o'?\s*level|waec|neco|five credits|5 credits/i.test(fullText)) hints.push("O'Level requirement");
  const yoe = fullText.match(/(\d{1,2})\s*(?:\+|-\s*\d+)?\s*years?(?:'|’)?\s*(?:of\s*)?(?:relevant\s*|post[- ]nysc\s*|work(?:ing)?\s*)?experience/i);
  if (yoe) hints.push(`${yoe[1]}+ yrs experience`);
  return hints;
}
