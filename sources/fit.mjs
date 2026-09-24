/**
 * sources/fit.mjs — Fast, zero-token profile pre-match
 *
 * Gives every scanned job a 0–100 "quick fit" from the user's own files so
 * the scanner can put the most promising, freshest, least-crowded roles at
 * the top. It is a pre-filter only: the real 1–5 score comes from the full
 * evaluation (modes/eval.md), which reads the whole CV.
 *
 * Signals:
 *   + target role words in the title             (config/profile.yml target_roles, search.keywords)
 *   + skills mentioned in title/description      (profile-skills.md "Core Skills", search.skills)
 *   − seniority above the user's level            (Senior/Lead/Manager vs years of experience)
 *   − hard eligibility conflicts in the text      (age limit, NYSC completion, 2:1, years required)
 *   − deal-breakers                                (profile-skills.md "Deal-Breakers", search.exclude)
 */

import { readFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import { normalise } from './util.mjs';

const STOP = new Set('and or the a an of for in to with at on by from as is are be — - / & junior senior entry level graduate trainee mid role roles officer'.split(' '));

function words(s) {
  return normalise(s).split(' ').filter((w) => w.length > 1 && !STOP.has(w));
}

/** Pull bullet items from a markdown section, e.g. "## Core Skills". */
function sectionItems(md, heading) {
  const re = new RegExp(`^##\\s+${heading}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|$(?![\\s\\S]))`, 'im');
  const m = md.match(re);
  if (!m) return [];
  return m[1]
    .split('\n')
    .filter((l) => /^\s*[-*]\s+/.test(l))
    .map((l) => l.replace(/^\s*[-*]\s+/, '').split(/\s+[—–-]\s+/)[0])
    .flatMap((l) => l.split(/[,(]/).map((x) => x.replace(/[)*]/g, '').trim()))
    .filter((x) => x && x.length < 40);
}

function yearsOfAge(dob) {
  if (!dob) return null;
  const ms = Date.parse(dob);
  if (isNaN(ms)) return null;
  return Math.floor((Date.now() - ms) / (365.25 * 24 * 3_600_000));
}

/** Load the bits of the user's profile the quick matcher needs. */
export function loadProfile(root = '.') {
  const p = { targets: [], searchKeywords: [], skills: [], exclude: [], yearsExperience: null, age: null, nyscStatus: '', degreeClass: '', level: '', loaded: false };
  const ymlPath = `${root}/config/profile.yml`;
  if (existsSync(ymlPath)) {
    const y = yaml.load(readFileSync(ymlPath, 'utf-8')) || {};
    p.loaded = true;
    p.searchKeywords = y.search?.keywords || [];
    p.targets.push(...(y.target_roles?.primary || []), ...p.searchKeywords);
    p.skills.push(...(y.search?.skills || []));
    p.exclude.push(...(y.search?.exclude || []));
    p.yearsExperience = y.experience?.years_total ?? null;
    p.olevel = y.education?.olevel || '';
    p.age = y.candidate?.age ?? yearsOfAge(y.candidate?.date_of_birth);
    p.nyscStatus = y.nysc_status || '';
    p.degreeClass = y.education?.class_of_degree || '';
    p.level = y.education?.level || '';
  }
  for (const f of ['profile-skills.md', 'cv.md']) {
    const path = `${root}/${f}`;
    if (!existsSync(path)) continue;
    p.loaded = true;
    const md = readFileSync(path, 'utf-8');
    if (f === 'profile-skills.md') {
      p.targets.push(...sectionItems(md, 'Target Roles'));
      p.exclude.push(...sectionItems(md, 'Deal-Breakers'));
    }
    p.skills.push(...sectionItems(md, 'Core Skills'), ...sectionItems(md, 'Skills'));
  }
  p.targetWords = [...new Set(p.targets.flatMap(words))];
  p.skillTerms = [...new Set(p.skills.map((s) => normalise(s)).filter((s) => s.length > 1))];
  p.excludeTerms = [...new Set(p.exclude.map((s) => normalise(s.split(/[(:]/)[0])).filter((s) => s.length > 2 && s.split(' ').length <= 4))];
  return p;
}

const SENIOR = /\b(senior|sr\.?|lead|principal|staff|head|manager|director|vp|chief)\b/i;

/**
 * Quick fit 0–100 plus human-readable reasons.
 * @returns {{score:number, reasons:string[], warnings:string[]}}
 */
export function quickFit(job, profile) {
  const reasons = [];
  const warnings = [];
  if (!profile?.loaded) return { score: 50, reasons: ['no profile yet — run /naija-jobs onboard'], warnings };

  const title = normalise(job.title || '');
  const desc = normalise(`${job.description || ''} ${job.seniority || ''} ${job.jobFunction || ''}`);
  let score = 30;

  // Title vs target roles
  const titleWords = new Set(title.split(' '));
  const hits = profile.targetWords.filter((w) => titleWords.has(w));
  if (hits.length) {
    score += Math.min(35, hits.length * 15);
    reasons.push(`title matches: ${hits.slice(0, 3).join(', ')}`);
  }

  // Skills in text
  const hay = ` ${title} ${desc} `;
  const skillHits = profile.skillTerms.filter((s) => hay.includes(` ${s} `));
  if (skillHits.length) {
    score += Math.min(30, skillHits.length * 6);
    reasons.push(`skills: ${skillHits.slice(0, 5).join(', ')}`);
  }

  // Seniority vs experience
  const yrs = profile.yearsExperience;
  if (SENIOR.test(job.title || '') && (yrs === null || yrs < 4)) {
    score -= 25;
    warnings.push('seniority likely above your level');
  }
  for (const h of job.hints || []) {
    const need = h.match(/^(\d+)\+ yrs experience/);
    if (need && yrs !== null && +need[1] > yrs + 1) {
      score -= 15;
      warnings.push(`asks ${need[1]}+ yrs (you have ${yrs})`);
    }
    const age = h.match(/^age limit (\d+)/);
    if (age && profile.age && profile.age > +age[1]) {
      score -= 40;
      warnings.push(`age limit ${age[1]} (you are ${profile.age})`);
    }
    if (h === 'NYSC completion required' && /yet-to-serve|currently-serving/.test(profile.nyscStatus)) {
      score -= 30;
      warnings.push('needs NYSC completion');
    }
    if (h === '2:1 minimum' && /lower|third|pass/i.test(profile.degreeClass)) {
      score -= 30;
      warnings.push(`asks 2:1 (you have ${profile.degreeClass})`);
    }
  }

  // Deal-breakers
  const breaker = profile.excludeTerms.find((t) => ` ${title} `.includes(` ${t} `));
  if (breaker) {
    score -= 40;
    warnings.push(`matches your deal-breaker "${breaker}"`);
  }

  for (const f of job.flags || []) warnings.push(`⚠ ${f}`);
  if (job.flags?.length) score -= 30;
  if (job.closed) {
    score = 0;
    warnings.push('listing closed');
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons, warnings };
}
