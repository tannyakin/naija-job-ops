# System Context — naija-job-ops

<!-- ============================================================
     THIS FILE IS AUTO-UPDATABLE. Don't put personal data here.

     Your customisations go in config/profile.yml and
     profile-skills.md (never auto-updated).
     This file contains system rules, scoring logic, and
     Nigerian market context that improve with each release.
     ============================================================ -->

## Sources of Truth

| File | Path | When |
|------|------|------|
| profile-skills.md | `profile-skills.md` (project root) | ALWAYS — primary source when no CV |
| cv.md | `cv.md` (project root) | When it exists — richer source, takes precedence |
| profile.yml | `config/profile.yml` | ALWAYS — candidate identity, NYSC status, location prefs |

**RULE: Always read `profile-skills.md` first.** If `cv.md` exists, read it too and treat it as the richer source.
**RULE: NEVER hardcode user details in any mode file.** Re-read these files fresh on every evaluation.
**RULE: If cv.md conflicts with profile-skills.md on a fact, trust cv.md.** It is more detailed.

---

## Scoring System

Every evaluation produces a score from 1.0 to 5.0 across 8 dimensions:

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Role-skill match | 25% | How well the JD maps to the user's skills and experience |
| Qualification eligibility | 20% | OND/HND/BSc/MSc requirement vs user's actual level — hard blocker if mismatched |
| NYSC eligibility | 15% | Required/preferred NYSC status vs user's current status |
| Deadline urgency | 10% | Closing soon scores higher for prioritisation |
| Applicant competition | 10% | Fewer applicants = better opportunity signal |
| Company legitimacy | 10% | Known Nigerian employer vs unverified listing |
| Location fit | 5% | Role location vs user's preferred locations |
| Growth potential | 5% | Structured graduate/management trainee programme vs generic one-off hire |

**Score interpretation:**
- 4.5+ → Strong match. Recommend applying immediately.
- 4.0–4.4 → Good match. Worth applying.
- 3.5–3.9 → Decent match. Apply only if you have a specific reason.
- 3.0–3.4 → Marginal. Flag for review. Only apply if user overrides with reason.
- Below 3.0 → Recommend skipping. Explain clearly why.

**Hard blockers (disqualifying regardless of overall score):**
- Qualification level required is higher than the user's actual level and the JD makes no exception
- NYSC completion required and user has not completed NYSC (unless exemption applies)
- Role requires a professional licence the user does not hold (e.g., COREN registration, ICAN membership)

---

## Nigerian Job Market Archetypes

Classify every listing into one of these archetypes (or a hybrid of two):

| Archetype | Key signals in JD |
|-----------|-------------------|
| Tech — Software Engineering | "backend", "frontend", "mobile", "fullstack", "API", "React", "Node.js", "Java", "Kotlin", "Python", "Django", "Spring Boot" |
| Tech — Data and Analytics | "SQL", "Excel", "Power BI", "data analyst", "data engineer", "Python", "ETL", "dashboard", "reporting" |
| Tech — Product and Design | "product manager", "UX", "UI", "figma", "product design", "user research", "roadmap", "agile" |
| Finance and Banking | "financial analyst", "credit", "risk", "treasury", "investment", "audit", "ACCA", "ICAN", "compliance" |
| FMCG and Consumer Goods | "sales", "territory", "brand", "trade marketing", "supply chain", "logistics", "distribution" |
| Telecoms | "network", "RF", "OSS/BSS", "telecom", "fiber", "last mile", "MTN", "Airtel" |
| Oil and Gas | "petroleum", "upstream", "downstream", "HSE", "pipeline", "subsea", "NNPC", "Shell", "Chevron" |
| Professional Services | "Big 4", "consulting", "advisory", "audit", "assurance", "management consulting", "strategy" |
| Graduate/Management Trainee | "graduate trainee", "management trainee", "NYSC", "fresh graduate", "scheme", "cohort" |

After detecting archetype, adapt framing in the evaluation to emphasise what matters for that sector.

---

## Nigerian Market Context — MANDATORY KNOWLEDGE

Every mode must apply this context when evaluating listings or generating content.

### NYSC (National Youth Service Corps)
- Mandatory one-year national service for Nigerian graduates under 30
- Statuses: `yet-to-serve` | `currently-serving` | `completed` | `exempted`
- Many employers require NYSC completion or exemption as a hard eligibility criterion
- NYSC corps members currently serving are eligible for IT/industrial training postings
- Always check user's NYSC status from `config/profile.yml` before scoring eligibility

### Qualification Levels (in order)
OND (Ordinary National Diploma) → HND (Higher National Diploma) → BSc/BA → MSc/MBA/LLM/PhD

- HND holders sometimes face bias vs BSc at some employers — flag this when relevant
- "Minimum of a Second Class Upper (2:1)" is a common filter — note if user's class of degree is not stated
- Professional qualifications: ICAN (accounting), NSE/COREN (engineering), CIPM (HR), ACCA, CFA

### Location Signals
- "Lagos" typically means Lagos Island/Victoria Island/Lekki axis for corporate roles
- "Abuja" is the FCT — federal government and headquarters-heavy
- "Port Harcourt" is the oil and gas hub
- Remote work is still uncommon among traditional Nigerian employers — flag remote-open roles as high value
- "Open to relocation" is often expected for graduate trainee programmes with national deployment
- State of origin ≠ preferred work location — never conflate them

### Salary and Compensation
- Entry-level: ₦80,000–₦200,000/month (2026 context)
- Mid-level: ₦200,000–₦600,000/month
- Senior/specialist: ₦600,000–₦2,000,000+/month
- Oil and gas and Big 4 often pay above band; FMCG and telecoms are mid-range
- Many job postings in Nigeria omit salary — flag this but don't penalise heavily
- Annual salary is sometimes quoted as a total figure (e.g., ₦3.6M/year = ₦300K/month)

### Applicant Count Signals
- <100 applicants: good opportunity window
- 100–500: competitive but viable
- 500–1,000: crowded; need strong differentiation
- 1,000+: very high competition; apply only if match is strong
- LinkedIn applicant counts are live signals — extract from page snapshot

### Deadline Urgency
- Closing in ≤7 days: high urgency, recommend acting today
- Closing in 8–21 days: moderate urgency
- Closing in 22+ days or no deadline: lower urgency
- If no deadline is stated, treat as moderate urgency

---

## Posting Legitimacy Assessment

Assess every listing for signs of whether it is real and active. This does NOT affect the 1–5 score — it is a separate signal.

**Three tiers:**
- **High Confidence** — Real, active opening
- **Proceed with Caution** — Mixed signals
- **Suspicious** — Multiple ghost indicators, investigate first

**Nigerian-specific legitimacy signals:**

| Signal | Reliability | Notes |
|--------|-------------|-------|
| Apply button active on Playwright snapshot | High | Direct observable fact |
| Listing has specific job description (not generic) | High | Generic JDs are more common for scam listings |
| Company is a known Nigerian employer | High | GTBank, Nestlé Nigeria, MTN etc. = high confidence |
| Posting age | Medium | Under 30 days = good; 30–60 days = mixed; 60+ = concerning |
| Application via company's own domain (not Gmail/Yahoo) | Medium | Gmail/Yahoo application address is a red flag in Nigeria |
| Grammar and formatting quality | Medium | Scam listings often have poor grammar in Nigeria |
| Salary range stated | Low | Many legitimate Nigerian employers omit salary |
| Application fee requested | Hard blocker | NEVER legitimate. Immediately flag as suspicious. |

**Ethical framing:** Present signals and let the user decide. Never accuse. Always note legitimate explanations.

---

## Global Rules

### NEVER
1. Invent experience, skills, or qualifications the user does not have
2. Modify `cv.md` or `profile-skills.md` without explicit user approval
3. Submit, send, or click any form action on behalf of the user
4. Ask for or reveal application fees — flag these immediately as scam signals
5. Recommend roles below 3.0/5 without clear user override
6. Assume the user's NYSC status without reading `config/profile.yml`
7. Assume the user's qualification level — always read from profile files
8. Ignore the tracker — every evaluated listing gets registered

### ALWAYS
1. Read `profile-skills.md` first. If `cv.md` exists, read it too.
2. Read `config/profile.yml` for NYSC status, qualification level, location, and salary targets.
3. Check NYSC eligibility and qualification eligibility as hard blockers before scoring.
4. Extract all available metadata from the listing: company, role, location, work mode, posted date, deadline, applicant count, salary, qualification required, NYSC requirement, application URL.
5. Register the listing in the tracker after every evaluation.
6. Write tracker additions as TSV in `batch/tracker-additions/` — NEVER edit `data/applications.md` to add rows.
7. Include `**URL:**` in every report header.
8. Stop before any submit action. The user always makes the final call.
9. Be direct and honest — if a listing is a bad fit, say so clearly with the reason.
10. Flag any listing that requests an application fee as immediately suspicious.

### Tools

| Tool | Use |
|------|-----|
| Playwright | Verify listings (browser_navigate + browser_snapshot). Primary tool. NEVER run 2+ Playwright sessions in parallel. |
| WebFetch | Fallback for static pages or when Playwright unavailable |
| WebSearch | Company research, salary signals, news — secondary to Playwright |
| Read | profile-skills.md, cv.md, config/profile.yml, cv-template.html |
| Write | Reports, temporary HTML for PDF, batch additions |
| Edit | Update existing tracker entries |
| Bash | `node generate-pdf.mjs`, `node merge-tracker.mjs`, `node verify-pipeline.mjs` |

---

## Professional Writing Rules

These apply to ALL user-facing generated text: CV sections, cover letters, form answers. Not to internal evaluation reports.

### Avoid
- "Passionate about" / "results-oriented" / "hardworking team player"
- "Leveraged" (use "used")
- "Facilitated" (use "ran" or "set up")
- "Dynamic" / "innovative" / "robust" / "seamless"
- "I am writing to express my interest in..." (outdated opener)
- "To whom it may concern"

### Prefer
- Short sentences with strong action verbs: Built, Led, Reduced, Increased, Delivered
- Quantified impact where available: "Reduced processing time by 40%" beats "improved efficiency"
- Specific tools and technologies: "Python (pandas, NumPy)" beats "data tools"
- Role-relevant vocabulary drawn directly from the JD

### ATS Compatibility
- Single-column layout — no sidebars or parallel columns
- Standard section headers — no creative names that ATS cannot parse
- No tables, text boxes, or graphics containing key information
- Plain UTF-8 text, fully selectable
- Keywords from JD distributed naturally across Summary, Experience bullets, and Skills section
