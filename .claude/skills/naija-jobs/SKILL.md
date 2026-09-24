---
name: naija-jobs
description: AI job search command center for Nigeria -- find the newest jobs on LinkedIn, Nigerian job boards and remote boards, match them to your CV, evaluate listings, write CVs and cover letters, fill forms, prepare for tests and interviews, and track applications
user_invocable: true
args: mode
argument-hint: "[tutorial | scan | linkedin | remote | match | eval | pdf | cover-letter | cv | apply | interview | mock | aptitude | tracker | pipeline | followup | onboard | ...]"
---

# naija-jobs -- Router

## Mode Routing

Determine the mode from `{{mode}}` (first word; the rest are arguments):

| Input | Mode file |
|-------|-----------|
| (empty / no args) | `discovery` -- show command menu below |
| JD text or URL (no sub-command) | `modes/auto-pipeline.md` |
| `tutorial`, `help`, `learn` | `modes/tutorial.md` |
| `onboard`, `setup`, `profile` | `modes/onboard.md` |
| `scan` | `modes/scan.md` |
| `linkedin` | `modes/scan.md` (LinkedIn preset) |
| `remote` | `modes/scan.md` (remote preset) |
| `boards` | `modes/scan.md` (Nigerian boards preset) |
| `match`, `best`, `recommend` | `modes/match.md` |
| `eval` | `modes/eval.md` |
| `compare` | `modes/compare.md` |
| `pipeline` | `modes/pipeline.md` |
| `batch` | `modes/batch.md` |
| `pdf` | `modes/pdf.md` |
| `cover-letter`, `cover`, `letter` | `modes/cover-letter.md` |
| `cv` (+ `build` / `edit` / `tailor`), `resume` | `modes/cv.md` |
| `apply`, `form`, `survey` | `modes/apply.md` |
| `interview`, `interview-prep` | `modes/interview-prep.md` |
| `mock` | `modes/mock-interview.md` |
| `aptitude`, `test`, `cbt` | `modes/aptitude.md` |
| `outreach` | `modes/outreach.md` |
| `deep` | `modes/deep.md` |
| `tracker` | `modes/tracker.md` |
| `followup` | `modes/followup.md` |
| `patterns` | `modes/patterns.md` |
| `training` | `modes/training.md` |
| `project` | `modes/project.md` |

**Auto-pipeline detection:** If `{{mode}}` is not a known sub-command AND contains JD text (keywords: "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", company name + role) or a URL to a JD, execute `auto-pipeline`.

**Role/field phrase** (e.g. "android developer", "graduate trainee banking", "nurse Abuja"): run `scan` with that phrase as keywords, then `match`.

Otherwise show discovery.

---

## Discovery Mode (no arguments)

Show this menu:

```
naija-job-ops: Command Center

New here?  /naija-jobs tutorial   (10-minute guided tour)

FIND JOBS
  /naija-jobs scan {role}      → LinkedIn + Nigerian boards + remote + company pages, newest first
  /naija-jobs linkedin {role}  → LinkedIn only; say "last hour" for the very newest postings
  /naija-jobs remote {role}    → remote roles you can take from Nigeria (incl. USD-paid)
  /naija-jobs match            → rank results against YOUR CV, best fits first
  /naija-jobs pipeline         → evaluate every job queued in data/pipeline.md

EVALUATE
  /naija-jobs {URL or JD}      → full evaluation + report + tracker (auto-pipeline)
  /naija-jobs eval             → evaluate a single listing
  /naija-jobs compare          → compare several listings side by side
  /naija-jobs deep             → deep research on a company

APPLY
  /naija-jobs cv build         → build a CV from scratch (finds experience you didn't know counts)
  /naija-jobs cv edit          → ATS audit of your CV
  /naija-jobs cv tailor        → tailor your CV to a job
  /naija-jobs pdf              → tailored CV + cover letter PDFs
  /naija-jobs cover-letter     → cover letter as PDF, text box answer, or email
  /naija-jobs apply            → application form, screening and survey answers (you submit)
  /naija-jobs outreach         → LinkedIn message to a recruiter / hiring manager

PREPARE
  /naija-jobs aptitude         → aptitude / CBT / SJT practice + revision plan
  /naija-jobs interview        → company-specific interview research
  /naija-jobs mock             → live mock interview with feedback

TRACK
  /naija-jobs tracker          → application status overview
  /naija-jobs followup         → who to follow up with + drafts
  /naija-jobs patterns         → what's working, what isn't

MORE
  /naija-jobs onboard          → set up / update your profile
  /naija-jobs training         → is this course/certification worth it?
  /naija-jobs project          → is this portfolio project worth building?
  /naija-jobs batch            → batch-evaluate many listings in parallel
```

---

## Context Loading by Mode

After determining the mode, load the necessary files before executing:

### Modes that require `_shared.md` + `_profile.md` + their mode file:
Read `modes/_shared.md` + `modes/_profile.md` + `modes/{mode}.md`

Applies to: `auto-pipeline`, `eval`, `compare`, `pdf`, `apply`, `pipeline`, `scan` (incl. linkedin/remote/boards), `match`, `batch`, `cover-letter`

### Standalone modes (only their mode file):
Read `modes/{mode}.md` (plus `modes/_shared.md` → "Clarifying Questions Protocol" when the mode asks the user questions)

Applies to: `tutorial`, `tracker`, `deep`, `training`, `project`, `patterns`, `followup`, `onboard`, `cv`, `outreach`, `interview-prep`, `mock-interview`, `aptitude`

### Modes delegated to subagent:
For `apply` (with Playwright) and `pipeline` (3+ URLs): launch as Agent with the content of `_shared.md` + `_profile.md` + `modes/{mode}.md` injected into the subagent prompt.

`scan` runs `node scan.mjs` directly (zero tokens), then uses Playwright only for sources the script reports as "needs browser". Run it in the main context so the user can answer clarifying questions.

```
Agent(
  subagent_type="general-purpose",
  prompt="[content of modes/_shared.md]\n\n[content of modes/_profile.md]\n\n[content of modes/{mode}.md]\n\n[invocation-specific data]",
  description="naija-job-ops {mode}"
)
```

Execute the instructions from the loaded mode file.

## Always

- Ask when a needed fact is missing (max 3 questions at a time). Never guess eligibility facts.
- Never submit an application, and never answer live assessment tests for the user.
