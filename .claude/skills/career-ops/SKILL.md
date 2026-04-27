---
name: career-ops
description: AI job search command center for Nigeria -- evaluate listings, generate CVs, scan portals, track applications
user_invocable: true
args: mode
argument-hint: "[scan | eval | compare | outreach | deep | pdf | apply | batch | tracker | pipeline | training | project | interview-prep | followup | patterns | onboard | cv]"
---

# career-ops -- Router

## Mode Routing

Determine the mode from `{{mode}}`:

| Input | Mode |
|-------|------|
| (empty / no args) | `discovery` -- Show command menu |
| JD text or URL (no sub-command) | **`auto-pipeline`** |
| `eval` | `eval` |
| `compare` | `compare` |
| `outreach` | `outreach` |
| `deep` | `deep` |
| `pdf` | `pdf` |
| `training` | `training` |
| `project` | `project` |
| `tracker` | `tracker` |
| `pipeline` | `pipeline` |
| `apply` | `apply` |
| `scan` | `scan` |
| `batch` | `batch` |
| `patterns` | `patterns` |
| `followup` | `followup` |
| `onboard` | `onboard` |
| `cv` | `cv` |
| `interview-prep` | `interview-prep` |

**Auto-pipeline detection:** If `{{mode}}` is not a known sub-command AND contains JD text (keywords: "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", company name + role) or a URL to a JD, execute `auto-pipeline`.

If `{{mode}}` is not a sub-command AND doesn't look like a JD, show discovery.

---

## Discovery Mode (no arguments)

Show this menu:

```
naija-job-ops -- Command Center

Available commands:
  /naija-jobs {JD or URL}  → AUTO-PIPELINE: evaluate + report + PDF + tracker
  /naija-jobs scan         → Scan Nigerian job portals for new listings
  /naija-jobs pipeline     → Process pending URLs from data/pipeline.md
  /naija-jobs eval         → Evaluate a single listing (full report)
  /naija-jobs compare      → Compare and rank multiple listings side by side
  /naija-jobs outreach     → LinkedIn outreach: find contacts + draft message
  /naija-jobs deep         → Deep research on a Nigerian company
  /naija-jobs pdf          → Generate tailored CV and cover letter as PDF
  /naija-jobs cv edit      → ATS audit and improvement of your master CV
  /naija-jobs cv tailor    → Tailor CV to a specific job listing
  /naija-jobs apply        → Live application assistant (reads form + generates answers)
  /naija-jobs tracker      → Application status overview
  /naija-jobs followup     → Follow-up cadence tracker: flag overdue, generate drafts
  /naija-jobs interview    → Interview preparation and STAR story framework
  /naija-jobs training     → Evaluate a course or certification against your goals
  /naija-jobs project      → Evaluate a portfolio project idea
  /naija-jobs patterns     → Analyse rejection patterns and improve targeting
  /naija-jobs batch        → Batch processing with parallel workers
  /naija-jobs onboard      → Set up or update your profile

Inbox: add URLs to data/pipeline.md → /naija-jobs pipeline
Or paste a JD directly to run the full pipeline.
```

---

## Context Loading by Mode

After determining the mode, load the necessary files before executing:

### Modes that require `_shared.md` + `_profile.md` + their mode file:
Read `modes/_shared.md` + `modes/_profile.md` + `modes/{mode}.md`

Applies to: `auto-pipeline`, `eval`, `compare`, `pdf`, `apply`, `pipeline`, `scan`, `batch`

### Standalone modes (only their mode file):
Read `modes/{mode}.md`

Applies to: `tracker`, `deep`, `training`, `project`, `patterns`, `followup`, `onboard`, `cv`, `outreach`, `interview-prep`

### Modes delegated to subagent:
For `scan`, `apply` (with Playwright), and `pipeline` (3+ URLs): launch as Agent with the content of `_shared.md` + `_profile.md` + `modes/{mode}.md` injected into the subagent prompt.

```
Agent(
  subagent_type="general-purpose",
  prompt="[content of modes/_shared.md]\n\n[content of modes/_profile.md]\n\n[content of modes/{mode}.md]\n\n[invocation-specific data]",
  description="naija-job-ops {mode}"
)
```

Execute the instructions from the loaded mode file.
