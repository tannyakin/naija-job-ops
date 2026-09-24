# Mode: cv (CV Management)

Sub-modes, triggered by the command suffix:
- `/naija-jobs cv build`: Build a CV from scratch through a guided interview (no CV needed)
- `/naija-jobs cv edit`: ATS audit and improvement of the master CV
- `/naija-jobs cv tailor`: Tailor CV to a specific job listing (does not overwrite master)
- `/naija-jobs cv` with no suffix → if `cv.md` is missing, run **build**; otherwise ask which one.

---

## cv build: Build a CV From Scratch

For users with no CV, an old CV, or "I don't have experience". Most Nigerian graduates have more experience than they think: SIWES, NYSC, family business, church/mosque roles, tutoring, side hustles all count when written properly.

### Step 1: Start from what exists

Read `profile-skills.md` and `config/profile.yml`. If the user pastes an old CV (text, or a PDF/DOCX path), read it. Don't re-ask anything already there.

### Step 2: Guided interview (a few questions at a time)

Ask in rounds of **at most 3 questions**. Keep it conversational. Skip rounds that don't apply.

**Round 1: Target**
1. What roles are you going for? (If several, which one first?)
2. Nigeria, remote, or both?

**Round 2: Education**
1. Degree/diploma, course, institution, class/grade, year (e.g. BSc Economics, UNILAG, 2:1, 2024)
2. Final-year project topic (and any result, e.g. "graded A", "used by the department")
3. Any leadership in school? (course rep, departmental/faculty executive, club president, hall exco)

**Round 3: Experience Finder** (ask these even if they say "I have no experience")
1. **SIWES / IT / internship:** where, how long, what did you actually do every week?
2. **NYSC:** PPA (where you were posted), what you did there; CDS group and any project you led
3. **Anything else you did for 3+ months**, paid or not:
   - Family business or shop (sales, stock, bookkeeping, POS, customers)
   - Teaching/tutoring (lesson teacher, JAMB/WAEC coaching, Sunday school)
   - Church/mosque/association roles (media unit, finance, choir coordinator, welfare)
   - Freelance/side hustle (graphics, social media for a small brand, reselling, event planning, photography, writing)
   - Volunteering (NGOs, campaigns, election observation, health outreaches)
   - Online courses + projects (ALX, Google, Coursera, HNG, personal portfolio)

For every item, dig for **numbers** with follow-ups: how many people/customers/students? how much money/stock? how often? what improved?

**Round 4: Skills, certificates, links**
1. Tools you can actually use (Excel level, software, languages, equipment)
2. Certifications and courses (with year; "in progress" is fine)
3. LinkedIn, portfolio, GitHub (optional)

### Step 3: Turn answers into strong bullets

Formula: **Action verb + what you did + scale/number + result**.

| What they said | CV bullet |
|---|---|
| "I helped my mum in her provision shop" | Managed daily sales and stock for a family retail shop serving ~60 customers/day; introduced a simple Excel stock sheet that cut stock-outs |
| "I taught at my PPA" | Taught Mathematics to 4 SS2 classes (160 students) during NYSC; class pass rate in the second-term exam rose from 48% to 63% |
| "I was in the media unit in church" | Coordinated a 6-person media team streaming weekly services to 1,200+ online viewers; trained 3 new volunteers on OBS |
| "I did SIWES at a bank" | Processed 40+ customer account-opening forms weekly and reconciled teller records during a 6-month industrial training at {Bank} |

Never invent numbers. If the user doesn't know, write it without one or ask for an honest estimate ("about", "~").

### Step 4: Order sections for their career stage

| Stage | Section order |
|---|---|
| Student / SIWES | Summary · Education · Projects · Experience (SIWES, part-time) · Leadership & Activities · Skills · Certifications |
| Fresh graduate / NYSC | Summary · Education (incl. class) · Experience (NYSC PPA, SIWES, part-time) · Projects · Leadership & Volunteering · Skills · Certifications |
| 1–3 years | Summary · Experience · Skills · Education · Certifications · Projects |
| 3+ years | Summary · Experience · Key Achievements (optional) · Skills · Certifications · Education |
| Career changer | Summary · Relevant Projects/Training · Transferable Experience · Skills · Education |
| Remote / international | Summary (results-first, tools) · Experience · Projects/Portfolio · Skills · Education (short) |

Within Experience, **order bullets by relevance to the target role**, not by date. Put the strongest, most relevant bullet first in every role.

### Step 5: Nigerian CV conventions

- **Do include:** phone (+234 format), email, city/state, LinkedIn; class of degree if 2:2 or better; NYSC status line (e.g. "NYSC: Completed 2025, Osun State" or "Currently serving, passing out Oct 2026").
- **Leave out by default:** photo, date of birth, marital status, state of origin, religion, NIN/BVN, full home address. Add date of birth / state of origin only when an advert explicitly asks (common in public-sector applications).
- **Referees:** "Available on request" (keep 2–3 referees ready; the user should confirm their details in `profile-skills.md`).
- Length: 1 page (student/graduate) or 2 pages max.

### Step 6: Save and show

1. Show the full draft in markdown. Ask for corrections.
2. On approval, save to `cv.md` (if `cv.md` already exists, save as `cv-draft-{YYYY-MM-DD}.md` and ask before replacing).
3. Offer: "Generate a PDF now? (`/naija-jobs pdf`)" and "Run an ATS audit? (`/naija-jobs cv edit`)".
4. Offer to update `profile-skills.md` with any new skills/experience learned in the interview.

---

## cv edit: ATS Audit and Improvement

### Step 1: Load

Read `cv.md`. If it does not exist:
> "You don't have a CV on file yet. Run /naija-jobs onboard to create one, or paste your CV here and I'll convert it."

Read `profile-skills.md` and `config/profile.yml` for context on target roles, NYSC status, and qualification level.

### Step 2: ATS Audit

Run a full audit against the following criteria:

**Layout and structure:**
- Single column (no sidebars, no parallel text columns)
- No tables, text boxes, or merged cells used for layout
- No images or graphics containing key information
- Standard section headings that ATS parsers recognise

**Content quality:**
- Contact information present: name, email and phone, with LinkedIn recommended and a portfolio optional
- Professional Summary present: does it lead with the strongest credential?
- Work Experience: does each role have at least 2 quantified bullets?
- Education: degree type, institution, class/grade, year of graduation all present?
- NYSC: is it documented (if completed or currently serving)?
- Skills section: specific tools and technologies listed, not just generic "Microsoft Office"
- Certifications: any professional certs (ICAN, NSE, Google, AWS, etc.) documented?
- Employment gaps > 6 months explained or accounted for?

**Writing quality:**
- Action verbs: do bullets start with strong verbs (Led, Built, Increased, Managed)?
- Passive voice: are there any "was responsible for" or "assisted in" constructions?
- Quantified impact: are at least 50% of achievement bullets quantified?
- Cliché language: any "hardworking team player", "results-oriented", "passionate about"?

**Nigerian-specific checks:**
- If NYSC completed: does the CV include the NYSC entry?
- If professional certification held (ICAN, NSE, COREN): is it visible?
- Class of degree: if 2:1 or 1st class, is it prominently stated?
- State of residence vs state of origin: is preferred work location clear?

### Step 3: Report Findings

Present findings clearly:

```
CV Audit: {candidate name}
───────────────────────────

Critical (fix before applying):
  ❌ Multi-column layout detected: will fail most ATS parsers
  ❌ No quantified bullet in 4 of 6 experience entries

Recommended improvements:
  ⚠ Professional Summary doesn't lead with your degree: recruiters see this first
  ⚠ NYSC entry missing: required info for Nigerian employer screening
  ⚠ "Responsible for managing" (3 occurrences): rewrite as action verbs

Good:
  ✅ Single-column layout (within each column; the ATS note above still applies)
  ✅ Contact info complete
  ✅ Education section has class of degree

Overall: 2 critical issues, 3 recommended improvements.
Want me to fix all of these now?
```

### Step 4: Apply Fixes

For each issue, propose the specific fix before applying it:

- Layout: propose an alternative structure (since we are working in markdown, show the correct markdown)
- Weak bullets: show the original and the proposed rewrite side by side
- Missing sections: draft the missing content based on what you know from profile-skills.md

Get approval for significant changes. Minor grammar and phrasing fixes can be batched.

Apply all approved changes to `cv.md`. Confirm when done.

### Step 5: Confirm

After all changes are applied:
> "Your CV has been updated. It is now more ATS-compatible and ready for applications.
> Run /naija-jobs pdf to generate a tailored PDF for a specific role, or /naija-jobs eval to evaluate a listing."

---

## cv tailor: Tailor CV to a Specific Listing

This sub-mode tailors the CV to a specific role. It never overwrites `cv.md`.

### Step 1: Inputs

Read `cv.md` (required; if missing, offer to create it first).
Ask for the target JD if not already in context: "Which role is this for? Paste the URL or job description."

### Step 2: Analyse JD

Extract from the JD:
- Key required skills and tools
- Preferred qualifications beyond the minimum
- Keywords that should appear in an ATS-optimised document
- What the employer is emphasising most (the first listed requirements carry the most weight)

### Step 3: Tailor

- Rewrite the Professional Summary to reflect the specific role's priorities
- Reorder bullets in each experience entry: most JD-relevant bullets first
- Update the Core Competencies section with JD-matched keywords
- Promote relevant certifications or courses to a more visible position if the JD emphasises them
- Adjust skills section emphasis to match what the JD prioritises
- **Suggest experience to bring forward:** scan the whole CV and `profile-skills.md` for experience the user under-sells for this role (a NYSC project, a volunteer role, a course project) and propose promoting it, with the reworded bullet. Ask before adding anything that isn't in the CV yet.
- **Reorder sections** for this application using the career-stage table in `cv build` (e.g. move Projects above Experience for a career-change role)

**Legitimacy rule: NEVER add skills or experiences the user does not have.** Reformulate real experience in JD vocabulary. Do not fabricate.

### Step 4: Save

Save the tailored version as:
`output/cv-{candidate-slug}-{company-slug}-tailored-{YYYY-MM-DD}.md`

Do not overwrite `cv.md`.

Offer to generate as PDF: "Want me to generate this as a PDF? Run /naija-jobs pdf or confirm here and I'll proceed."
