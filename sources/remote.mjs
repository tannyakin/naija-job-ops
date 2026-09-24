/**
 * sources/remote.mjs — Remote job boards with public APIs/feeds
 *
 * Remotive, RemoteOK, Himalayas, Jobicy and We Work Remotely all publish
 * free feeds. Every result is tagged with `eligibility` (can someone living
 * in Nigeria actually be hired?) using the posting's location restrictions:
 *   yes     — worldwide / Africa / EMEA / Nigeria
 *   likely  — no explicit restriction, wording suggests open
 *   unclear — ask or check the JD
 *   no      — US-only, EU-only, etc. (dropped unless --include-restricted)
 *
 * Terms: RemoteOK and Remotive ask that listings link back to them as the
 * source — we always keep the original URL and show the source name.
 */

import { fetchJson, fetchText, oneLine, cleanText, ageFromDate, remoteEligibility } from './util.mjs';

const kwRegex = (keywords) =>
  new RegExp(keywords.map((k) => k.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|'), 'i');

function finish(job, now) {
  job.ageHours = ageFromDate(job.postedAt, now);
  job.remote = true;
  job.eligibility = remoteEligibility(job.location, job.description?.slice(0, 1500) || '');
  return job;
}

export const REMOTE_SOURCES = {
  async remotive(keywords, now) {
    const out = [];
    for (const kw of keywords) {
      const data = await fetchJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(kw)}&limit=100`);
      for (const j of data.jobs || []) {
        out.push(finish({
          source: 'remotive', sourceName: 'Remotive',
          title: oneLine(j.title), company: oneLine(j.company_name), url: j.url,
          location: j.candidate_required_location || '', postedAt: j.publication_date,
          salary: j.salary || '', employmentType: j.job_type || '', description: cleanText(j.description || ''),
        }, now));
      }
    }
    return out;
  },

  async remoteok(keywords, now) {
    const data = await fetchJson('https://remoteok.com/api');
    const re = kwRegex(keywords);
    return (Array.isArray(data) ? data : [])
      .filter((j) => j && j.position)
      .filter((j) => re.test(`${j.position} ${(j.tags || []).join(' ')}`))
      .map((j) => finish({
        source: 'remoteok', sourceName: 'RemoteOK',
        title: oneLine(j.position), company: oneLine(j.company), url: j.url || `https://remoteok.com/remote-jobs/${j.id}`,
        location: j.location || '', postedAt: j.date || j.epoch,
        salary: j.salary_min ? `USD ${j.salary_min}–${j.salary_max || '?'}/yr` : '',
        description: cleanText(j.description || ''),
      }, now));
  },

  async himalayas(keywords, now) {
    const re = kwRegex(keywords);
    const out = [];
    for (let offset = 0; offset < 100; offset += 20) {
      const data = await fetchJson(`https://himalayas.app/jobs/api?limit=20&offset=${offset}`);
      const jobs = data.jobs || [];
      for (const j of jobs) {
        if (!re.test(`${j.title} ${(j.categories || []).join(' ')}`)) continue;
        out.push(finish({
          source: 'himalayas', sourceName: 'Himalayas',
          title: oneLine(j.title), company: oneLine(j.companyName), url: j.applicationLink || j.guid,
          location: (j.locationRestrictions || []).join(', ') || 'Worldwide',
          postedAt: j.pubDate, deadline: j.expiryDate ? new Date(j.expiryDate * 1000).toISOString().slice(0, 10) : '',
          salary: j.minSalary ? `${j.currency || 'USD'} ${j.minSalary}–${j.maxSalary || '?'}` : '',
          seniority: (j.seniority || []).join(', '), employmentType: j.employmentType || '',
          description: cleanText(j.excerpt || j.description || ''),
        }, now));
      }
      if (jobs.length < 20) break;
    }
    return out;
  },

  async jobicy(keywords, now) {
    const out = [];
    for (const kw of keywords) {
      const data = await fetchJson(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(kw)}`);
      for (const j of data.jobs || []) {
        out.push(finish({
          source: 'jobicy', sourceName: 'Jobicy',
          title: oneLine(j.jobTitle), company: oneLine(j.companyName), url: j.url,
          location: j.jobGeo || '', postedAt: j.pubDate, seniority: j.jobLevel || '',
          employmentType: [].concat(j.jobType || []).join(', '),
          salary: j.annualSalaryMin ? `${j.salaryCurrency || 'USD'} ${j.annualSalaryMin}–${j.annualSalaryMax || '?'}/yr` : '',
          description: cleanText(j.jobExcerpt || j.jobDescription || ''),
        }, now));
      }
    }
    return out;
  },

  async weworkremotely(keywords, now) {
    const xml = await fetchText('https://weworkremotely.com/remote-jobs.rss');
    const re = kwRegex(keywords);
    const out = [];
    for (const item of xml.split(/<item>/i).slice(1)) {
      const tag = (t) => {
        const m = item.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`, 'i'));
        return m ? m[1].trim() : '';
      };
      const full = oneLine(tag('title'));
      if (!re.test(full)) continue;
      const [company, ...rest] = full.split(':');
      out.push(finish({
        source: 'weworkremotely', sourceName: 'We Work Remotely',
        title: rest.join(':').trim() || full, company: rest.length ? company.trim() : '',
        url: tag('link') || tag('guid'), location: oneLine(tag('region')) || '',
        postedAt: tag('pubDate'), description: cleanText(tag('description')),
      }, now));
    }
    return out;
  },
};

/**
 * Query all enabled remote sources.
 * @returns {Promise<{jobs: object[], errors: string[]}>}
 */
export async function scanRemote(keywords, { sources = Object.keys(REMOTE_SOURCES), sinceHours = 24 * 7, includeRestricted = false, log = () => {} } = {}) {
  const now = Date.now();
  const errors = [];
  const results = await Promise.all(
    sources.map(async (name) => {
      const fn = REMOTE_SOURCES[name];
      if (!fn) return [];
      try {
        const jobs = await fn(keywords, now);
        log(`  ${name}: ${jobs.length} keyword matches`);
        return jobs;
      } catch (err) {
        errors.push(`${name}: ${err.message}`);
        return [];
      }
    })
  );
  const jobs = results
    .flat()
    .filter((j) => j.url && j.title)
    .filter((j) => j.ageHours === null || j.ageHours <= sinceHours)
    .filter((j) => includeRestricted || j.eligibility !== 'no');
  return { jobs, errors };
}
