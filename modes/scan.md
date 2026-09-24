# Mode: scan (find the newest, best-fit jobs on LinkedIn, Nigerian boards and remote boards)

Find fresh listings across LinkedIn, the main Nigerian job boards, remote boards open to Nigeria, and tracked company career pages. Rank them by **freshness**, **competition** (applicant count), and **fit with the user's profile**, then hand the best ones to `/naija-jobs match` or the pipeline.

Sub-commands that route here with presets:

| Command | Preset |
|---------|--------|
| `/naija-jobs scan` | All sources, keywords from profile, last 24h |
| `/naija-jobs scan {role or field}` | All sources for that role/field (any field, e.g. "nursing", "civil engineer", "HR") |
| `/naija-jobs linkedin {role}` | `--source linkedin --since 24h`. Add "last hour" → `--since 1h` |
| `/naija-jobs remote {role}` | `--source remote --since 7d` plus LinkedIn with `--workplace remote` |
| `/naija-jobs boards {role}` | `--source boards` (Jobberman, MyJobMag, HotNigerianJobs, NgCareers, Jobgurus, Indeed NG) |

---

## Step 0: Make sure we know what to look for

Read `config/profile.yml`, `profile-skills.md`, and `cv.md` (if present), and `portals.yml`.

- If the user named a role/field in the command, use it as the keywords.
- Otherwise use `search.keywords` from `portals.yml`, then `target_roles.primary` from the profile.
- **If there are no keywords at all, ask** (Clarifying Questions Protocol, `_shared.md`):
  1. "What roles or fields should I search for? (e.g. data analyst, graduate trainee banking, nursing)"
  2. "Nigeria only, remote only, or both?"
  3. "Any city preference? (Lagos, Abuja, Port Harcourt, anywhere)"
- If the profile has no experience level and the user did not say, ask whether they want internship/entry-level, mid, or senior roles. It changes the LinkedIn filters (`--experience internship,entry`).

Offer to save new answers to `portals.yml` (`search.keywords`) and `config/profile.yml`.

---

## Step 1: Run the zero-token scanner

```bash
node scan.mjs --keywords "{kw1}" --keywords "{kw2}" [--source ...] [--since 24h] [--location Lagos] [--experience entry,associate] [--workplace remote]
```

- `--since` accepts `1h`, `6h`, `24h`, `3d`, `1w`. For "newest postings", use `1h`–`24h`.
- The script is polite (sequential LinkedIn requests with delays). If it prints "rate-limited", do not retry LinkedIn for 15–30 minutes.
- Output files:
  - `data/scan-results.json`: every result, ranked, with `ageHours`, `applicants`, `fit`, `fitReasons`, `warnings`, `hints`, `flags`, `eligibility` (remote), `isNew`
  - `data/pipeline.md`: new, reasonably matched, non-suspicious listings appended under `## Pending`
  - `data/scan-history.tsv`: dedup history

Read `data/scan-results.json` after the run.

---

## Step 2: Cover what the script couldn't (browser fallback)

`scan-results.json` lists two things the script could not read:

1. **`needs_browser`**: boards that block plain HTTP (always Indeed Nigeria; sometimes others). For each, with Playwright:
   - `browser_navigate` to the search URL (replace `{q}` with the keywords, sort by date if the site offers it)
   - `browser_snapshot` → extract title, company, location, posted date, URL for each listing
   - Keep only listings posted within the `--since` window (or 7 days if the board only shows dates)
2. **`browser_companies`**: tracked companies on custom career sites. Only visit these when the user asked for a company scan or the list is short (≤ 10); otherwise mention them.

Also run 2–3 **WebSearch** queries for sources no scraper covers, e.g.:
- `"{role}" recruitment 2026 site:gov.ng` (public sector)
- `"{role}" graduate trainee programme 2026 Nigeria`

Rules: NEVER run two Playwright sessions in parallel. Treat WebSearch hits as unverified until opened.

Add browser/WebSearch finds to the list with the same fields, and append the good ones to `data/pipeline.md` and `data/scan-history.tsv` using the formats below.

---

## Step 3: Sanity-check the top results

For the top 10 by rank:
- Anything with `flags` (fee, personal Gmail, WhatsApp-only, BVN) → move to a "⚠ Be careful" list with the reason. Never recommend applying.
- `hints` with an age limit, 2:1, NYSC completion or O'Level requirement the profile can't confirm → ask the user (max 3 questions), then update the profile.
- Remote roles with `eligibility: unclear` → say so; suggest asking the recruiter.
- Listings with `closed: true` are already removed.

---

## Step 4: Present results

```
Naija Job Scan · {YYYY-MM-DD} · {keywords} · last {window}
══════════════════════════════════════════════════════════
Sources: LinkedIn ✓ · Jobberman ✓ · MyJobMag ✓ · HotNigerianJobs ✓ · Remote (5) ✓ · Indeed (browser) ✓
Found {N} · new {N} · added to pipeline {N}

🔥 Apply today (posted <24h, few applicants, good fit)
 1. Data Analyst at Moniepoint · Lagos · 2h ago · <25 applicants · fit 72
    Why: title matches; SQL, Power BI in JD
    {url}

Good matches
 2. ...

Remote, open to Nigeria
 5. Data Analyst at Andela · Africa/Europe · 20h ago · USD · Remotive
    ...

⚠ Be careful
 - Sales Executive at Bright Future Ventures · asks for a fee, Gmail address → skip

Needs your input
 - Access Bank GT programme has an age limit of 26. What is your date of birth? (I'll save it)
```

Then offer next steps:
- "Want me to rank these against your full CV? → `/naija-jobs match`"
- "Evaluate the 🔥 ones now? → I'll run the full evaluation on each"
- "Run this every morning? → I can set up a daily scan (see Scheduling below)"

---

## Pipeline and history formats

`data/pipeline.md` (under `## Pending`):
```
- [ ] {url} | {company} | {title} | {location} | {posted age} | {applicants} | {source} | rank {N}[ | 🔥]
```

`data/scan-history.tsv`:
```
url	first_seen	source	title	company	status	posted	applicants	location	rank
```
Statuses: `added`, `skipped_low_fit`, `skipped_title`, `skipped_profile`, `skipped_dup`, `skipped_expired`, `skipped_scam`.

---

## Scheduling (optional)

Fresh postings reward speed. If the user wants daily scans:
- In Claude Code: suggest `/loop 24h /naija-jobs scan` or a scheduled routine.
- Without Claude: `node scan.mjs` runs on its own (cron / Windows Task Scheduler) and costs no tokens. The user can then run `/naija-jobs match` when they sit down.

---

## Portals config

`portals.yml` sections used here:
- `search`: default `keywords`, `location`, `since`, `experience`, `min_rank`, `min_fit`
- `linkedin`: `enabled`, `details` (how many listings to fetch applicant counts for), `workplace`
- `job_boards`: override/extend the built-in Nigerian boards by `id` (e.g. disable one, fix a URL pattern, add a new board)
- `remote_boards`: `enabled`, `sources`, `since`, `include_restricted`
- `tracked_companies`: company career pages (`careers_url`); Greenhouse, Lever, Ashby, Workable and SmartRecruiters URLs are read via API
- `title_filter`: positive/negative title keywords

If a board keeps showing up in `needs_browser` or returns 0 links, its URL pattern has probably changed. Open it with Playwright, find the new job-link format, and update that board's `job_link` / `search_url` in `portals.yml` (user layer: safe from updates).
