# Naija Job Ops

AI-powered job search for Nigeria, built on Claude Code. Finds the newest jobs on LinkedIn, Nigerian job boards and remote boards before everyone else applies, matches them to your CV, and helps you write, apply, practise and prepare, for any field.

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

Naija Job Ops adapts the full architecture for the Nigerian job market: Nigerian portals, NYSC and graduate trainee context, local company research, ATS CV building, and a skill-first onboarding path. If you find this useful, consider starring the original repo too.

---

## What is this

Naija Job Ops turns Claude Code into a full job search command center built for Nigeria. Instead of manually checking job boards and tracking everything in a spreadsheet, you get an AI pipeline that:

| Feature | Description |
|---|---|
| **Fresh-job scanning** | LinkedIn (logged-out, newest first, with applicant counts), Jobberman, MyJobMag, HotNigerianJobs, NgCareers, Jobgurus, Indeed Nigeria, remote boards and company career pages, all in one scan |
| **Speed over crowds** | Every result is ranked by how recently it was posted, how few people have applied, and how well it fits you. 🔥 marks roles posted in the last 24h with few applicants |
| **Remote jobs you can actually take** | Remote roles are filtered to Worldwide/Africa/EMEA/Nigeria, so US-only roles don't waste your time |
| **Matches you, not just keywords** | `/naija-jobs match` ranks results against your whole CV, explains each pick and asks you when it needs a fact |
| **Nigerian eligibility checks** | NYSC, class of degree (2:1 cut-offs), age limits, O'Level credits, public-sector rules, all checked automatically |
| **Scam detection** | Flags application fees, Gmail/Yahoo application emails, WhatsApp-only contact, BVN requests and fake government portals |
| **CV tools** | Build a CV from scratch (finds experience you didn't know counts), ATS audit, reorder and tailor per job |
| **Cover letters** | Tailored letters as a PDF, text-box answer, or email, in the right format for banks, graduate schemes, government or remote roles |
| **Forms & surveys** | Draft answers for application forms, screening questions and employer questionnaires. You review and submit |
| **Tests & interviews** | Aptitude/CBT/SJT practice, Nigerian interview formats (panels, assessment centres), live mock interviews with feedback |
| **Tutorial** | `/naija-jobs tutorial`: a hands-on 10-minute tour |
| **Tracking** | Tracker, follow-up reminders, pattern analysis, terminal dashboard |
| **Human-in-the-loop** | Nothing is ever submitted without your review |

> No CV? No problem. Start with just a role or skill (e.g. "mobile developer, Java and Kotlin") and the system runs immediately. It will guide you through building a full profile afterward.

---

## A heads up before you start

> **The first evaluations won't be your best.** The system doesn't know you yet. The more context you give it (your skills, your experience, what you're good at, what you want to avoid), the sharper it gets. Think of it like onboarding a new recruiter: the first week they need to learn about you, then they become genuinely useful. Run `/naija-jobs onboard` to fast-track that.

---

## Requirements

Naija Job Ops runs inside Claude Code, Anthropic's AI agent for the terminal. You need:

- **Claude Code**: install guide at [docs.anthropic.com/claude-code](https://docs.anthropic.com/claude-code)
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

# 4. Start immediately: no setup needed
/naija-jobs mobile developer kotlin

# Or run full onboarding for better results
/naija-jobs onboard

# New? Take the 10-minute guided tour
/naija-jobs tutorial
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
        │  Fresh-job scan     │  LinkedIn · Jobberman · MyJobMag ·
        │  (node scan.mjs)    │  HotNigerianJobs · NgCareers · Indeed ·
        │                     │  remote boards · company pages
        └──────────┬──────────┘
                   │  ranked by freshness + competition + fit
        ┌──────────▼──────────┐
        │  /naija-jobs match  │  Your full CV vs each job;
        │                     │  asks you what it needs to know
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  8-point evaluation │  Score, eligibility (NYSC, 2:1,
        │                     │  age, O'Level), scam check
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

## Your CV: any format, any starting point

You never need to prepare a file in any specific format. Share whatever you have and the system handles the rest.

**1. You have a CV as a PDF or Word document**
Upload the file directly into Claude Code. It reads the content, extracts everything, and converts it automatically. No manual work needed.

**2. You have a CV in Google Docs or as plain text**
Copy and paste it into the chat. Any format works: the system parses and structures it properly.

**3. Your experience is on LinkedIn**
Share your LinkedIn profile URL. The system visits it and extracts your experience, education, and skills automatically.

**4. You have no CV at all**
Run `/naija-jobs cv build` and answer a few questions. The system builds a clean, ATS-ready CV from scratch. It also digs out experience most graduates forget to include: SIWES, NYSC PPA and CDS projects, family business, tutoring, church or mosque roles, freelancing and volunteering.

Once your CV is in the system you can improve and tailor it at any time:

| Command | What it does |
|---|---|
| `/naija-jobs cv build` | Build a CV from scratch through a short guided chat |
| `/naija-jobs cv edit` | Improve structure, language, and impact across any section |
| `/naija-jobs cv tailor` | Rewrite your CV to match a specific job description |
| `/naija-jobs pdf` | Generate a role-tailored CV and cover letter as downloadable PDFs |
| `/naija-jobs cover-letter` | Just the cover letter, as a PDF, a paste-in answer, or an email |

> All CV output follows current ATS best practices: clean single-column layout, strong action verbs, quantified impact where possible, no tables or graphics that break automated parsers. The system will flag anything that could hurt your application before generating the final document.

---

## Usage

Naija Job Ops is a single slash command with multiple modes. You can also paste a job URL or description directly, it auto-detects what you gave it and runs the full pipeline.

| Command | What it does |
|---|---|
| `/naija-jobs` | Show all commands |
| `/naija-jobs tutorial` | Guided tour: learn the whole system by using it |
| `/naija-jobs onboard` | Guided setup: skills, education, eligibility, location, CV |
| `/naija-jobs {role or field}` | Quick-start: scan for that role, then match to you |
| `/naija-jobs {URL or JD}` | Full auto-pipeline: evaluate, report, tracker |
| `/naija-jobs scan {role}` | LinkedIn + Nigerian boards + remote + company pages, newest first |
| `/naija-jobs linkedin {role}` | LinkedIn only; say "last hour" for the very newest postings |
| `/naija-jobs remote {role}` | Remote roles open to Nigeria-based candidates |
| `/naija-jobs match` | Rank results against your full CV, with reasons |
| `/naija-jobs eval` | Evaluate a single listing in detail |
| `/naija-jobs compare` | Compare several listings side by side |
| `/naija-jobs pipeline` | Evaluate everything queued in `data/pipeline.md` |
| `/naija-jobs batch` | Evaluate many listings in parallel |
| `/naija-jobs cv build` / `edit` / `tailor` | Build, audit or tailor your CV |
| `/naija-jobs pdf` | Tailored CV + cover letter PDFs |
| `/naija-jobs cover-letter` | Cover letter as a PDF, text-box answer, or email |
| `/naija-jobs apply` | Form, screening-question and survey answers (you submit) |
| `/naija-jobs aptitude` | Aptitude / CBT / SJT practice and revision plan |
| `/naija-jobs interview` | How this company interviews, likely questions, your best stories |
| `/naija-jobs mock` | Live mock interview with feedback after each answer |
| `/naija-jobs deep` | Deep research on a company |
| `/naija-jobs outreach` | LinkedIn message to a recruiter or hiring manager |
| `/naija-jobs tracker` | Application pipeline and statuses |
| `/naija-jobs followup` | Who to follow up with, and drafts |
| `/naija-jobs patterns` | What's working and what isn't |

---

## Finding the newest jobs

The scanner (`scan.mjs`) runs without using any AI tokens, so you can run it as often as you like, even on a schedule.

```bash
node scan.mjs                                        # everything, using your profile's keywords
node scan.mjs --keywords "data analyst"              # any field; repeat --keywords for several
node scan.mjs --source linkedin --since 1h           # LinkedIn postings from the last hour
node scan.mjs --source remote --since 3d             # remote roles open to Nigeria
node scan.mjs --location "Abuja, Nigeria" --experience internship,entry
node scan.mjs --dry-run                              # preview without saving
```

Each result shows how long ago it was posted, the applicant count where the source shows one, where it came from, and a quick fit score from your profile. Results are saved to `data/scan-results.json`, and good new ones are queued in `data/pipeline.md`. Then run `/naija-jobs match` inside Claude to pick the best ones against your full CV.

**About LinkedIn.** naija-job-ops reads LinkedIn **logged-out only**, using the same public job pages anyone can see without an account. It never logs in and never touches your LinkedIn account. Requests are slow and polite, and the scanner backs off if LinkedIn rate-limits it. This is for your personal job search. Scraping may still be against LinkedIn's terms of service, so use it responsibly and don't run it in tight loops.

**When a site blocks scripts** (Indeed, and sometimes others), the scanner lists it as "needs browser" and Claude checks it with Playwright instead. If a board changes its website, fix its link pattern in `portals.yml` → `job_boards`. No code changes needed.

---

## Pre-configured portals

The scanner comes pre-configured with Nigerian job boards, major employers across key industries, and targeted search queries. Copy `templates/portals.example.yml` to `portals.yml` and add your own companies or search terms.

**Job boards**
LinkedIn (logged-out) · Jobberman · MyJobMag · HotNigerianJobs · NgCareers · Jobgurus · Indeed Nigeria (browser)

**Remote boards (filtered to roles open to Nigeria)**
Remotive · RemoteOK · Himalayas · Jobicy · We Work Remotely

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

| Dimension | Weight | What it measures |
|---|---|---|
| Role-skill match | 25% | How well the JD aligns with your skills and experience |
| Qualification eligibility | 20% | OND / HND / BSc / MSc and class of degree vs yours |
| NYSC / age / O'Level | 15% | NYSC status, age limits, O'Level credits |
| Freshness & competition | 15% | Posted recently with few applicants = your best odds |
| Deadline urgency | 5% | Closing soon scores higher, so you act fast |
| Company legitimacy | 10% | Known, verified employer vs unverified listing |
| Location / remote fit | 5% | Your preferred locations; remote roles open to Nigeria |
| Growth potential | 5% | Structured programme vs a generic one-off hire |

- **3.5 – 5.0**: Apply. Strong fit.
- **3.0 – 3.4**: Review carefully before applying.
- **Below 3.0**: Low fit. Skip unless you have a specific reason.

---

## What gets extracted per listing

**Always extracted**
- Job title and company name
- Location: state, city, and work mode
- Required qualification level
- NYSC status requirement
- Direct application URL
- Date the listing was posted

**Extracted when available**
- Application deadline
- Number of applicants so far
- Salary range or band
- Years of experience required
- Application method: form, email, or portal

---

## Project structure

```
naija-job-ops/
├── CLAUDE.md                   # Agent instructions: the brain of the system
├── profile-skills.md           # Your skills profile (created during onboarding)
├── cv.md                       # Your CV: auto-generated from whatever you provide
├── doctor.mjs                  # Setup health check script
├── scan.mjs                    # Zero-token multi-source job scanner
├── sources/                    # LinkedIn, Nigerian boards, remote boards, ATS, profile fit
├── tracker-lib.mjs             # 12-column tracker format (shared by all scripts)
├── tests/                      # Offline scraper tests with saved fixtures
├── config/
│   └── profile.yml             # Name, location, salary, preferences
├── modes/                      # All skill modes
│   ├── _shared.md              # Scoring weights, archetypes, shared context
│   ├── onboard.md              # Guided setup and CV build flow
│   ├── eval.md                 # Single listing evaluation
│   ├── tutorial.md             # Guided tour
│   ├── scan.md                 # LinkedIn + boards + remote scanner
│   ├── match.md                # Rank jobs against your CV
│   ├── cover-letter.md         # Cover letters (PDF / text / email)
│   ├── interview-prep.md       # Company interview research
│   ├── mock-interview.md       # Live mock interviews
│   ├── aptitude.md             # Aptitude / CBT / SJT practice
│   ├── pdf.md                  # Tailored CV and cover letter generation
│   ├── cv.md                   # CV editing and tailoring
│   ├── batch.md                # Parallel batch evaluation
│   ├── tracker.md              # Pipeline view
│   ├── apply.md                # Application form assistance
│   ├── deep.md                 # Company research
│   └── pipeline.md             # Pending URL processing
├── templates/
│   ├── cv-template.html        # ATS-optimized CV template
│   ├── cover-letter-template.html # Cover letter template
│   └── states.yml              # Canonical application statuses
├── data/                       # Your personal data: gitignored
│   ├── applications.md         # Application tracker
│   ├── pipeline.md             # Pending URLs inbox
│   └── scan-results.json       # Latest ranked scan
├── reports/                    # Evaluation reports: gitignored
├── output/                     # Generated PDFs: gitignored
└── dashboard/                  # Go TUI pipeline viewer
```

> Everything in `data/`, `reports/`, and `output/` is gitignored. Your CV, application tracker, and generated documents stay on your machine and are never pushed to GitHub.

---

## Available scripts

```bash
npm run doctor      # Check your full setup: run this first
npm run scan        # Scan all sources (see "Finding the newest jobs")
npm run scan:linkedin  # LinkedIn, last 24h
npm run scan:remote    # Remote roles open to Nigeria, last 3 days
npm test            # Run the test suite
npm run verify      # Check pipeline data integrity
npm run merge       # Merge pending tracker additions into applications.md
npm run dedup       # Remove duplicate entries from the tracker
npm run normalize   # Fix any non-canonical status values
```

---

## Ethical use

> This system is a quality filter, not a volume tool. The goal is to find roles that genuinely fit, not to send generic applications to every open listing. The system never submits anything on your behalf. You review everything first. You always have the final call.

---

## Other markets

The original career-ops project ships translated modes for Germany, France, Japan, Brazil/Portugal and Russia. naija-job-ops focuses on Nigeria only, so those have been removed. If you want to adapt the system for another market, start from [career-ops](https://github.com/santifer/career-ops).

---

## Contributing

This is an early version built specifically for the Nigerian job market. Contributions are welcome, especially around portal coverage, company list expansion, scoring calibration for local context, and CV template improvements. Open an issue or pull request on GitHub.

---

## License

MIT, same as the original career-ops. Fork it, adapt it for your market, improve it.

---

Built by [tannyakin](https://github.com/tannyakin) · Based on [career-ops](https://github.com/santifer/career-ops) by [Santiago Ferreira](https://santifer.io) · [Star the original repo](https://github.com/santifer/career-ops)
