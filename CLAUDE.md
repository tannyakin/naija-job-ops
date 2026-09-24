# naija-job-ops: AI Job Search Pipeline for Nigeria

## Origin

This system is built on **career-ops** by Santiago Ferreira (santifer).
Original repo: [github.com/santifer/career-ops](https://github.com/santifer/career-ops), [santifer.io](https://santifer.io)

naija-job-ops adapts the full career-ops architecture for the Nigerian job market: Nigerian job boards, company tracker, NYSC eligibility scoring, qualification-level filtering, and Nigerian employer context.

**It works out of the box but is designed to be made yours.** If the archetypes don't match your career, the scoring doesn't reflect your priorities, or you want to add companies, just ask. The system reads the same files it uses. You (AI Agent) can edit config and mode files directly when the user asks.

## Data Contract (CRITICAL)

**User Layer (NEVER auto-updated; personalisation goes HERE):**
- `cv.md`, `profile-skills.md`, `config/profile.yml`, `portals.yml`
- `data/*`, `reports/*`, `output/*`

**System Layer (updatable; DON'T put user data here):**
- `modes/_shared.md`, `modes/eval.md`, all other mode files
- `CLAUDE.md`, `*.mjs` scripts, `dashboard/*`, `templates/*`, `batch/*`

**THE RULE: When the user asks to customise anything (target roles, skills, location preferences, salary expectations, NYSC status), ALWAYS write to `config/profile.yml` or `profile-skills.md`. NEVER edit `modes/_shared.md` for user-specific content.** This ensures system updates cannot overwrite their customisations.

## Update Check

On the first message of each session, run the update checker silently:

```bash
node update-system.mjs check
```

Parse the JSON output:
- `{"status": "update-available", "local": "1.0.0", "remote": "1.1.0", "changelog": "..."}` → tell the user:
  > "naija-job-ops update available (v{local} → v{remote}). Your data (CV, profile, tracker, reports) will NOT be touched. Want me to update?"
  If yes → run `node update-system.mjs apply`. If no → run `node update-system.mjs dismiss`.
- `{"status": "up-to-date"}` → say nothing
- `{"status": "dismissed"}` → say nothing
- `{"status": "offline"}` → say nothing

## What is naija-job-ops

AI-powered job search automation built on Claude Code: fresh-job scanning (logged-out LinkedIn, Nigerian job boards, remote boards open to Nigeria, company career pages), profile matching, offer evaluation, CV building and tailoring, cover letters, form/survey answers, aptitude and interview practice, and application tracking. Designed for Nigerian students, graduates, NYSC corps members, and entry-to-mid level job seekers in any field.

### Main Files

| File | Function |
|------|----------|
| `profile-skills.md` | Skills and background when no CV exists: primary source of truth for new users |
| `cv.md` | Full CV when available: takes precedence over profile-skills.md |
| `config/profile.yml` | Candidate identity, targets, location, NYSC status |
| `data/applications.md` | Application tracker |
| `data/pipeline.md` | Inbox of pending URLs to evaluate |
| `data/scan-history.tsv` | Scanner dedup history |
| `data/scan-results.json` | Full ranked results of the latest scan (read by `match`) |
| `portals.yml` | Search defaults, LinkedIn, Nigerian boards, remote boards, company config |
| `scan.mjs` + `sources/*.mjs` | Zero-token multi-source scanner (LinkedIn, boards, remote, ATS) + quick profile fit |
| `tracker-lib.mjs` | Single source of truth for the 12-column tracker format |
| `templates/cv-template.html` | HTML template for CV PDF generation |
| `templates/cover-letter-template.html` | HTML template for cover letter PDF generation |
| `generate-pdf.mjs` | Playwright: HTML to PDF |
| `batch/batch-prompt.md` | System prompt for claude -p worker processes |
| `reports/` | Evaluation reports (format: `{###}-{company-slug}-{YYYY-MM-DD}.md`) |

### Commands

| Command | Mode |
|---------|------|
| `/naija-jobs` | Show command menu |
| `/naija-jobs tutorial` | Guided 10-minute tour of the whole system |
| `/naija-jobs {JD or URL}` | Auto-pipeline: evaluate + report + tracker |
| `/naija-jobs eval` | Evaluate a single listing |
| `/naija-jobs scan {role}` | Scan LinkedIn + Nigerian boards + remote + company pages, newest first |
| `/naija-jobs linkedin {role}` | LinkedIn only (logged-out), newest first, with applicant counts |
| `/naija-jobs remote {role}` | Remote roles open to Nigeria-based candidates |
| `/naija-jobs match` | Rank scan results against the user's full CV, ask what's missing |
| `/naija-jobs pipeline` | Process pending URLs from data/pipeline.md |
| `/naija-jobs batch` | Batch process multiple listings with parallel workers |
| `/naija-jobs pdf` | Generate tailored CV and cover letter PDF |
| `/naija-jobs cover-letter` | Cover letter as PDF, text-box answer, or email |
| `/naija-jobs cv build` | Build a CV from scratch through a guided interview |
| `/naija-jobs cv edit` | ATS audit and CV improvement |
| `/naija-jobs cv tailor` | Tailor CV to a specific job listing |
| `/naija-jobs tracker` | Application status overview |
| `/naija-jobs apply` | Application form, screening question and survey answers |
| `/naija-jobs interview` | Company-specific interview research (Nigerian formats) |
| `/naija-jobs mock` | Live mock interview with feedback |
| `/naija-jobs aptitude` | Aptitude / CBT / SJT practice and revision plan |
| `/naija-jobs deep` | Deep research on a Nigerian company |
| `/naija-jobs onboard` | Run onboarding or update your profile |

## First Run and Onboarding (IMPORTANT)

**Before doing ANYTHING else, check if the system is set up.** Run these checks silently every session:

1. Does `profile-skills.md` exist?
2. Does `config/profile.yml` exist (not just profile.example.yml)?
3. Does `portals.yml` exist (not just templates/portals.example.yml)?
4. Does `data/applications.md` exist?

If `modes/_profile.md` is missing, copy from `modes/_profile.template.md` silently before proceeding.

**If ANY of the 4 files above is missing, enter onboarding mode.** Do NOT evaluate listings or run scans until the basics are in place. See `modes/onboard.md` for the full guided flow.

**After setup is confirmed**, always check:
- Does `cv.md` exist? If not, note it and remind the user at an appropriate moment.
- Are there pending TSV files in `batch/tracker-additions/`? If so, remind: `node merge-tracker.mjs`.

## Auto-Detection (CRITICAL)

Every time the user sends a message that is NOT a recognised slash command, check what they gave you and route accordingly:

1. **Contains a URL** → navigate with Playwright, verify listing is active (title + description + apply button present), extract full JD, run full eval pipeline
2. **Looks like a job description**: multi-line text with role, responsibilities, or requirements → parse as JD, run full eval pipeline
3. **Looks like a role or skill description**: short phrase like "android developer", "graduate trainee finance", "kotlin java mobile" → treat as quick-start, run `node scan.mjs --keywords "{phrase}"` (see `modes/scan.md`), show top results and append: "For more accurate results run /naija-jobs onboard so I can learn your full profile, qualifications, and preferences."
4. **Anything else** → respond normally as a conversation

## CV Source of Truth

- `profile-skills.md` is the source of truth when no CV exists
- `cv.md` is the canonical CV when it exists: read this instead of profile-skills.md, or alongside it
- **NEVER hardcode user details**: read from these files at evaluation time, every time
- After any evaluation, if the user says a score is wrong or you missed context, update `profile-skills.md` or `config/profile.yml` accordingly

## Offer Verification (MANDATORY)

**NEVER trust WebSearch or WebFetch to verify if a listing is still active.** ALWAYS use Playwright:
1. `browser_navigate` to the URL
2. `browser_snapshot` to read content
3. Only footer/navbar visible with no JD content = closed. Title + description + Apply button = active.

**Exception for batch workers (`claude -p`):** Playwright is not available in headless pipe mode. Use WebFetch as fallback and mark the report with `**Verification:** unconfirmed (batch mode)`. The user can verify manually.

## Skill Modes

| If the user... | Mode file |
|----------------|-----------|
| Pastes JD or URL | auto-pipeline (eval + report + tracker) |
| Says /naija-jobs eval | `modes/eval.md` |
| Says /naija-jobs compare | `modes/compare.md` |
| Says /naija-jobs tutorial or help | `modes/tutorial.md` |
| Says /naija-jobs scan, linkedin, remote, boards | `modes/scan.md` |
| Says /naija-jobs match | `modes/match.md` |
| Says /naija-jobs cover-letter | `modes/cover-letter.md` |
| Says /naija-jobs mock | `modes/mock-interview.md` |
| Says /naija-jobs aptitude | `modes/aptitude.md` |
| Says /naija-jobs pdf | `modes/pdf.md` |
| Says /naija-jobs cv build, cv edit or cv tailor | `modes/cv.md` |
| Says /naija-jobs tracker | `modes/tracker.md` |
| Says /naija-jobs apply | `modes/apply.md` |
| Says /naija-jobs deep | `modes/deep.md` |
| Says /naija-jobs outreach | `modes/outreach.md` |
| Says /naija-jobs followup | `modes/followup.md` |
| Says /naija-jobs interview | `modes/interview-prep.md` |
| Says /naija-jobs patterns | `modes/patterns.md` |
| Says /naija-jobs training | `modes/training.md` |
| Says /naija-jobs project | `modes/project.md` |
| Says /naija-jobs onboard | `modes/onboard.md` |
| Says /naija-jobs pipeline | `modes/pipeline.md` |
| Says /naija-jobs batch | `modes/batch.md` |

### Context Loading by Mode

For all evaluation and action modes, load `modes/_shared.md` and `modes/_profile.md` first, then the specific mode file.

Modes that require `_shared.md` + `_profile.md` + their mode file:
- `eval`, `pdf`, `apply`, `pipeline`, `scan`, `match`, `cover-letter`, `batch`, auto-pipeline, `compare`

Standalone modes (only their mode file):
- `tutorial`, `tracker`, `deep`, `onboard`, `cv`, `outreach`, `followup`, `interview-prep`, `mock-interview`, `aptitude`, `patterns`, `training`, `project`

## Ask, Don't Guess

When a fact needed for a good recommendation is missing (age for an age-limited scheme, class of degree, O'Level, years of experience, a vague CV detail), ask the user, at most 3 short questions at a time, and save the answer to `config/profile.yml` or `profile-skills.md` so it is never asked twice. Full protocol: `modes/_shared.md` → Clarifying Questions Protocol.

## Job Sources and Scraping Etiquette

- `node scan.mjs` is the first step of every scan. It is zero-token and polite (sequential LinkedIn requests with delays, stops on rate limits).
- LinkedIn is read **logged-out only** (public guest job pages). Never log in to LinkedIn, never use the user's cookies or account.
- Sources that block scripts are reported as "needs browser": use Playwright for those, one session at a time.
- Scanning is for the user's personal job search. Don't run scans in tight loops.

## Ethical Use (CRITICAL)

**This system is a quality filter, not a volume tool.**

- **NEVER submit an application without the user reviewing it first.** Fill forms, draft answers, generate PDFs, but always STOP before clicking Submit/Send/Apply. The user makes the final call.
- **Strongly discourage low-fit applications.** If a score is below 3.5/5, recommend against applying. If below 3.0, recommend skipping with a clear explanation.
- **Quality over speed.** Five well-targeted applications beat fifty generic ones.
- **Respect recruiters' time.** Only send what is worth reading.
- **Assessments are the user's own.** Help practise for aptitude, personality and SJT tests; never answer a live test for the user.
- **Never misrepresent** age, grades, NYSC status, qualifications or experience in CVs, forms or interviews.

## Writing Style (STRICT)

Applies to every piece of text: docs, mode files, code comments, CLI output, generated CVs, cover letters and form answers, commit messages and PR descriptions.

- **No em dashes, ever.** Use a comma, colon, parentheses or a new sentence.
- Write like a person: plain words, varied sentences, specific details. No filler, no hype, no stock AI phrasing.

## Commits and Pull Requests

- Commit messages are one line in Conventional Commits style: `type: brief description` (e.g. `feat: add remote job filter`, `fix: parse 12-column tracker rows`). Types: feat, fix, docs, refactor, test, chore.
- No trailers, co-author lines, tool names or session links in commits.
- PR titles follow the same style. PR descriptions are standard software write-ups (summary, changes, testing) and never mention the AI assistant or tooling used to write them.

## Stack and Conventions

- Node.js (mjs modules), Playwright (PDF + scraping), YAML (config), HTML/CSS (template), Markdown (data)
- Scripts in `.mjs`, configuration in YAML
- Output in `output/` (gitignored), Reports in `reports/`
- JDs in `jds/` (referenced as `local:jds/{file}` in pipeline.md)
- Batch in `batch/` (gitignored except scripts and prompt)
- Report numbering: sequential 3-digit zero-padded, max existing + 1
- **RULE: After each batch of evaluations, run `node merge-tracker.mjs`** to merge tracker additions and avoid duplications
- **RULE: NEVER create new entries in applications.md if company+role already exists.** Update the existing entry.

## TSV Format for Tracker Additions

Write one TSV file per evaluation to `batch/tracker-additions/{num}-{company-slug}.tsv`. Single line, 12 tab-separated columns:

```
{num}\t{date_found}\t{company}\t{role}\t{location}\t{score}/5\t{deadline}\t{applicants}\t{status}\t{pdf_emoji}\t{report_link}\t{notes}
```

**Column order:**
1. `num`: sequential number (integer)
2. `date_found`: YYYY-MM-DD
3. `company`: short company name
4. `role`: job title
5. `location`: city/state or Remote
6. `score`: format `X.X/5`
7. `deadline`: YYYY-MM-DD or `N/A`
8. `applicants`: number or `N/A`
9. `status`: canonical status (e.g., `Evaluated`)
10. `pdf`: `✅` or `❌`
11. `report`: markdown link `[num](reports/...)`
12. `notes`: one-line summary

## Pipeline Integrity Rules

1. **NEVER edit applications.md to ADD new rows**: Write TSV in `batch/tracker-additions/` and run `node merge-tracker.mjs`.
2. **YES update existing rows in applications.md directly** for status changes and notes.
3. All reports MUST include `**URL:**` in the header.
4. All statuses MUST be canonical (see `templates/states.yml`).
5. Health check: `node verify-pipeline.mjs`
6. Normalize statuses: `node normalize-statuses.mjs`
7. Dedup: `node dedup-tracker.mjs`

## Tracker Column Order

```markdown
| # | Date Found | Company | Role | Location | Score | Deadline | Applicants | Status | PDF | Report | Notes |
```

## Canonical States (Statuses)

| Status | When to use |
|--------|-------------|
| `Evaluated` | Report completed, pending decision |
| `Applied` | Application sent |
| `Responded` | Company responded |
| `Interview` | Active interview process |
| `Offer` | Offer received |
| `Rejected` | Rejected by company |
| `Discarded` | Discarded by candidate or listing closed |
| `SKIP` | Doesn't fit, don't apply |

**Rules:**
- No markdown bold (`**`) in status field
- No dates in status field (use the Date Found column)
- No extra text (use the Notes column)

# currentDate
Today's date is 2026-04-11.
