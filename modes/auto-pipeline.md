# Mode: auto-pipeline — Full Automatic Pipeline

When the user pastes a job listing (text or URL) without an explicit sub-command, run the complete pipeline in sequence automatically.

---

## Step 0 — Extract the Listing

If the input is a **URL**:
1. Playwright: `browser_navigate` → `browser_snapshot` — works with SPAs and dynamically loaded pages
2. WebFetch: fallback for static pages
3. WebSearch: last resort — search for the role title and company on Nigerian job boards that may have indexed it
4. If nothing works: ask the user to paste the listing text directly or share a screenshot

If the input is **pasted text** (JD already in context): use directly, skip extraction.

**Verify the listing is active (mandatory for URLs):**
- Active: job title + description + Apply/Submit button visible in the main content
- Closed: only navbar/footer visible, or page says "no longer available", "position filled", "this job has expired"
- If closed: tell the user immediately. Do not evaluate a closed listing.

---

## Step 1 — Full Evaluation

Execute `modes/eval.md` in full — all 6 blocks plus the legitimacy assessment. Read `modes/_shared.md` for scoring context.

---

## Step 2 — Save Report

Save the complete evaluation to `reports/{###}-{company-slug}-{YYYY-MM-DD}.md`.

- `{###}` = next sequential number: list `reports/`, take the highest prefix number, add 1, zero-pad to 3 digits
- `{company-slug}` = company name in lowercase with hyphens
- Include the legitimacy tier in the report header: `**Legitimacy:** {tier}`
- Include `**URL:**` in the report header

---

## Step 3 — Generate PDF (if score ≥ 3.5)

Execute the PDF pipeline from `modes/pdf.md`. Generate a tailored CV and cover letter for this specific listing.

If score is below 3.5: skip PDF generation. Note in the tracker: `PDF ❌ (score below threshold)`.

---

## Step 4 — Draft Application Answers (if score ≥ 4.5)

If the final score is 4.5 or higher, draft application form answers as a section `## Draft Application Answers` in the report.

**Generic questions to answer if the form cannot be accessed:**
- Why are you interested in this role?
- Why do you want to work at {company}?
- Tell us about a relevant achievement
- What makes you a good fit?
- What is your NYSC status?
- What is your highest qualification?
- What are your salary expectations?

**Tone:** Direct and confident. The user is a qualified candidate making a considered choice.

- **Why this role?** → Map something specific in the JD to something specific in the user's background
- **Why this company?** → Name something concrete and real about the company (known programme, product, reputation)
- **Relevant achievement?** → One quantified result from profile-skills.md or cv.md. Specific, not generic.
- **Good fit?** → Name the top 2 skills or experiences that directly match the JD requirements
- **NYSC?** → State exactly from config/profile.yml
- **Qualification?** → State exactly from config/profile.yml
- **Salary?** → Use target from config/profile.yml or "I am happy to discuss based on the full package"

Do not use: "I am passionate about", "I would be honoured", "I humbly apply", or any other filler phrases.

---

## Step 5 — Register in Tracker

Write a TSV tracker addition to `batch/tracker-additions/{num}-{company-slug}.tsv`.

- Status: `Evaluated`
- PDF: `✅` if generated, `❌` if not
- Report: link to the saved report file

**NEVER edit `data/applications.md` directly to add new rows.** Always use the TSV → `node merge-tracker.mjs` pattern.

---

## If any step fails

Continue with the remaining steps. Mark the failed step as pending in the tracker notes. Do not abort the whole pipeline because one step failed.
