# Setup Guide

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured
- Node.js 18+ (for PDF generation and utility scripts)
- (Optional) Go 1.21+ (for the dashboard TUI)

## Quick Start (5 steps)

### 1. Clone and install

```bash
git clone https://github.com/tannyakin/naija-job-ops.git
cd naija-job-ops
npm install
npx playwright install chromium   # Required for PDF generation
```

### 2. Configure your profile

```bash
cp config/profile.example.yml config/profile.yml
```

Edit `config/profile.yml` with your personal details: name, email, target roles, location, NYSC status, salary target.

### 3. Add your skills profile

Create `profile-skills.md` in the project root with your skills, education, and experience summary. This is the primary source of truth for all evaluations. If you have a CV, you can also create `cv.md` — but `profile-skills.md` alone is enough to start.

Run `/naija-jobs onboard` to have the system guide you through creating both files.

### 4. Configure portals

```bash
cp templates/portals.example.yml portals.yml
```

Edit `portals.yml`:
- Update `title_filter.positive` with keywords matching your target roles
- Add Nigerian companies you want to track in `tracked_companies`
- Customize `search_queries` for your preferred job boards

### 5. Start using

Open Claude Code in this directory:

```bash
claude
```

Then paste a job listing URL or description. naija-job-ops will automatically evaluate it, generate a report, create a tailored PDF, and track it.

## Available Commands

| Action | How |
|--------|-----|
| Evaluate a listing | Paste a URL or JD text |
| Full onboarding | `/naija-jobs onboard` |
| Scan Nigerian portals | `/naija-jobs scan` |
| Process pending URLs | `/naija-jobs pipeline` |
| Generate a PDF | `/naija-jobs pdf` |
| Batch evaluate | `/naija-jobs batch` |
| Check tracker status | `/naija-jobs tracker` |
| Fill application form | `/naija-jobs apply` |
| Compare listings | `/naija-jobs compare` |
| LinkedIn outreach | `/naija-jobs outreach` |
| Company research | `/naija-jobs deep` |

## Verify Setup

```bash
npm run doctor              # Full health check (recommended)
node verify-pipeline.mjs    # Check pipeline integrity
```

## Build Dashboard (Optional)

```bash
cd dashboard
go build -o naija-dashboard .
./naija-dashboard --path ..  # Opens TUI pipeline viewer
```
