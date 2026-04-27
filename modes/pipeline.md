# Mode: pipeline — URL Inbox Processor

Process all pending job listing URLs in `data/pipeline.md`. Run a full evaluation on each, save reports, and update the tracker.

---

## Step 1 — Load Pipeline

Read `data/pipeline.md`. Look for all items marked `- [ ]` in the Pending section.

If there are no pending items:
> "Your pipeline is empty. Add URLs to data/pipeline.md under Pending, or run /naija-jobs scan to discover new listings."

---

## Step 2 — Determine Processing Mode

- **1–2 URLs**: process sequentially in the current context
- **3–5 URLs**: process sequentially using `modes/eval.md` for each, within the current context
- **6+ URLs**: hand off to batch mode — launch `modes/batch.md`

---

## Step 3 — Process Each URL

For each pending item, in order:

**a. Calculate report number:**
- List all files in `reports/`
- Extract the numeric prefix from each filename (e.g., `007-gt-bank-2026-04-11.md` → 7)
- New number = maximum found + 1, zero-padded to 3 digits

**b. Extract the JD:**
1. Playwright (`browser_navigate` + `browser_snapshot`) — preferred
2. WebFetch — fallback for static pages
3. WebSearch — last resort
4. `local:` prefix — if URL starts with `local:`, read the referenced local file (e.g., `local:jds/moniepoint-swe.md` → read `jds/moniepoint-swe.md`)
5. If nothing works → mark `- [!] {url} — Error: could not extract JD` and continue

**Special cases:**
- LinkedIn: often requires login → mark `[!]` with note "LinkedIn: paste JD text manually"
- PDF URL: read with Read tool directly
- Private or behind-login URL: mark `[!]` and note what is needed

**c. Run full evaluation:**
Execute `modes/eval.md` on the extracted JD content. Produce the complete 6-block evaluation.

**d. Save report:**
Save to `reports/{###}-{company-slug}-{YYYY-MM-DD}.md`.

**e. Generate PDF (if score ≥ 3.5):**
Run the PDF generation pipeline from `modes/pdf.md`.

**f. Update pipeline.md:**
Move the item from Pending to Processed:
```
- [x] #{num} | {url} | {company} | {role} | {score}/5 | PDF {✅/❌}
```

**g. Register in tracker:**
Write TSV to `batch/tracker-additions/{num}-{company-slug}.tsv`.

---

## Step 4 — Summary

After all URLs are processed:

```bash
node merge-tracker.mjs
```

Then display:

```
Pipeline Complete — {YYYY-MM-DD}
══════════════════════════════════
Processed:  {N}
Successful: {N}
Errors:     {N}
Skipped:    {N}

Results:
  #{num} — {company} | {role} | {score}/5 | {Recommend / Flag / Skip}
  #{num} — {company} | {role} | {score}/5 | {Recommend / Flag / Skip}
  ...

Errors (manual action needed):
  {url} — {reason}
  ...

→ Run /naija-jobs tracker to see your updated applications.
```

---

## pipeline.md Format

```markdown
## Pending
- [ ] https://jobberman.com/jobs/12345
- [ ] https://myjobmag.com/jobs/67890 | GTBank | Graduate Trainee 2026
- [ ] local:jds/moniepoint-android-dev.md | Moniepoint | Android Developer
- [!] https://linkedin.com/jobs/view/98765 — Error: LinkedIn login required

## Processed
- [x] #007 | https://jobberman.com/jobs/11111 | Zenith Bank | Analyst | 4.2/5 | PDF ✅
- [x] #008 | https://myjobmag.com/jobs/22222 | Flutterwave | SWE | 3.8/5 | PDF ✅
```

---

## Sync Check

Before processing any URL, verify that the user's profile files are current:
- Does `profile-skills.md` exist? If not, warn: "Pipeline evaluation requires profile-skills.md. Run /naija-jobs onboard first."
- Does `config/profile.yml` exist? Same warning if missing.
