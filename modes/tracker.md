# Mode: tracker — Application Status Overview

Read and display `data/applications.md` in a clean, scannable format. Allow status updates. Never add new rows directly.

---

## Step 1 — Load

Read `data/applications.md`. If it does not exist:
> "No applications tracked yet. Evaluate a listing with /naija-jobs eval or paste a job URL to get started."

---

## Step 2 — Display

Show a summary table grouped by status:

```
Applications Tracker — {YYYY-MM-DD}
════════════════════════════════════

Total tracked: {N}

By status:
  Evaluated    {N}   (pending decision)
  Applied      {N}   (waiting for response)
  Responded    {N}   (company contacted you or you heard back)
  Interview    {N}   (active interview process)
  Offer        {N}   (offer received — congratulations)
  Rejected     {N}
  Discarded    {N}
  SKIP         {N}   (decided not to apply)

Average score: {X.X}/5
CV PDF generated: {N} of {total} ({%})

───────────────────────────────────────────────────────────────────────────────
# | Date Found | Company        | Role                 | Score | Deadline | Status
───────────────────────────────────────────────────────────────────────────────
{rows from applications.md, sorted by date descending}
```

**Highlight listings that need attention:**
- Deadline within 7 days and status is still `Evaluated` → flag with ⚡
- Status is `Applied` and 14+ days have passed with no update → flag with ⏳ (may need follow-up)

---

## Step 3 — Status Updates

If the user asks to update a status (e.g., "mark #4 as Applied", "I got an interview at GTBank", "reject number 7"):

1. Find the matching row in `data/applications.md` — by row number, company name, or role name
2. Confirm what you are about to change:
   > "Updating #4 (Access Bank — Graduate Trainee) from Evaluated → Applied. Confirm?"
3. After confirmation, edit the row directly in `applications.md` (status updates to existing rows are permitted)
4. Update the Notes column if the user provides context (e.g., interview date, contact name)

**Canonical statuses (copy exactly, no variation):**
Evaluated | Applied | Responded | Interview | Offer | Rejected | Discarded | SKIP

---

## Step 4 — Adding New Rows

If the user asks to add a new listing directly to the tracker without evaluating it:
> "New listings should be evaluated first for the best results. Do you want me to evaluate it now? Paste the URL or job description and I'll run a full evaluation.
>
> If you just want to log it without evaluation, I can add a placeholder — but it will have no score or report."

If they confirm a placeholder:
- Write a TSV file to `batch/tracker-additions/{next-num}-{company-slug}.tsv`
- Run `node merge-tracker.mjs` to merge it
- Never edit `data/applications.md` directly to add rows

---

## Quick Filters (if user asks)

If the user asks to filter the view (e.g., "show me only Applied", "which ones are closing this week", "best scores only"):
- Filter the displayed rows accordingly
- Retain the summary statistics for the full tracker above the filtered view
