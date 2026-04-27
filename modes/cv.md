# Mode: cv — CV Management

Two sub-modes, triggered by the command suffix:
- `/naija-jobs cv edit` — ATS audit and improvement of the master CV
- `/naija-jobs cv tailor` — Tailor CV to a specific job listing (does not overwrite master)

---

## cv edit — ATS Audit and Improvement

### Step 1 — Load

Read `cv.md`. If it does not exist:
> "You don't have a CV on file yet. Run /naija-jobs onboard to create one, or paste your CV here and I'll convert it."

Read `profile-skills.md` and `config/profile.yml` for context on target roles, NYSC status, and qualification level.

### Step 2 — ATS Audit

Run a full audit against the following criteria:

**Layout and structure:**
- Single column (no sidebars, no parallel text columns)
- No tables, text boxes, or merged cells used for layout
- No images or graphics containing key information
- Standard section headings that ATS parsers recognise

**Content quality:**
- Contact information present: name, email, phone — LinkedIn recommended, portfolio optional
- Professional Summary present — does it lead with the strongest credential?
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

### Step 3 — Report Findings

Present findings clearly:

```
CV Audit — {candidate name}
───────────────────────────

Critical (fix before applying):
  ❌ Multi-column layout detected — will fail most ATS parsers
  ❌ No quantified bullet in 4 of 6 experience entries

Recommended improvements:
  ⚠ Professional Summary doesn't lead with your degree — recruiters see this first
  ⚠ NYSC entry missing — required info for Nigerian employer screening
  ⚠ "Responsible for managing" (3 occurrences) — rewrite as action verbs

Good:
  ✅ Single-column layout (within each column — ATS note above still applies)
  ✅ Contact info complete
  ✅ Education section has class of degree

Overall: 2 critical issues, 3 recommended improvements.
Want me to fix all of these now?
```

### Step 4 — Apply Fixes

For each issue, propose the specific fix before applying it:

- Layout: propose an alternative structure (since we are working in markdown, show the correct markdown)
- Weak bullets: show the original and the proposed rewrite side by side
- Missing sections: draft the missing content based on what you know from profile-skills.md

Get approval for significant changes. Minor grammar and phrasing fixes can be batched.

Apply all approved changes to `cv.md`. Confirm when done.

### Step 5 — Confirm

After all changes are applied:
> "Your CV has been updated. It is now more ATS-compatible and ready for applications.
> Run /naija-jobs pdf to generate a tailored PDF for a specific role, or /naija-jobs eval to evaluate a listing."

---

## cv tailor — Tailor CV to a Specific Listing

This sub-mode tailors the CV to a specific role. It never overwrites `cv.md`.

### Step 1 — Inputs

Read `cv.md` (required — if missing, offer to create first).
Ask for the target JD if not already in context: "Which role is this for? Paste the URL or job description."

### Step 2 — Analyse JD

Extract from the JD:
- Key required skills and tools
- Preferred qualifications beyond the minimum
- Keywords that should appear in an ATS-optimised document
- What the employer is emphasising most (the first listed requirements carry the most weight)

### Step 3 — Tailor

- Rewrite the Professional Summary to reflect the specific role's priorities
- Reorder bullets in each experience entry: most JD-relevant bullets first
- Update the Core Competencies section with JD-matched keywords
- Promote relevant certifications or courses to a more visible position if the JD emphasises them
- Adjust skills section emphasis to match what the JD prioritises

**Legitimacy rule: NEVER add skills or experiences the user does not have.** Reformulate real experience in JD vocabulary — do not fabricate.

### Step 4 — Save

Save the tailored version as:
`output/cv-{candidate-slug}-{company-slug}-tailored-{YYYY-MM-DD}.md`

Do not overwrite `cv.md`.

Offer to generate as PDF: "Want me to generate this as a PDF? Run /naija-jobs pdf or confirm here and I'll proceed."
