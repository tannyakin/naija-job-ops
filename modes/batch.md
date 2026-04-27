# Mode: batch — Batch Processing of Multiple Listings

Process multiple job listings in parallel using `claude -p` worker processes. Each worker runs a clean, stateless eval on a single listing and produces a report, tracker addition, and optional PDF.

---

## Architecture

```
Claude Conductor (claude --chrome --dangerously-skip-permissions)
  │
  │  Chrome: navigates Nigerian job portals in real time
  │
  ├─ Listing 1: reads JD from DOM + URL
  │    └─► claude -p worker → report .md + tracker-addition TSV
  │
  ├─ Listing 2: next listing
  │    └─► claude -p worker → report .md + tracker-addition TSV
  │
  └─ End: node merge-tracker.mjs → applications.md + summary
```

Each worker runs with a clean 200K token context. The conductor only orchestrates — it does not evaluate.

---

## Files

```
batch/
  batch-input.tsv          # URLs to process (one per line)
  batch-state.tsv          # Progress tracking (auto-generated)
  batch-runner.sh          # Standalone orchestrator script
  batch-prompt.md          # System prompt for worker processes
  logs/                    # One log file per listing (gitignored)
  tracker-additions/       # TSV outputs from workers (gitignored)
```

---

## Mode A — Conductor with Chrome

Use this when you want to scan a portal interactively and batch-process everything visible.

1. **Read state**: `batch/batch-state.tsv` — skip any listing already marked `completed`
2. **Navigate portal**: Chrome → Nigerian job board or company careers page
3. **Extract listings**: Read DOM → extract list of listing URLs → append to `batch-input.tsv`
4. **For each URL in `batch-input.tsv` that is `pending`**:
   a. Chrome: navigate to the listing URL → read JD text from DOM
   b. Save JD to `/tmp/batch-jd-{id}.txt`
   c. Calculate next sequential `REPORT_NUM` (read `reports/`, take max + 1)
   d. Launch worker via Bash:
      ```bash
      claude -p --dangerously-skip-permissions \
        --append-system-prompt-file batch/batch-prompt.md \
        "Evaluate this listing. URL: {url}. JD file: /tmp/batch-jd-{id}.txt. Report number: {num}. Batch ID: {id}"
      ```
   e. Update `batch-state.tsv`: mark `completed` or `failed`, record score and report number
   f. Write log to `batch/logs/{report_num}-{id}.log`
   g. Chrome: navigate back → next listing
5. **Pagination**: if portal has multiple pages, click Next and repeat
6. **End**: run `node merge-tracker.mjs` → display summary

---

## Mode B — Standalone Script

```bash
batch/batch-runner.sh [OPTIONS]
```

Options:
- `--dry-run` — list pending listings without processing
- `--retry-failed` — reprocess only listings marked `failed`
- `--start-from N` — begin from batch ID N
- `--parallel N` — run N workers in parallel (default: 3)
- `--max-retries N` — retries per listing on failure (default: 2)

---

## batch-state.tsv Format

```
id	url	status	started_at	completed_at	report_num	score	error	retries
1	https://...	completed	2026-04-11T...	2026-04-11T...	002	4.1	-	0
2	https://...	failed	2026-04-11T...	-	-	-	Timeout	1
3	https://...	pending	-	-	-	-	-	0
```

---

## Resumability

- If the conductor dies mid-run: re-execute → read `batch-state.tsv` → skip completed listings
- Lock file at `batch/batch-runner.pid` prevents double execution
- Each worker is independent — a failure at listing #12 does not affect listing #13

---

## Workers (`claude -p`)

Each worker receives `batch/batch-prompt.md` as its system prompt. The prompt contains the same instructions as `modes/_shared.md` + `modes/eval.md`, compressed for the 200K worker context.

Each worker produces:
1. Report `.md` saved to `reports/`
2. Tracker addition TSV saved to `batch/tracker-additions/{id}.tsv`
3. JSON result to stdout: `{"id": N, "score": X.X, "status": "completed", "report": "reports/..."}`

**Note:** Playwright is not available in `claude -p` (headless pipe mode). Workers use WebFetch for JD extraction. All URLs verified by the conductor before handing to workers. Worker reports include: `**Verification:** unconfirmed (batch mode)`.

---

## Error Handling

| Error | Action |
|-------|--------|
| URL inaccessible | Mark `failed` in state, continue to next |
| JD behind login | Conductor attempts DOM read. If fails: mark `failed` |
| Worker timeout | Mark `failed`, eligible for `--retry-failed` |
| Worker crash | Mark `failed`, continue |
| Conductor dies | Re-execute → reads state → skips completed |
| PDF generation fails | Report `.md` saved, PDF marked pending in tracker |

---

## Post-batch

After all workers complete:
```bash
node merge-tracker.mjs
```

This merges all `batch/tracker-additions/*.tsv` into `data/applications.md`.

Display summary:

```
Batch Complete — {YYYY-MM-DD}
══════════════════════════════
Processed:  {N}
Completed:  {N}
Failed:     {N}
Skipped:    {N}

Top matches:
  #{num} — {company} | {role} | {score}/5
  #{num} — {company} | {role} | {score}/5
  ...

→ Run /naija-jobs pipeline to evaluate any remaining pending listings.
→ Review failed listings with: batch/batch-runner.sh --retry-failed
```
