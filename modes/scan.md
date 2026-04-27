# Mode: scan — Nigerian Portal Scanner

Scan Nigerian job boards and tracked companies for new listings that match the user's profile. Filter, deduplicate, verify liveness, and add new listings to the pipeline for evaluation.

## Recommended execution

Run as a subagent to avoid consuming main context:

```
Agent(
    subagent_type="general-purpose",
    prompt="[content of _shared.md]\n\n[content of scan.md]\n\nUser profile summary: [extracted from profile-skills.md]",
    run_in_background=True
)
```

---

## Configuration

Read `portals.yml` which contains:
- `search_queries` — WebSearch queries with `site:` filters per Nigerian job board
- `tracked_companies` — Nigerian companies with `careers_url` for direct Playwright scanning
- `title_filter` — positive/negative keywords and seniority boost terms

Read user profile from `profile-skills.md` and `config/profile.yml` to understand target roles, skills, qualification level, NYSC status, and location preferences.

---

## Discovery Strategy (3 levels, all additive)

### Level 1 — Playwright (primary)

For each company in `tracked_companies` with `enabled: true` and `careers_url` defined:
1. `browser_navigate` to the `careers_url`
2. `browser_snapshot` to read all visible job listings
3. Extract title + URL for each listing found
4. If the page paginates, navigate additional pages
5. If `careers_url` returns 404 or redirect, try `scan_query` as fallback and note the broken URL

This is the most reliable method — it reads pages in real time, works with SPAs, and does not depend on search engine caching.

### Level 2 — WebSearch queries (broad discovery)

For each query in `search_queries` with `enabled: true`:
1. Execute WebSearch with the configured query
2. Extract title, URL, and company from each result
3. Accumulate candidates (deduplicate with Level 1 results)

WebSearch results may be stale (Google caches for days or weeks). Level 2 results require liveness verification before adding to pipeline (see Liveness Verification below).

Level 2 is useful for discovering companies not yet in `tracked_companies`.

### Level 3 — Nigerian job board direct scan (supplementary)

If specific Nigerian portals are not covered by Level 1 companies or Level 2 queries, directly navigate:
- `jobberman.com` — search with role keywords from user profile
- `myjobmag.com` — search by category matching user's target archetype
- `ngcareers.com` — search by keyword
- `hotnigerianjobs.com` — search by keyword
- `ng.indeed.com` — search by job title + Nigeria
- `linkedin.com/jobs` — search by role + Nigeria, filter to past 30 days

Extract all visible listings and accumulate as candidates.

---

## Workflow

1. **Read configuration**: `portals.yml`
2. **Read dedup sources**: `data/scan-history.tsv`, `data/applications.md`, `data/pipeline.md`
3. **Read user profile**: `profile-skills.md` + `config/profile.yml`
4. **Run all 3 levels** (Levels 2 and 3 can run in parallel; Level 1 must be sequential — never 2 Playwright sessions at once)
5. **Filter by title** using `title_filter` from portals.yml:
   - At least 1 positive keyword must appear in the title (case-insensitive)
   - 0 negative keywords can appear
   - `seniority_boost` keywords raise priority but are not required
6. **Filter by user profile** — additionally filter results to plausible matches:
   - Discard roles that require a higher qualification than the user holds
   - Discard roles that require NYSC completion if the user has not completed and the JD makes it a hard requirement
   - Discard roles in locations the user has excluded
7. **Deduplicate** against all 3 dedup sources (URL exact match and company+role normalised match)
8. **Liveness verification** (Level 2 and Level 3 results only — Level 1 is real-time):
   - Navigate each URL with Playwright: `browser_navigate` + `browser_snapshot`
   - Active: job title + description + Apply/Submit button visible
   - Closed: only navbar/footer, or explicit "no longer available" / "position filled" message
   - If URL errors (timeout, 403): mark as `skipped_expired` and continue
   - NEVER run 2 Playwright sessions in parallel
9. **For each new verified listing**:
   - Add to `data/pipeline.md` under Pending: `- [ ] {url} | {company} | {title}`
   - Record in `data/scan-history.tsv`: `{url}\t{date}\t{source}\t{title}\t{company}\tadded`
10. **For filtered/discarded listings**, record in `data/scan-history.tsv` with appropriate status:
    - `skipped_title` — did not match title filter
    - `skipped_profile` — did not match user profile (qualification, NYSC, location)
    - `skipped_dup` — already in pipeline or applications
    - `skipped_expired` — liveness check failed

---

## Scan History Format

`data/scan-history.tsv` — tab-separated, one row per URL seen:

```
url	first_seen	source	title	company	status
https://jobberman.com/...	2026-04-11	Level1-GTBank	Graduate Trainee	GTBank	added
https://myjobmag.com/...	2026-04-11	Level2-search	Software Engineer	Interswitch	skipped_dup
https://ng.indeed.com/...	2026-04-11	Level3-Indeed	Android Developer	Andela	added
```

---

## Portals Config Management

Each company in `tracked_companies` should have `careers_url`. If it is missing:
1. Try the pattern for known ATS platforms (Workable, SmartRecruiters, Lever)
2. If no pattern applies, do a WebSearch: `"{company}" careers jobs Nigeria`
3. Navigate with Playwright to confirm it works
4. **Save the found URL to `portals.yml`** for future scans

If a `careers_url` returns 404 or redirects to a non-careers page, note it in the scan summary and mark for manual update.

---

## Scan Output

```
Nigerian Portal Scan — {YYYY-MM-DD}
════════════════════════════════════
Sources scanned:      {N companies (Level 1)} + {N queries (Level 2)} + {N boards (Level 3)}
Total listings found: {N}
Filtered by title:    {N} relevant
Filtered by profile:  {N} disqualified (qualification/NYSC/location)
Duplicates:           {N} (already evaluated or in pipeline)
Expired/closed:       {N} removed
New added to pipeline: {N}

New listings:
  + {company} | {role} | {location} | {source}
  + {company} | {role} | {location} | {source}
  ...

→ Run /naija-jobs pipeline to evaluate new listings.
→ Or paste any URL from the list above to evaluate it individually.
```

If no new listings were found:
```
No new listings found matching your profile. 
Checked {N} sources. {N} listings seen, all duplicates or filtered out.
→ Try broadening your keywords in portals.yml or run /naija-jobs onboard to update your profile.
```

---

## Nigerian Company Career Pages — Known Patterns

| Company | Platform | careers_url pattern |
|---------|----------|---------------------|
| GTBank | Custom | https://www.gtbank.com/careers |
| Zenith Bank | Custom | https://www.zenithbank.com/careers |
| Access Bank | Custom | https://www.accessbankplc.com/careers |
| Flutterwave | Lever | https://jobs.lever.co/flutterwave |
| Paystack | Workday | https://paystack.com/careers |
| Moniepoint | Custom | https://moniepoint.com/careers |
| Kuda Bank | Greenhouse | https://kuda.com/en-ng/careers |
| Andela | Workable | https://andela.com/careers/ |
| Interswitch | SmartRecruiters | https://interswitchgroup.com/careers |
| MTN Nigeria | Custom | https://www.mtnonline.com/careers |
| Airtel Nigeria | Custom | https://airtel.africa/nigeria/careers |
| Shell Nigeria | Custom | https://www.shell.com.ng/careers |
| Unilever Nigeria | Unilever global | https://www.unilever.com/careers/ (filter NG) |
| Nestlé Nigeria | Custom | https://www.nestle-cwa.com/en/jobs |
| Dangote Group | Custom | https://dangote.com/careers |
| Deloitte Nigeria | Custom | https://www2.deloitte.com/ng/en/careers |
| KPMG Nigeria | Custom | https://www.kpmg.com/ng/en/home/careers.html |
| PwC Nigeria | Custom | https://www.pwc.com/ng/en/careers.html |

These are starting-point URLs — verify with Playwright on first use and update `portals.yml` with the actual working URL.
