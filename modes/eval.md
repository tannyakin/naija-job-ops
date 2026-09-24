# Mode: eval — Full Listing Evaluation

When the user pastes a job listing (text or URL), or when the auto-pipeline calls this mode, execute the full evaluation.

---

## Step 0 — Extract the Listing

If the input is a **URL**:
1. Playwright: `browser_navigate` to the URL → `browser_snapshot` to read content
2. If Playwright fails: WebFetch as fallback
3. If WebFetch fails: WebSearch to find a cached or mirrored version
4. If nothing works: ask the user to paste the listing text directly

If the input is **pasted text** (JD already in context): use directly.

If the listing came from a scan, read its entry in `data/scan-results.json` (match by URL) — it already has posting age, applicant count, source, and eligibility hints. Re-check them on the live page; the page wins if they differ.

**LinkedIn URLs:** logged-out job pages work. If Playwright hits a login wall, WebFetch `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{jobId}` (the numeric ID from the URL) — it returns the public JD, posting age and applicant count.

**Verify the listing is active (mandatory for URLs):**
- Active: job title + description + Apply button visible in the main content area
- Closed: only navbar/footer visible, or page shows "no longer available", "position filled", "job expired"
- If closed: tell the user immediately and stop — do not evaluate a dead listing

**Extract and display the listing header before evaluation:**

```
Company:       {name}
Role:          {job title}
Location:      {city/state or Remote/Hybrid}
Work mode:     {Remote / Hybrid / Onsite}
Posted:        {date posted or "not stated"}
Deadline:      {closing date or "not stated"}
Applicants:    {count or "not stated"}
Salary:        {range or "not stated"}
Qualification: {OND / HND / BSc / MSc required, or "not stated"}
Class/grade:   {2:1 minimum / 2:2 accepted / not stated}
NYSC:          {required / preferred / not mentioned}
Age limit:     {e.g. "not older than 26" or "not stated"}
O'Level:       {e.g. "5 credits incl. English & Maths" or "not stated"}
Experience:    {years required or "not stated"}
Apply URL:     {direct link}
```

---

## Step 1 — Load User Profile

Read `profile-skills.md`. If `cv.md` exists, read it too and treat it as the richer source.
Read `config/profile.yml` for NYSC status, qualification level, location preferences, and salary target.

**Missing facts → ask, don't guess.** If the listing has a requirement you cannot check against the profile (e.g. an age limit but no `candidate.date_of_birth`; a 2:1 cutoff but no `class_of_degree`; "5 credits" but no `education.olevel`), ask the user before scoring — follow the Clarifying Questions protocol in `_shared.md`. Save the answer to `config/profile.yml` so you never ask twice.

**Detect archetype** — classify the listing into one of the Nigerian market archetypes from `_shared.md`. If it is a hybrid, name both. This determines what to emphasise in the match analysis.

---

## Block 1 — Role Summary

Produce a concise overview of the listing:
- What the company does, and its position in Nigeria (sector, size, known for what)
- What the role involves day-to-day
- Key requirements (skills, tools, years of experience)
- Who this role is ideal for
- Why this listing is or is not interesting for someone at the user's level

Keep this factual and direct. No hype, no corporate language.

---

## Block 2 — Profile Match

Map the JD requirements to the user's skills and experience from `profile-skills.md` (and `cv.md` if available).

**Format:**
| JD requirement | User has | Match |
|----------------|----------|-------|
| React (3+ years) | React — 2 years (profile-skills.md) | Partial |
| BSc Computer Science | BSc Computer Science (cv.md) | ✅ Full |
| NYSC completed | Currently serving — completes Oct 2026 | ⚠ Timing |

After the table, list gaps:
- **Hard gaps** (would likely disqualify): e.g., requires ICAN certification, user does not have it
- **Soft gaps** (would not disqualify, but worth addressing): e.g., prefers 3 years experience, user has 1.5
- For each gap: is it a blocker, what experience is adjacent, and how should the user address it in a cover letter?

---

## Block 3 — Eligibility Check

This is the most critical block. Be direct and unambiguous.

**Qualification verdict:**
- State the requirement from the JD
- State the user's actual qualification from profile files
- Verdict: ✅ Eligible / ⚠ Borderline / ❌ Not eligible
- If not eligible: explain why and whether to proceed anyway (usually: don't)

**NYSC verdict:**
- State what the JD requires (completion / exemption / currently serving / no mention)
- State the user's current status from `config/profile.yml`
- Verdict: ✅ Eligible / ⚠ Borderline / ❌ Not eligible
- If "currently serving" and role requires "completed" — flag the timeline gap
- If corps members are explicitly welcome: note this as a positive signal

**Age limit verdict** (very common in Nigerian graduate trainee adverts — "not older than 26 by {date}"):
- Compute the user's age on the date the advert specifies (or today) from `candidate.date_of_birth`
- Over the limit → ❌ hard blocker. Never suggest misstating age.

**Class of degree / O'Level verdict:**
- "Minimum Second Class Upper" with user at 2:2 → ❌ unless the advert says "or equivalent experience"
- O'Level credits requirement vs `education.olevel` → ✅ / ❌

**Other eligibility requirements** (professional licences, certifications, citizenship):
- Check for any and assess against user profile
- Flag any hard blockers clearly

**Overall eligibility verdict:**
- **Fully eligible** — no blockers, proceed
- **Borderline** — one or more soft issues, apply but address in cover letter
- **Not eligible** — one or more hard blockers, recommend not applying unless user has context that overrides

---

## Block 4 — Competition and Deadline Analysis

**Applicant count signal:**
- <100: Good window. Strong reason to act quickly.
- 100–500: Competitive. Differentiated application matters.
- 500–1,000: Crowded. Only apply if match is strong.
- 1,000+: Very high competition. Recommend only if score is 4.0+.
- Not stated: Treat as moderate competition.

**Posting freshness** (from the page or `data/scan-results.json`):
- Posted in the last 24 hours: early-applicant window — recruiters often shortlist the first batch. Act today.
- 1–7 days: still fresh.
- 8–30 days: most shortlisting may be done; apply only if fit is strong.
- 30+ days (and no deadline): may be a stale or evergreen posting — check legitimacy.

**Deadline urgency:**
- Closing ≤7 days: Act today if you want to apply.
- Closing 8–21 days: This week.
- Closing 22+ days: No immediate rush.
- No deadline: Moderate urgency — listings without deadlines often close without warning.

**Recommendation:** State explicitly whether the user should act today, this week, or can take their time.

---

## Block 5 — Company Context

Cover:
- What this company is known for in Nigeria
- Sector, approximate size, years in Nigeria
- Reputation as an employer — use WebSearch for Glassdoor, Jobberman reviews, or LinkedIn presence
- Known for graduate/management trainee programmes? Structured career paths?
- Any recent news relevant to hiring or company health (layoffs, expansion, funding, regulatory issues)
- Whether applications via this company are known to be competitive or accessible
- For smaller or less-known companies: assess legitimacy using the signals in `_shared.md`

---

## Block 6 — Application Strategy

Give concrete, actionable guidance:

1. **Should the user apply?** Be direct: Yes / No / Maybe (with condition). Explain in one sentence.
2. **What to lead with:** The 2–3 things from their profile most likely to resonate with this JD
3. **How to address gaps:** Specific framing suggestions for the cover letter or form answers
4. **What to research before applying:** Anything the user should know about this company or role before submitting
5. **Keywords to include:** 10–15 ATS keywords from the JD that should appear in the CV or cover letter

---

## Score

After all 6 blocks, produce the final score:

```
Score: X.X / 5.0

Breakdown:
  Role-skill match:          X.X (25%)
  Qualification eligible:    X.X (20%)
  NYSC / age / O'Level:      X.X (15%)
  Freshness & competition:   X.X (15%)
  Deadline urgency:          X.X (5%)
  Company legitimacy:        X.X (10%)
  Location / remote fit:     X.X (5%)
  Growth potential:          X.X (5%)

Recommendation: {Apply / Flag for review / Skip}
```

Scores for eligibility dimensions use a simple pass/fail logic:
- ✅ Full eligibility = 5.0 for that dimension
- ⚠ Borderline = 2.5
- ❌ Not eligible = 0 (and flag as blocker regardless of overall score)

---

## Posting Legitimacy Assessment

Assess whether the listing is real and active. Use the signals from `_shared.md`. This is a separate output from the 1–5 score.

**Format:**

```
Legitimacy: {High Confidence / Proceed with Caution / Suspicious}

Signals:
  ✅ Apply button active (Playwright verified)
  ✅ Known Nigerian employer (GTBank)
  ⚠ No salary stated
  ⚠ Posted 45 days ago — approaching stale threshold

Notes: GTBank runs continuous recruitment for graduate trainees. Older posting age
       is normal for this programme type.
```

**Hard blocker:** If the listing requests an application fee of any kind, mark as **Suspicious** and warn the user directly:
> "⚠ This listing requests a fee to apply. Legitimate Nigerian employers do not charge application fees. This is a strong scam indicator — do not pay and do not proceed."

---

## Post-Evaluation: Save Report

Save the full evaluation to `reports/{###}-{company-slug}-{YYYY-MM-DD}.md`.

- `{###}` = next sequential number (list `reports/`, find highest prefix, add 1, zero-pad to 3 digits)
- `{company-slug}` = company name in lowercase with hyphens (e.g., `gt-bank`)
- `{YYYY-MM-DD}` = today's date

**Report header format:**

```markdown
# Evaluation: {Company} — {Role}

**Date:** {YYYY-MM-DD}
**Archetype:** {detected}
**Score:** {X.X/5}
**Legitimacy:** {High Confidence | Proceed with Caution | Suspicious}
**URL:** {application URL}
**PDF:** {path or pending}

---

## Listing Details
{the listing header table from Step 0}

## Block 1 — Role Summary
{full content}

## Block 2 — Profile Match
{full content}

## Block 3 — Eligibility Check
{full content}

## Block 4 — Competition and Deadline
{full content}

## Block 5 — Company Context
{full content}

## Block 6 — Application Strategy
{full content}

## Score
{full score breakdown}

## Legitimacy Assessment
{full legitimacy output}

## ATS Keywords
{list of 10–15 keywords from the JD}
```

---

## Post-Evaluation: Register in Tracker

Write a TSV file to `batch/tracker-additions/{num}-{company-slug}.tsv`:

```
{num}\t{date_found}\t{company}\t{role}\t{location}\t{score}/5\t{deadline}\t{applicants}\t{status}\t{pdf}\t{report_link}\t{notes}
```

- `status` = `Evaluated`
- `pdf` = `❌` (unless auto-pipeline generated a PDF)
- `report_link` = `[{num}](reports/{num}-{company-slug}-{YYYY-MM-DD}.md)`
- `notes` = one-line summary of the recommendation

NEVER edit `data/applications.md` directly to add new rows. Always use the TSV → `node merge-tracker.mjs` pattern.
