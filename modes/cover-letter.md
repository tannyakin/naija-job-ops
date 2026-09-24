# Mode: cover-letter — Cover Letters That Get Read

Write a tailored cover letter (or application email) for one specific listing, in the format that listing actually needs. Output as PDF, as plain text to paste into a form, or as an email body — whichever the application uses.

Triggered by `/naija-jobs cover-letter`, by `pdf` mode (which calls this for page 2), or when the user asks for a cover letter, motivation letter, "why do you want this job" essay, or application email.

---

## Step 1 — Gather inputs

1. **The listing** — from context, a URL (open it), an existing report in `reports/`, or ask: "Which job is this for? Paste the link or the advert."
2. **The user** — `cv.md` (or `profile-skills.md`), `config/profile.yml`, `modes/_profile.md` (narrative, proof points), and the evaluation report if one exists (it has matched strengths, gaps, and ATS keywords).
3. **How it will be sent** — detect from the listing, or ask if unclear:
   - Upload as a document → **PDF**
   - Text box on a portal (often with a character limit) → **plain text**, respect the limit
   - "Send your CV to hr@company.com" → **email body** + subject line (the CV is the attachment)
   - Graduate trainee or government portal "motivation statement" → **plain text**, word count as specified

**Ask (max 3 questions) if you are missing something that would make the letter specific:**
- "What's one thing you've done that you're proud of and that relates to this role — with a number if possible?"
- "Why this company specifically — anything you've used, heard, or admire about them?"
- "Do you know the hiring manager's name?" (only if the listing hints at one)

---

## Step 2 — Pick the right structure

**Standard (private sector, 250–350 words, 3–4 paragraphs):**
1. **Hook** — the role, and one concrete reason this company. Mention something real and verified (a product, programme, expansion, value) — never invent.
2. **Proof** — 2–3 most relevant experiences mapped to the top JD requirements. At least one number.
3. **Fit & gap** — address the most obvious gap honestly and briefly (e.g. "My experience is from NYSC and SIWES rather than a full-time role, but…"), or show culture/sector fit.
4. **Close** — clear ask, availability (e.g. NYSC passing-out date, notice period), thanks.

**Graduate trainee / management trainee:** emphasise learning speed, leadership in school/NYSC/CDS, class of degree if strong, willingness to relocate if the scheme deploys nationally.

**Career changer:** lead with transferable results, explain the move in one sentence, show proof of the new skill (course + project).

**Remote / international:** shorter (150–250 words), results-first, mention time-zone overlap and reliable setup (power backup, internet), no Nigerian-specific formalities.

**Government / formal Nigerian letter:** full address block, "The Head, Human Resources," salutation "Dear Sir/Madam," (acceptable here only), subject line "APPLICATION FOR THE POSITION OF …", formal close "Yours faithfully,". Keep it to one page.

**Email application (send CV to an address):**
```
Subject: Application — {Role} — {Full Name}

Dear {Name / Hiring Team},

{3 short paragraphs, 120–180 words}

My CV is attached. I'm available for a conversation at your convenience.

Kind regards,
{Name}
{Phone} · {LinkedIn}
```

---

## Step 3 — Write it

Follow the Professional Writing Rules in `_shared.md`. Also:

- **Mirror the JD's language** for the top 5–8 requirements (ATS and human skim both).
- **Specific beats impressive.** "Built an attendance dashboard used by 300 students" beats "strong analytical skills".
- **No begging, no clichés:** avoid "I humbly apply", "I would be honoured", "I am writing to express my interest", "hardworking and passionate", "God-fearing", "I am a fast learner" (show it instead).
- **Never invent** experience, numbers, names, or company facts. If a number is unknown, ask or leave it out.
- **Nigerian English is fine; errors are not.** Use British spelling (organisation, programme) unless the employer is clearly US-based.
- **Salutation:** a real name if known ("Dear Mrs Adeyemi"), else "Dear Hiring Team" / "Dear {Company} Recruitment Team". Never "To Whom It May Concern" (the formal government letter above is the one place "Dear Sir/Madam" is acceptable).
- Fit on one page (PDF) or within the stated character/word limit (text box).

Show the draft to the user. Offer 1–2 targeted alternatives for the opening line.

---

## Step 4 — Output

**PDF:**
1. Read `templates/cover-letter-template.html`
2. Fill placeholders from `config/profile.yml` and the draft (`{{RECIPIENT_BLOCK}}` lines joined with `<br>`, `{{BODY}}` as `<p>` paragraphs, `{{PAGE_WIDTH}}` = `210mm` for A4)
3. Write to `output/cl-{candidate-slug}-{company-slug}.html`
4. `node generate-pdf.mjs output/cl-{candidate-slug}-{company-slug}.html output/cl-{candidate-slug}-{company-slug}-{YYYY-MM-DD}.pdf --format=a4`

**Text / email:** print it in a code block so it's easy to copy, with the word/character count.

Always save the final text to `output/cl-{candidate-slug}-{company-slug}-{YYYY-MM-DD}.md` so it can be reused for similar roles.

---

## Step 5 — Checklist before handing over

- [ ] Company and role names spelled exactly as in the advert
- [ ] Every claim traceable to `cv.md` / `profile-skills.md` / the user's answers
- [ ] At least one number
- [ ] Biggest gap addressed or deliberately left out
- [ ] Within the length/format required
- [ ] No fee, no personal data beyond what the advert asks (no BVN, no NIN)

Remind the user: **review before sending — you make the final call.** Offer `/naija-jobs apply` for the rest of the form.
