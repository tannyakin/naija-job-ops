# Naija Job Ops

AI-powered job search pipeline for Nigerian graduates and NYSC corps members, built on Claude Code.

![Claude Code](https://img.shields.io/badge/Claude_Code-000?style=flat&logo=anthropic&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

---

## Built on career-ops

This project is a full adaptation of **career-ops**, an open-source AI job search system created by **Santiago Ferreira (santifer)**. The core architecture, Claude Code skill modes, markdown data layer, PDF generation, batch processing, pipeline integrity, and Go dashboard all originate from his work. Naija Job Ops would not exist without it.

> **Original work by Santiago Ferreira**
> career-ops : AI-powered job search system built on Claude Code. Built by someone who used it to evaluate 740+ job offers, generate 100+ tailored CVs, and land a Head of Applied AI role.
>
> [github.com/santifer/career-ops](https://github.com/santifer/career-ops) · [santifer.io](https://santifer.io) · [Read the original case study](https://santifer.io/career-ops-system)

Naija Job Ops adapts the full architecture for the Nigerian job market — Nigerian portals, NYSC and graduate trainee context, local company research, ATS CV building, and a skill-first onboarding path. If you find this useful, consider starring the original repo too.

---

## What is this

Naija Job Ops turns Claude Code into a full job search command center built for Nigeria. Instead of manually checking job boards and tracking everything in a spreadsheet, you get an AI pipeline that:

| Feature | Description |
|---|---|
| **Auto-pipeline** | Paste a URL, job description, or just a role, it auto-detects and runs the full pipeline |
| **Smart scanning** | Scans 6 Nigerian job boards and specialised programme searches for new listings |
| **8-dimension scoring** | Every listing scored against skill match, eligibility, deadline urgency, competition, location fit, and more |
| **CV tools** | Build, edit, and tailor ATS-compatible CVs , from scratch, from a file, or from LinkedIn |
| **Rich metadata** | Extracts posted date, applicant count, deadline, salary range, and qualification requirements |
| **Batch processing** | Evaluate 10+ listings in parallel with sub-agents |
| **Pipeline dashboard** | Terminal UI to browse, filter, and sort your full application pipeline |
| **Human-in-the-loop** | AI evaluates and recommends you decide and act. Nothing is ever submitted without your review |
| **Pipeline integrity** | Automated merge, dedup, status normalisation, and health checks |

> No CV? No problem. Start with just a role or skill e.g. "mobile developer, Java and Kotlin" — and the system runs immediately. It will guide you through building a full profile afterward.

---

## A heads up before you start

> **The first evaluations won't be your best.** The system doesn't know you yet. The more context you give it — your skills, your experience, what you're good at, what you want to avoid, the sharper it gets. Think of it like onboarding a new recruiter: the first week they need to learn about you, then they become genuinely useful. Run `/naija-jobs onboard` to fast-track that.

---

## Requirements

Naija Job Ops runs inside Claude Code, Anthropic's AI agent for the terminal. You need:

- **Claude Code** — install guide at [docs.anthropic.com/claude-code](https://docs.anthropic.com/claude-code)
- **An Anthropic API key** : get one at [console.anthropic.com](https://console.anthropic.com)
- **Node.js 18+** : for PDF generation and pipeline utilities. Download at [nodejs.org](https://nodejs.org)
- **Git**: to clone this repo
- **Go 1.21+ (optional)** : only needed for the terminal dashboard

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/tannyakin/naija-job-ops.git
cd naija-job-ops && npm install
npx playwright install chromium

# 2. Verify your setup
npm run doctor

# 3. Open Claude Code in the project folder
claude

# 4. Start immediately — no setup needed
/naija-jobs mobile developer kotlin

# Or run full onboarding for better results
/naija-jobs onboard
```

---

## Verify your setup

Run this after cloning to check that everything is properly installed and configured:

```bash
npm run doctor
```

Example output:

```
naija-job-ops doctor
─────────────────────────────────────────
 Environment

  ✔  Node.js v20.11.0
  ✔  npm dependencies installed
  ✔  Playwright / Chromium ready
  ✔  Claude Code installed
  ○  Go not found (optional: needed for dashboard only)

 Project setup

  ✔  config/profile.yml
  ✔  portals.yml
  ✔  profile-skills.md
  ○  cv.md not found
     → Run /naija-jobs cv edit to build your CV
  ✔  data/applications.md

 Pipeline integrity

  ✔  No unmerged tracker additions
  ✔  All statuses canonical

─────────────────────────────────────────
  1 warning · 0 errors

  You are ready. Open Claude Code with: claude
```

`✔` passing · `○` warning (non-blocking) · `✗` error (fix before running)

---

## How it works

```
You paste a URL, job description, or just a role/skill
                    │
                    ▼
        ┌─────────────────────┐
        │   Auto-detection    │  URL → scrape JD
        │                     │  Text → parse JD
        │                     │  Role/skill → scan portals
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Profile matching   │  Reads profile-skills.md
        │                     │  or cv.md if available
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  8-point evaluation │  Score, eligibility,
        │                     │  competition, deadline
        └────┬──────┬─────────┘
             │      │      │
          Report   PDF   Tracker
```

---

## Two ways to start

**Quick start**: type a role, paste a URL, or drop in a job description. The pipeline detects what you gave it and runs automatically.

```bash
/naija-jobs android developer
/naija-jobs https://jobberman.com/listings/some-role
/naija-jobs {paste a job description here}
```

After your first results the system will recommend full onboarding for more accurate evaluations.

**Full onboarding** : a guided conversation that builds your complete profile. Unlocks sharper scoring and better CV output. Takes about 5 minutes.

```bash
/naija-jobs onboard
```

Covers skills, education level, NYSC status, preferred locations, salary expectations, and CV build or import.

---

## Your CV — any format, any starting point

You never need to prepare a file in any specific format. Share whatever you have and the system handles the rest.

**1. You have a CV as a PDF or Word document**
Upload the file directly into Claude Code. It reads the content, extracts everything, and converts it automatically. No manual work needed.

**2. You have a CV in Google Docs or as plain text**
Copy and paste it into the chat. Any format works — the system parses and structures it properly.

**3. Your experience is on LinkedIn**
Share your LinkedIn profile URL. The system visits it and extracts your experience, education, and skills automatically.

**4. You have no CV at all**
Run `/naija-jobs onboard` and answer a few questions. The system builds a clean, ATS-ready CV for you from scratch following current best practices.

Once your CV is in the system you can improve and tailor it at any time:

| Command | What it does |
|---|---|
| `/naija-jobs cv edit` | Improve structure, language, and impact across any section |
| `/naija-jobs cv tailor` | Rewrite your CV to match a specific job description |
| `/naija-jobs pdf` | Generate a role-tailored CV and cover letter as a downloadable PDF |

> All CV output follows current ATS best practices — clean single-column layout, strong action verbs, quantified impact where possible, no tables or graphics that break automated parsers. The system will flag anything that could hurt your application before generating the final document.

---

## Usage

Naija Job Ops is a single slash command with multiple modes. You can also paste a job URL or description directly, it auto-detects what you gave it and runs the full pipeline.

| Command | What it does |
|---|---|
| `/naija-jobs` | Show all commands and current pipeline status |
| `/naija-jobs onboard` | Full guided setup — skills, education, location, CV build or import |
| `/naija-jobs {role or skill}` | Quick-start search and evaluation from just a description |
| `/naija-jobs {URL or JD}` | Full auto-pipeline — evaluate, generate report, update tracker |
| `/naija-jobs scan` | Scan all Nigerian portals for new listings matching your profile |
| `/naija-jobs eval` | Evaluate a single listing in detail |
| `/naija-jobs batch` | Evaluate multiple listings in parallel |
| `/naija-jobs pdf` | Generate a tailored CV and cover letter for a specific role |
| `/naija-jobs cv edit` | Review and improve your CV interactively |
| `/naija-jobs cv tailor` | Tailor your CV to a specific job description |
| `/naija-jobs tracker` | View your full application pipeline and statuses |
| `/naija-jobs pipeline` | Process all pending URLs saved in your pipeline |
| `/naija-jobs deep` | Deep research on a Nigerian company before applying |
| `/naija-jobs apply` | Get help filling out an application form |

---

## Pre-configured portals

The scanner comes pre-configured with Nigerian job boards, major employers across key industries, and targeted search queries. Copy `templates/portals.example.yml` to `portals.yml` and add your own companies or search terms.

**Job boards**
Jobberman · MyJobMag · NGCareers · HotNigerianJobs · Indeed Nigeria · LinkedIn Nigeria

**Banking & Finance**
GTBank · Zenith Bank · Access Bank · First Bank · UBA · Stanbic IBTC · PiggyVest · Flutterwave

**Tech & Startups**
Interswitch · Andela · Paystack · Kuda Bank · Moniepoint · Opay · Cowrywise · Teamapt

**Telecoms & Energy**
MTN Nigeria · Airtel Nigeria · Glo · 9mobile · Shell Nigeria · TotalEnergies · Chevron Nigeria · NNPC

**FMCG & Consumer**
Unilever Nigeria · Nestlé Nigeria · Nigerian Breweries · Dangote Group · PZ Cussons · Guinness Nigeria · Procter & Gamble Nigeria

**Professional Services**
Deloitte Nigeria · KPMG Nigeria · PwC Nigeria · EY Nigeria · McKinsey Africa · BCG Nigeria · Accenture Nigeria

**Pre-configured search queries**
Graduate trainee · Management trainee · NYSC corps member · Entry level Nigeria · Fresh graduate · Internship Nigeria · IT industrial training · Junior developer Nigeria · Software engineer Lagos · Data analyst Nigeria · Product manager Nigeria · Business analyst Nigeria · Finance officer Nigeria · HR officer Nigeria · Marketing executive Nigeria

> The system is designed to be customised by Claude itself. Ask it to add companies, change search keywords, or adjust filters for your target roles, it reads the same config files it uses, so it knows exactly what to edit.

---

## Scoring system

Every listing is scored out of 5 across 8 dimensions weighted for the Nigerian job market. Anything 3.5 and above is worth applying to.

| Dimension | What it measures |
|---|---|
| Role-skill match | How well the JD aligns with your stated skills and experience |
| Qualification eligibility | OND / HND / BSc / MSc requirement vs your education level |
| NYSC eligibility | Required or preferred NYSC status vs yours |
| Deadline urgency | Closing soon scores higher — act fast |
| Applicant competition | Fewer applicants means better odds, used as an opportunity signal |
| Company legitimacy | Known, verified Nigerian employer vs unverified listing |
| Location fit | Whether the role matches your preferred work location |
| Growth potential | Structured graduate trainee programme vs a generic one-off hire |

- **3.5 – 5.0** — Apply. Strong fit.
- **3.0 – 3.4** — Review carefully before applying.
- **Below 3.0** — Low fit. Skip unless you have a specific reason.

---

## What gets extracted per listing

**Always extracted**
- Job title and company name
- Location — state, city, and work mode
- Required qualification level
- NYSC status requirement
- Direct application URL
- Date the listing was posted

**Extracted when available**
- Application deadline
- Number of applicants so far
- Salary range or band
- Years of experience required
- Application method — form, email, or portal

---

## Project structure

```
naija-job-ops/
├── CLAUDE.md                   # Agent instructions — the brain of the system
├── profile-skills.md           # Your skills profile (created during onboarding)
├── cv.md                       # Your CV — auto-generated from whatever you provide
├── doctor.mjs                  # Setup health check script
├── config/
│   └── profile.yml             # Name, location, salary, preferences
├── modes/                      # All skill modes
│   ├── _shared.md              # Scoring weights, archetypes, shared context
│   ├── onboard.md              # Guided setup and CV build flow
│   ├── eval.md                 # Single listing evaluation
│   ├── scan.md                 # Nigerian portal scanner
│   ├── pdf.md                  # Tailored CV and cover letter generation
│   ├── cv.md                   # CV editing and tailoring
│   ├── batch.md                # Parallel batch evaluation
│   ├── tracker.md              # Pipeline view
│   ├── apply.md                # Application form assistance
│   ├── deep.md                 # Company research
│   └── pipeline.md             # Pending URL processing
├── templates/
│   ├── cv-template.html        # ATS-optimized document template
│   └── states.yml              # Canonical application statuses
├── data/                       # Your personal data — gitignored
│   ├── applications.md         # Application tracker
│   └── pipeline.md             # Pending URLs inbox
├── reports/                    # Evaluation reports — gitignored
├── output/                     # Generated PDFs — gitignored
└── dashboard/                  # Go TUI pipeline viewer
```

> Everything in `data/`, `reports/`, and `output/` is gitignored. Your CV, application tracker, and generated documents stay on your machine and are never pushed to GitHub.

---

## Available scripts

```bash
npm run doctor      # Check your full setup — run this first
npm run verify      # Check pipeline data integrity
npm run merge       # Merge pending tracker additions into applications.md
npm run dedup       # Remove duplicate entries from the tracker
npm run normalize   # Fix any non-canonical status values
```

---

## Ethical use

> This system is a quality filter, not a volume tool. The goal is to find roles that genuinely fit — not to send generic applications to every open listing. The system never submits anything on your behalf. You review everything first. You always have the final call.

---

## Contributing

This is an early version built specifically for the Nigerian job market. Contributions are welcome — especially around portal coverage, company list expansion, scoring calibration for local context, and CV template improvements. Open an issue or pull request on GitHub.

---

## License

MIT — same as the original career-ops. Fork it, adapt it for your market, improve it.

---

Built by [tannyakin](https://github.com/tannyakin) · Based on [career-ops](https://github.com/santifer/career-ops) by [Santiago Ferreira](https://santifer.io) · [Star the original repo](https://github.com/santifer/career-ops)
