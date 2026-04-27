# Mode: pdf — CV and Cover Letter PDF Generation

Generate a role-tailored CV and cover letter for a specific job listing. Always tailored to the target JD — never a generic document.

---

## Step 0 — Gather Inputs

**Source of truth:**
- If `cv.md` exists: read it. This is the primary source.
- If `cv.md` does not exist: read `profile-skills.md`. Build a CV-quality document from it, but be honest with the user: "Your profile-skills.md will be used since no full CV exists. The result will be functional but adding a full CV via /naija-jobs cv edit will improve future PDFs."

**Target JD:**
- If a JD URL or text is already in context (user pasted it or was referred from eval): use it
- If not: ask "Which job listing is this CV for? Paste the URL or description."

Extract from the JD:
- Company name and role title
- Key required skills and tools
- Qualification and NYSC requirements
- Location and work mode
- 15–20 ATS keywords

---

## Step 1 — Tailor the CV Content

**Rules:**
- NEVER invent skills, experience, or qualifications the user does not have
- Reformulate real experience using the exact vocabulary of the JD
- Reorder bullets to put the most JD-relevant points first
- Highlight experiences that match the detected Nigerian archetype
- Inject JD keywords naturally — not as a keyword dump

**What to produce:**

1. **Professional Summary** — 3–4 lines. Lead with the user's strongest relevant credential (degree, years of experience, or a key achievement). Second sentence maps their main skills to the JD. Third sentence signals enthusiasm without using the word "passionate".

2. **Core Competencies grid** — 6–8 keyword phrases drawn directly from JD requirements mapped to real user skills. E.g., if JD says "financial modelling" and user has Excel + accounting coursework, include "Financial Modelling (Excel)".

3. **Work Experience** — reordered bullets for each role, most JD-relevant first. If the user has limited work history (common for recent graduates), expand internships, NYSC CDS projects, and academic projects.

4. **Education** — format Nigerian qualification levels clearly: Degree type, Institution, Class (if 2:1 or 1st, always include), Year of graduation.

5. **NYSC** — if completed, include as a line in Education or as a standalone entry: "National Youth Service Corps, {State} | {Year}" with any CDS or achievement worth noting.

6. **Skills section** — organised by category: Technical skills, Software tools, Languages (if any).

7. **Certifications** — include any professional certifications (ICAN, NSE, Google certs, Coursera, etc.).

**Tailoring examples (legitimate reformulation, not fabrication):**
- JD says "SQL database management" + user has "MySQL queries for academic project" → CV says "SQL database management (MySQL)"
- JD says "client relationship management" + user has "customer service role at NYSC PPA" → CV says "Client relationship management — 12-month experience at [organisation]"
- JD says "data analysis" + user has "Excel dashboards" → CV says "Data analysis and reporting using Excel"

---

## Step 2 — Generate the Cover Letter

Always generate a cover letter. Even if the listing does not explicitly ask for one, include it as a separate page in the PDF.

**Format:**
- Addressed to the company by name (not "To Whom It May Concern")
- 3 paragraphs, maximum 1 page
- Paragraph 1: Why this company and this role specifically. Reference something concrete about the company (a known programme, product, or reputation — verified, not invented).
- Paragraph 2: The 2–3 most relevant things from the user's background. One quantified achievement if available.
- Paragraph 3: Clear close — what the user is asking for, and that they look forward to the conversation.

**Tone:** Direct and confident. The user is a qualified candidate making a considered choice, not someone begging for a chance. Avoid:
- "I humbly apply for..."
- "I would be honoured to..."
- "I am writing to express my interest in..."

**Better openers:**
- "GTBank's Graduate Management Programme has trained some of Nigeria's strongest banking professionals — and I am writing to apply for the 2026 intake."
- "I am applying for the Software Engineering position at Flutterwave because your engineering culture and the problems you are solving in African fintech align directly with the work I have been building toward."

---

## Step 3 — Format Detection

Detect the correct paper format:
- Nigeria-based employer → A4
- Global company with US headquarters → Letter (8.5×11in)
- Default: A4

---

## Step 4 — Generate PDF

1. Read `templates/cv-template.html`
2. Replace all `{{PLACEHOLDER}}` tokens with tailored content
3. Read `name` from `config/profile.yml` → normalise to kebab-case: e.g., "Emeka Okafor" → "emeka-okafor"
4. Write the filled HTML to `/tmp/cv-{candidate}-{company}.html`
5. Run: `node generate-pdf.mjs /tmp/cv-{candidate}-{company}.html output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf --format={a4|letter}`
6. Report: output path, number of pages, percentage of JD keywords covered

**Never overwrite `cv.md`.** The tailored version is always a separate output file in `output/`.

---

## Step 5 — Update Tracker

If this listing is already in `data/applications.md`, update its PDF column from ❌ to ✅.

If it is not yet registered, generate the TSV tracker addition as per the standard format and write to `batch/tracker-additions/`.

---

## ATS Rules Checklist

Before writing the HTML:
- [ ] Single column — no sidebars, no parallel columns
- [ ] Standard section headers (Professional Summary, Work Experience, Education, Skills)
- [ ] No tables in the main content (competency grid uses flex/inline-block, not HTML table)
- [ ] No images, logos, or SVGs containing text
- [ ] All text is selectable UTF-8
- [ ] Keywords distributed: Summary (top 5), first bullet per role, Skills section
- [ ] No headers or footers containing critical information (ATS ignores them)

---

## Output Confirmation

After PDF is generated, confirm to the user:

```
CV generated: output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf
Cover letter: included (page 2)
Format: A4
Keywords matched: {N}/{total} from JD

Review the PDF before submitting. When you are ready to apply, run /naija-jobs apply
to fill out the application form, or apply directly at: {URL}
```
