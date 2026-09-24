# Mode: onboard — Setup and Profile Onboarding

This mode runs in two situations:
1. **Automatic** — at session start when required files are missing
2. **Explicit** — when the user types `/naija-jobs onboard` to update their profile

In both cases, run the full flow. For updates, load existing files first and show the user what is already set — then ask what they want to change.

---

## Pre-flight Check (run silently at session start)

Check for each of these files:
- `profile-skills.md`
- `config/profile.yml`
- `portals.yml`
- `data/applications.md`

Also check:
- `profile-skills.md` — if missing, will be created during onboarding
- `modes/_profile.md` — if missing, copy from `modes/_profile.template.md` silently before proceeding

If all files exist, onboarding is complete. Do not enter onboarding mode. Proceed with the user's request.

If any file is missing, enter onboarding mode immediately before doing anything else.

---

## Step 1 — Profile and Skills (required)

Tell the user:

> "Welcome to naija-job-ops. Before I can help you find and evaluate job listings, I need to know a bit about you. This only takes a minute."

Ask in short rounds (**max 3 questions per message**) so it feels like a chat, not a form. Use `AskUserQuestion` for multiple-choice items when available.

**Round 1 — What you want**
1. What role(s) or field are you targeting? Any field works (e.g. "Android Developer — Kotlin", "Graduate Trainee Banking", "Nursing", "Civil Engineering", "HR")
2. Nigeria, remote (incl. international roles paid in USD), or both? Which cities if Nigeria?
3. Level: internship/SIWES, entry/graduate, 1–3 years, 3+ years?

**Round 2 — Your background**
1. What are your core skills and tools? (e.g. "Python, SQL, Excel", "AutoCAD, STAAD.Pro", "QuickBooks")
2. Highest qualification and class/grade? (OND / HND / BSc / MSc…, e.g. "BSc Accounting, 2:1")
3. NYSC: yet to serve, currently serving (passing-out month?), completed, or exempted?

**Round 3 — Eligibility details** (explain: "Nigerian adverts often have strict cut-offs — I'll use these only to check eligibility")
1. Date of birth (for age limits like "not older than 26") — optional, but many graduate schemes screen on it
2. O'Level: credits in English and Maths, one or two sittings?
3. Years of work experience (and whether that includes NYSC/SIWES)

**Round 4 — Preferences** (optional)
1. Monthly salary expectation in Naira (and a USD figure for remote roles, if relevant)
2. Deal-breakers (e.g. no sales roles, no relocation, nothing below ₦150K)
3. Public-sector jobs too? (If yes, ask state of origin/LGA later only when an application needs it)

Wait for the user to answer. If they give partial answers, work with what you have and make reasonable defaults explicit so they can correct them.

**After receiving answers:**
Create `profile-skills.md` from their responses. Use this template as the structure:

```markdown
# Profile and Skills

## Target Roles
{list of target roles from user}

## Core Skills
{skills and tools listed by the user, grouped logically if they gave many}

## Education
Level: {OND/HND/BSc/MSc}
Field: {discipline if mentioned}
Institution: {if mentioned}
Class/Grade: {if mentioned, e.g. Second Class Upper}

## NYSC Status
{yet-to-serve / currently-serving / completed / exempted}
{If currently serving, note expected completion if known}

## Location Preferences
Preferred cities/states: {list}
Work mode preference: {remote / hybrid / onsite / any}

## Salary Expectation
{₦X,XXX/month or "not specified"}

## Experience Summary
{1–2 paragraph summary written by Claude based on what the user shared, or left as a placeholder if they shared nothing yet}
```

Create `config/profile.yml` from their answers. Copy `config/profile.example.yml` as the base if it exists, then fill in the user's details. At minimum populate:
- `candidate.full_name` (ask if not given)
- `candidate.email` (ask if not given)
- `candidate.location_state`, `candidate.date_of_birth` (if given)
- `education.level`, `education.discipline`, `education.class_of_degree`, `education.olevel`
- `nysc_status`
- `experience.years_total`, `experience.level`
- `target_roles.primary`
- `preferred_locations`, `work_mode_preference`, `remote.open_to_international`
- `compensation.salary_expectation_ngn_monthly` (if given)
- `search.keywords`, `search.skills`, `search.exclude` (deal-breakers) — the scanner uses these to rank jobs

Use exactly the field names in `config/profile.example.yml` — `scan.mjs` and the matcher read them.

---

## Step 2 — CV (optional but recommended)

After collecting profile info, ask:

> "Do you have a CV you'd like to add? It will make your evaluations more personalised and your generated documents more accurate. You can:
> 1. Upload a PDF or Word file — I'll extract and clean it
> 2. Paste your CV text directly — any format works
> 3. Share your LinkedIn profile URL — I'll pull your details using the browser
> 4. Skip for now — you can always add it later with `/naija-jobs cv edit`"

### If they upload or paste a file:
- Parse the content — handle any format: copied Word text, LinkedIn exports, informal summaries
- Clean up the structure: standardise section headings, fix formatting, remove tables and columns that would break ATS
- Present a cleaned preview to the user
- Ask: "Is this accurate? Anything to add or correct?"
- After approval, save to `cv.md`

### If they share a LinkedIn URL:
- Navigate with Playwright (`browser_navigate` + `browser_snapshot`)
- Extract: name, headline, current and past positions, education, skills, certifications, about section
- Assemble into clean `cv.md` markdown
- Present to user for review and approval before saving

### If they skip:
- Acknowledge and move on: "No problem. Your profile-skills.md will cover the essentials for now."
- Note internally that `cv.md` does not exist — this affects which source of truth is used in evaluations

---

## Step 3 — CV Quality Check (if CV was provided)

If the user provided a CV (Step 2), run a silent ATS audit:

**Check for:**
- Multi-column layout or sidebar (breaks ATS parsers)
- Tables or text boxes containing key information
- Images, logos, or graphic elements
- Non-standard section headings (e.g. "Who I am" instead of "Professional Summary")
- Absence of quantified impact in experience bullets
- Weak action verbs or passive voice ("was responsible for" vs "led")
- Missing contact information (email is minimum; LinkedIn recommended)
- Inconsistent date formats
- Unexplained employment gaps (flag but don't judge)

**Report findings:**
Present a clear audit result:

```
CV Audit Results
────────────────
✅ Single-column layout — ATS-friendly
⚠ Experience bullets lack quantified impact (3 of 5 positions)
⚠ Section heading "Career History" — recommend "Work Experience" for ATS
❌ Table detected in skills section — will break most ATS parsers

Recommendation: Fix the 1 critical issue and strengthen 3 positions with metrics.
Want me to fix these now?
```

If the user says yes, fix all issues and get approval before writing to `cv.md`. If a section needs a significant rewrite, show the before and after and get confirmation.

---

## Step 4 — Portals Config

If `portals.yml` is missing:
1. Copy `templates/portals.example.yml` to `portals.yml`
2. Update `title_filter.positive` based on the roles the user described in Step 1
3. Set `search.keywords` to 2–5 short search phrases for their target roles (e.g. "data analyst", "business intelligence analyst"), `search.location`, and `search.experience` (e.g. `[internship, entry]`)
4. If they want remote roles, keep `remote_boards.enabled: true`; otherwise set it to `false`
5. Tell the user:

> "I've set up the job scanner: LinkedIn (newest postings first, with applicant counts), Nigerian job boards (Jobberman, MyJobMag, HotNigerianJobs, NgCareers, Jobgurus, Indeed Nigeria), remote boards open to Nigeria, and pre-configured companies across banking, tech, FMCG, telecoms, oil and gas, and professional services. I've also updated the search keywords to match your target roles."

If `portals.yml` already exists, do not overwrite it.

---

## Step 5 — Tracker

If `data/applications.md` does not exist, create it:

```markdown
# Applications Tracker

| # | Date Found | Company | Role | Location | Score | Deadline | Applicants | Status | PDF | Report | Notes |
|---|------------|---------|------|----------|-------|----------|-----------|--------|-----|--------|-------|
```

If it exists, leave it untouched.

---

## Step 6 — Get to Know the User (important for quality)

After the basics are set up, ask proactively for more context. The more you know, the better your evaluations will be. Keep this conversational — not a form.

> "The basics are ready. The system works much better when it knows you well. Can you tell me a bit more?
>
> - What makes you stand out from other candidates in your field?
> - What kind of work excites you? What drains you?
> - Any deal-breakers? (e.g., no banking roles, no mandatory relocation, no roles below ₦150K)
> - Your most significant achievement so far — the one you'd mention in an interview
> - Are you on LinkedIn? Any projects, GitHub, or portfolio you'd like me to reference?
>
> The more you share, the better I can filter and personalise your applications. Think of it like briefing a recruiter — the first session I learn about you, then I become genuinely useful."

Store any insights the user shares:
- Skills or experience context → `profile-skills.md` (Experience Summary section)
- Location, salary, deal-breakers → `config/profile.yml`
- Portfolio links or proof points → `config/profile.yml` under `narrative.proof_points`

After every future evaluation, learn. If the user says "this score is too high, I'd never apply there" or "you didn't account for my X experience", update `profile-skills.md` and/or `config/profile.yml` accordingly. The system should get smarter each session.

---

## Step 7 — Ready

Confirm setup is complete:

> "You're all set. Here's what you can do now:
> - Paste a job URL or description to evaluate it
> - Type a role name to search immediately (e.g., 'android developer Lagos')
> - Run `/naija-jobs scan` to scan all Nigerian portals for listings that match your profile
> - Run `/naija-jobs` to see all commands
>
> Everything is customisable — just ask me to change any setting, add companies, or update your profile.
>
> Tip: The more complete your CV, the better your generated application documents. Run `/naija-jobs cv edit` any time to improve it — or `/naija-jobs cv build` if you don't have one yet.
>
> New here? `/naija-jobs tutorial` walks you through everything in about 10 minutes."

Then suggest automation:

> "Want me to scan for new listings automatically? I can set up a recurring scan so you don't miss new postings. Just say 'scan every 3 days' and I'll configure it."

If the user accepts, use the `/schedule` skill to set up a recurring `/naija-jobs scan`. If that skill is not available, explain how to run the scan manually and suggest setting a reminder.

---

## Update Mode (user runs /naija-jobs onboard again)

If all files already exist when this mode is triggered:

1. Load `profile-skills.md` and `config/profile.yml`
2. Show a summary of what is currently set:
   ```
   Current Profile
   ───────────────
   Target roles: Android Developer, Junior Backend Engineer
   Skills: Java, Kotlin, Python, SQL
   Education: BSc Computer Science
   NYSC: Completed
   Preferred locations: Lagos, Remote
   Salary target: ₦250,000/month
   CV: ✅ (cv.md exists)
   ```
3. Ask: "What would you like to update?"
4. Make only the changes the user specifies. Write to the appropriate file and confirm.
