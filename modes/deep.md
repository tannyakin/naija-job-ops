# Mode: deep — Deep Company Research

Produce a thorough research brief on a Nigerian company. Use WebSearch and Playwright. Deliver actionable intelligence for interview preparation or to inform whether to apply.

---

## Inputs

Ask the user: "Which company would you like me to research? And is there a specific role you are targeting there, or is this general interest?"

Load any existing evaluation report for this company from `reports/` if one exists.

---

## Research Output

Deliver a structured brief covering 6 areas:

---

### 1. Company Overview

- What the company does and which sector it operates in
- Year founded, approximate size (employees, revenue if available)
- Presence in Nigeria: HQ location, other Nigerian offices
- Parent company or group affiliation (e.g., "part of the Dangote Group", "subsidiary of Standard Bank South Africa")
- Core products or services relevant to the user's target role
- Major clients or markets served

---

### 2. Employer Reputation in Nigeria

Use WebSearch: `"{company}" employer reviews Nigeria` and `"{company}" Glassdoor` and `"{company}" Jobberman`

- Overall reputation as an employer
- Known strengths (e.g., "excellent graduate training programme", "strong pension scheme", "promotes from within")
- Known weaknesses or red flags (e.g., "salaries are negotiated from a low base", "high attrition in first 2 years")
- Typical salary bands for entry-level and mid-level (from available sources — cite the source)
- Culture signals: work-life balance, management style, diversity

---

### 3. Graduate and Entry-Level Programme History

This is critical information for the target user base.

- Does the company run a named graduate trainee or management trainee programme?
- Programme name, intake frequency (annual, biannual), and typical cohort size
- Duration of the programme (e.g., 12 months, 18 months)
- Known departments or rotations
- Historical application deadline windows (e.g., "typically opens in January–March")
- NYSC placement: do they accept corps members for IT or industrial training placements?
- Absorption rate: what percentage of trainees convert to full-time employment?

---

### 4. Hiring Process

Use WebSearch: `"{company}" recruitment process Nigeria` and `"{company}" interview questions`

- Typical stages (online test, assessment centre, panel interview, medical)
- Known assessment formats (aptitude test provider, group exercise, technical test)
- Approximate time from application to offer (from public reports)
- Any known tips from past candidates

---

### 5. Recent News and Company Health

Use WebSearch for the last 12 months: `"{company}" news 2025 2026` and `"{company}" expansion hiring Nigeria`

- Any significant expansion, new products, or new markets that affect hiring
- Any layoffs, restructuring, regulatory issues, or leadership changes — note the date and scope
- If there are concerning signs: put them plainly. Do not soften financial distress signals.

---

### 6. Candidate Angle

Read `profile-skills.md` and `cv.md` (if available). Based on the user's specific background:

- What makes the user a plausible candidate for this company?
- Which of their skills or experiences would this company value most?
- Any gaps to acknowledge or address?
- What should the user know walking into an interview here that would signal genuine interest?
- One or two specific questions the user should ask that would demonstrate they researched the company

---

## Format

Deliver as a structured markdown document. Offer to save it:

> "Want me to save this research to `reports/deep-{company-slug}-{YYYY-MM-DD}.md` for future reference?"

If yes, save it. This file is informational — it does not follow the evaluation report numbering system and does not get logged in the applications tracker.
