# Mode: interview-prep (Company-Specific Interview Intelligence)

When the user asks to prep for an interview at a specific company+role, or when an evaluation scores 4.0+ and the user updates status to `Interview`, run this mode.

## Inputs

1. **Company name** and **role title** (required)
2. **Evaluation report** in `reports/` (if exists): read for archetype, gaps, matched proof points
3. **Story bank** at `interview-prep/story-bank.md`: read for existing prepared stories
4. **CV** at `cv.md` or `profile-skills.md`: read for proof points
5. **Profile** at `modes/_profile.md` + `config/profile.yml`: read for candidate context, narrative, and archetypes

## Step 1: Research

Run these WebSearch queries. Extract structured data, not summaries. Cite sources for every claim.

| Query | What to extract |
|-------|-----------------|
| `"{company}" interview questions site:glassdoor.com` | Questions asked, rounds, difficulty, timeline (Glassdoor has good coverage of Nigerian banks, FMCG, Big 4, telcos) |
| `"{company}" graduate trainee aptitude test past questions` | Which test provider (SHL, Workforce/Dragnet, TestGorilla, Aon/cut-e, Kenexa, in-house CBT), sections, time limits, cut-off stories |
| `"{company}" assessment centre experience Nigeria` | Group exercise, presentation, case study, panel format |
| `"{company}" interview experience site:nairaland.com` | Candid Nigerian candidate accounts (verify them; quality varies) |
| `"{company}" interview site:linkedin.com/posts` | Recent candidate write-ups, hiring-manager posts |
| `"{company}" {role} interview` (general) | Blogs, YouTube walk-throughs, prep guides (MyJobMag and Jobberman publish company test/interview guides) |
| `"{company} engineering blog"` / `site:leetcode.com/discuss "{company}"` | Tech roles only: stack, coding rounds |

If the company is small or obscure and yields few results, broaden: search for the role archetype at similar-stage companies, and note that intel is sparse.

**Do NOT fabricate questions.** If a source says "they asked about distributed systems," report that. Do not invent a specific distributed systems question. When generating likely questions from JD analysis, label them clearly as `[inferred from JD]` not sourced from candidates.

## Step 1b: Nigerian Interview Formats

Most Nigerian employers follow one of these pipelines. If research is thin, use the matching pattern and say it's the typical pattern, not confirmed:

| Employer type | Typical pipeline | What they're really testing |
|---------------|------------------|-----------------------------|
| Tier-1 banks (graduate schemes) | Online application → aptitude test (numerical, verbal, logical; often proctored) → assessment centre or panel interview → medicals → academy training | Speed and accuracy under time pressure, composure, communication, integrity |
| FMCG (Nestlé, Unilever, NB, Guinness, P&G, PZ) | Online application → SJT/personality → numerical/logical → assessment centre (group case, presentation, interview) | Leadership examples, drive, consumer/commercial thinking, teamwork in the group exercise |
| Big 4 / consulting | Online test (numerical/verbal, sometimes Excel) → case or technical interview → partner interview | Structured thinking, business awareness, polish |
| Oil & gas / engineering | CBT (technical + aptitude) → technical interview → HSE-focused behavioural → medicals | Core engineering knowledge, safety mindset |
| Telecoms | Aptitude → technical/role interview → HR | Technical basics, customer focus |
| Tech startups / fintech | Recruiter call → take-home or live coding/case → team interview → founder/leadership | Practical skill, ownership, speed of learning |
| Public sector | CBT → document verification → oral interview (often a panel) | Knowledge of the agency, current affairs, composure, integrity |
| Remote / international | Recruiter screen → take-home → technical/culture interviews on video | Async communication, English clarity, time-zone reliability, portfolio proof |

Also prepare the user for these Nigerian specifics:
- **Panel interviews** with 3–6 people: address the person who asked, glance at others; don't panic at rapid switches.
- **"Tell us about yourself"** is almost always first: 60–90 seconds, education → most relevant experience → why this role. No family history.
- **Current affairs** questions (public sector, banks): recent CBN policy, naira exchange rate, inflation, the company's latest news.
- **Salary question** ("What is your expectation?"): give a researched range for the role/sector, not "anything you offer".
- **Document checks:** bring originals and copies of your degree/statement of result, NYSC certificate or exemption, O'Level results, birth certificate/age declaration, passport photos, ID.
- **Logistics:** confirm venue, dress code (corporate unless told), and arrive 30–45 minutes early because Lagos traffic is a real risk; for virtual interviews test power and data backup beforehand.
- **Scam check:** a real interview never requires a payment, a "training fee", or travelling to a hotel to "buy forms".

## Step 2: Process Overview

```markdown
## Process Overview
- **Rounds:** {N} rounds, ~{X} days end-to-end
- **Format:** {e.g., recruiter screen → technical phone → take-home → onsite (4 rounds) → hiring manager}
- **Difficulty:** {X}/5 (Glassdoor avg, N reviews)
- **Positive experience rate:** {X}%
- **Known quirks:** {e.g., "pair programming instead of whiteboard", "no LeetCode, all practical", "take-home is 4 hours"}
- **Sources:** {links}
```

If data is insufficient for any field, write "unknown (not enough data)" rather than guessing.

## Step 3: Round-by-Round Breakdown

For each round discovered in research:

```markdown
### Round {N}: {Type}
- **Duration:** {X} min
- **Conducted by:** {peer / manager / skip-level / recruiter, if known}
- **What they evaluate:** {specific skills or traits}
- **Reported questions:**
  - {question} [source: Glassdoor 2026-Q1]
  - {question} [source: Blind]
- **How to prepare:** {1-2 concrete actions}
```

If round structure is unknown, state that and provide the best available intel on what types of rounds to expect based on company size, stage, and role level.

## Step 4: Likely Questions

Categorize all discovered and inferred questions:

### Technical
Questions about system design, coding, architecture, domain knowledge.
For each: the question, source, and what a strong answer looks like for this candidate specifically (reference CV proof points).

### Behavioral
Questions about leadership, conflict, collaboration, failure.
For each: the question, source, and which story from `story-bank.md` maps best.

### Role-Specific
Questions tied to the specific job description (archetype-aware).
For each: the question, why they're likely asking it (what JD requirement it maps to), and the candidate's best angle.

### Background Red Flags
Questions the interviewer will probably ask about gaps, transitions, or unusual elements in the candidate's background. Read `modes/_profile.md` and `cv.md` (or `profile-skills.md`) to identify what might raise questions.
For each: the likely question, why it comes up, and a recommended framing (honest, specific, forward-looking and never defensive).

## Step 5: Story Bank Mapping

| # | Likely question/topic | Best story from story-bank.md | Fit | Gap? |
|---|----------------------|-------------------------------|-----|------|
| 1 | ... | [Story Title] | strong/partial/none | |

- **strong**: story directly answers the question
- **partial**: story is adjacent, needs reframing
- **none**: no existing story; flag it for the user

For each gap, suggest: "You need a story about {topic}. Consider: {specific experience from cv.md that could become a STAR+R story}."

If the user wants to draft missing stories, help them build STAR+R format and append to `interview-prep/story-bank.md`.

## Step 6: Technical Prep Checklist

Based on what the company actually tests, not generic advice:

```markdown
- [ ] {topic}. Why: "{evidence from research}"
- [ ] {topic}. Why: "{their blog/product suggests this matters}"
- [ ] {topic}. Why: "{asked in N/M recent Glassdoor reviews}"
```

Prioritize by frequency and relevance to the role. Max 10 items.

## Step 7: Company Signals

Things to say, do, and avoid based on research:

- **Values they screen for:** name them, cite source (careers page, blog, Glassdoor reviews)
- **Vocabulary to use:** terms the company uses internally, which shows you did your homework (e.g., Stripe says "increase the GDP of the internet", Anthropic says "safety" not "alignment")
- **Things to avoid:** specific anti-patterns flagged in interview reviews
- **Questions to ask them:** 2-3 sharp questions that demonstrate you've researched the company, tied to recent news or blog posts discovered in Step 1

## Output

Save the full report to `interview-prep/{company-slug}-{role-slug}.md` with this header:

```markdown
# Interview Intel: {Company} ({Role})

**Report:** {link to evaluation report if exists, or "N/A"}
**Researched:** {YYYY-MM-DD}
**Sources:** {N} Glassdoor reviews, {N} candidate write-ups, {N} other
```

## Post-Research

After delivering the report:

1. Ask the user if they want to draft stories for any gaps found in Step 5
2. If they have a scheduled interview date, note it: "Your interview is in {X} days. Want me to set a reminder to review this prep?"
3. Suggest running `deep` mode if the company research in Step 1 was thin. Deep mode covers strategy, culture, and competitive landscape in more depth
4. Offer practice: `/naija-jobs mock {company} {role}` for a live mock interview, `/naija-jobs aptitude` if there is an online test stage

## Rules

- **NEVER invent interview questions and attribute them to sources.** Inferred questions must be labeled `[inferred from JD]`.
- **NEVER fabricate Glassdoor ratings or statistics.** If the data isn't there, say so.
- **Cite everything.** Every question, every stat, every claim gets a source or an `[inferred]` tag.
- Generate in the language of the JD (EN default).
- Be direct. This is a working prep document, not a pep talk.
