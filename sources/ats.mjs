/**
 * sources/ats.mjs — Company career pages hosted on public ATS platforms
 *
 * Zero-token JSON APIs for Greenhouse, Ashby, Lever, Workable and
 * SmartRecruiters. Detected from each tracked company's careers_url (or an
 * explicit `api:` field) in portals.yml. Companies on custom career sites
 * are listed as needing the browser (Playwright) instead.
 *
 * Global companies (e.g. Flutterwave, Andela) post roles worldwide, so we
 * keep only Nigeria, Africa/EMEA, remote, or unspecified locations.
 */

import { fetchJson, ageFromDate, isNigeriaLocation, remoteEligibility, pool } from './util.mjs';

export function detectApi(company) {
  const api = company.api || '';
  const url = company.careers_url || '';
  let m;

  if (api.includes('greenhouse')) return { type: 'greenhouse', url: api };
  if ((m = url.match(/(?:boards|job-boards)(?:\.eu)?\.greenhouse\.io\/([^/?#]+)/)))
    return { type: 'greenhouse', url: `https://boards-api.greenhouse.io/v1/boards/${m[1]}/jobs` };
  if ((m = url.match(/jobs\.ashbyhq\.com\/([^/?#]+)/)))
    return { type: 'ashby', url: `https://api.ashbyhq.com/posting-api/job-board/${m[1]}?includeCompensation=true` };
  if ((m = url.match(/jobs\.lever\.co\/([^/?#]+)/)))
    return { type: 'lever', url: `https://api.lever.co/v0/postings/${m[1]}` };
  if ((m = url.match(/apply\.workable\.com\/([^/?#]+)/)))
    return { type: 'workable', url: `https://apply.workable.com/api/v1/widget/accounts/${m[1]}`, slug: m[1] };
  if ((m = url.match(/(?:careers|jobs)\.smartrecruiters\.com\/([^/?#]+)/)))
    return { type: 'smartrecruiters', url: `https://api.smartrecruiters.com/v1/companies/${m[1]}/postings?limit=100`, slug: m[1] };
  return null;
}

const PARSERS = {
  greenhouse: (json, c) =>
    (json.jobs || []).map((j) => ({
      title: j.title || '', url: j.absolute_url || '', company: c.name,
      location: j.location?.name || '', postedAt: j.updated_at || '',
    })),
  ashby: (json, c) =>
    (json.jobs || []).map((j) => ({
      title: j.title || '', url: j.jobUrl || '', company: c.name,
      location: [j.location, j.isRemote ? 'Remote' : ''].filter(Boolean).join(' / '),
      postedAt: j.publishedAt || '',
    })),
  lever: (json, c) =>
    (Array.isArray(json) ? json : []).map((j) => ({
      title: j.text || '', url: j.hostedUrl || '', company: c.name,
      location: [j.categories?.location, j.workplaceType === 'remote' ? 'Remote' : ''].filter(Boolean).join(' / '),
      postedAt: j.createdAt || '',
    })),
  workable: (json, c, api) =>
    (json.jobs || []).map((j) => ({
      title: j.title || '', company: c.name,
      url: j.url || j.shortlink || `https://apply.workable.com/${api.slug}/j/${j.shortcode}/`,
      location: [j.city, j.state, j.country, j.telecommuting ? 'Remote' : ''].filter(Boolean).join(', '),
      postedAt: j.published_on || j.created_at || '',
    })),
  smartrecruiters: (json, c, api) =>
    (json.content || []).map((j) => ({
      title: j.name || '', company: c.name,
      url: `https://jobs.smartrecruiters.com/${api.slug}/${j.id}`,
      location: [j.location?.city, j.location?.country?.toUpperCase?.() === 'NG' ? 'Nigeria' : j.location?.country, j.location?.remote ? 'Remote' : ''].filter(Boolean).join(', '),
      postedAt: j.releasedDate || '',
    })),
};

/** Keep roles a Nigeria-based candidate could take. */
export function relevantLocation(loc) {
  if (!loc) return true;
  if (isNigeriaLocation(loc)) return true;
  if (/remote|anywhere|worldwide/i.test(loc)) return remoteEligibility(loc) !== 'no';
  return /\b(africa|emea)\b/i.test(loc);
}

/**
 * Scan tracked companies with a detectable ATS API.
 * @returns {Promise<{jobs, errors, browserCompanies}>}
 */
export async function scanAts(companies, { filterCompany = null, sinceHours = null, log = () => {} } = {}) {
  const now = Date.now();
  const enabled = companies.filter((c) => c.enabled !== false).filter((c) => !filterCompany || c.name.toLowerCase().includes(filterCompany));
  const targets = enabled.map((c) => ({ ...c, _api: detectApi(c) }));
  const browserCompanies = targets.filter((c) => !c._api).map((c) => ({ name: c.name, careers_url: c.careers_url }));
  const errors = [];

  const lists = await pool(targets.filter((c) => c._api), 8, async (c) => {
    try {
      const json = await fetchJson(c._api.url);
      const jobs = PARSERS[c._api.type](json, c, c._api)
        .filter((j) => relevantLocation(j.location))
        .map((j) => ({ ...j, source: `${c._api.type}-api`, sourceName: `${c.name} careers`, ageHours: ageFromDate(j.postedAt, now) }))
        .filter((j) => sinceHours === null || j.ageHours === null || j.ageHours <= sinceHours);
      log(`  ${c.name} (${c._api.type}): ${jobs.length}`);
      return jobs;
    } catch (err) {
      errors.push(`${c.name}: ${err.message}`);
      return [];
    }
  });

  return { jobs: lists.flat(), errors, browserCompanies };
}
