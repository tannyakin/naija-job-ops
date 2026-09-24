/**
 * tracker-lib.mjs — Shared parsing/formatting for data/applications.md
 *
 * Canonical 12-column layout (see CLAUDE.md → Tracker Column Order):
 *   | # | Date Found | Company | Role | Location | Score | Deadline | Applicants | Status | PDF | Report | Notes |
 *
 * Legacy 9-column rows (inherited from career-ops) are still read:
 *   | # | Date | Company | Role | Score | Status | PDF | Report | Notes |
 *
 * Every script that reads or writes the tracker goes through this module so
 * the column order lives in exactly one place.
 */

export const TRACKER_HEADER =
  '| # | Date Found | Company | Role | Location | Score | Deadline | Applicants | Status | PDF | Report | Notes |';
export const TRACKER_SEPARATOR =
  '|---|------------|---------|------|----------|-------|----------|------------|--------|-----|--------|-------|';

const SCORE_RE = /^\**\s*(\d+(\.\d+)?\/5|N\/A|DUP)\s*\**$/i;

/** Split a markdown table row into trimmed cells (without the outer empties). */
export function splitRow(line) {
  const parts = line.split('|').map(s => s.trim());
  // Leading "|" gives an empty first cell; trailing "|" an empty last cell.
  if (parts[0] === '') parts.shift();
  if (parts.length && parts[parts.length - 1] === '') parts.pop();
  return parts;
}

/**
 * Parse one tracker row. Returns null for headers, separators and non-data lines.
 * The returned object always has the 12-column fields; legacy rows get '—'
 * for location, deadline and applicants.
 */
export function parseAppLine(line) {
  if (!line.startsWith('|')) return null;
  const cells = splitRow(line);
  if (cells.length < 8) return null;
  const num = parseInt(cells[0], 10);
  if (isNaN(num) || num === 0) return null;

  // 12-col rows have the score in cell 5; legacy rows have it in cell 4.
  const isLegacy = cells.length < 11 || (SCORE_RE.test(cells[4]) && !SCORE_RE.test(cells[5]));

  if (isLegacy) {
    return {
      num, date: cells[1], company: cells[2], role: cells[3],
      location: '—', score: cells[4], deadline: '—', applicants: '—',
      status: cells[5], pdf: cells[6] || '', report: cells[7] || '',
      notes: cells.slice(8).join(' | '),
      legacy: true, raw: line,
    };
  }

  return {
    num, date: cells[1], company: cells[2], role: cells[3],
    location: cells[4], score: cells[5], deadline: cells[6], applicants: cells[7],
    status: cells[8], pdf: cells[9] || '', report: cells[10] || '',
    notes: cells.slice(11).join(' | '),
    legacy: false, raw: line,
  };
}

/** Format an app object as a canonical 12-column row. */
export function formatAppLine(app) {
  const v = (x) => (x === undefined || x === null || x === '' ? '—' : String(x).replace(/\|/g, '/'));
  return `| ${app.num} | ${v(app.date)} | ${v(app.company)} | ${v(app.role)} | ${v(app.location)} | ${v(app.score)} | ${v(app.deadline)} | ${v(app.applicants)} | ${v(app.status)} | ${app.pdf || '❌'} | ${v(app.report)} | ${app.notes ? String(app.notes).replace(/\|/g, '/') : ''} |`;
}

/** Parse all data rows of an applications.md string. */
export function parseTracker(content) {
  const apps = [];
  for (const line of content.split('\n')) {
    const app = parseAppLine(line);
    if (app) apps.push(app);
  }
  return apps;
}
