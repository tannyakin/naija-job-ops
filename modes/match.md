# Mode: match (Which of These Jobs Fit ME Best?)

Turn a list of listings (the latest scan, the pipeline, or links the user pasted) into a short, honest shortlist ranked against the user's **full** CV and experience, with the reason for each pick and the questions that would sharpen the ranking.

`scan.mjs` already gives each job a keyword-based `fit` score. This mode is the careful second pass that reads the whole CV the way a good recruiter would.

---

## Step 1: Load

1. `cv.md` (if present) and `profile-skills.md`: the user's real experience
2. `config/profile.yml`: eligibility facts (qualification, class of degree, NYSC, date of birth, O'Level), preferences (locations, remote, salary), deal-breakers
3. Candidate jobs, in this order of preference:
   - Jobs the user just pasted or named
   - `data/scan-results.json` → `jobs` where `isNew` is true (top 30 by `rank`)
   - `data/pipeline.md` → unchecked `- [ ]` items

If there is no CV and `profile-skills.md` is thin (no skills or no experience section), **stop and ask** before ranking:
> "I can rank these much better if I know a bit more. Quick questions:
> 1. What have you actually done? Jobs, internships (SIWES/IT), NYSC PPA, projects, volunteering?
> 2. Which tools or skills are you strongest at?
> 3. Any roles you definitely don't want?"

Offer `/naija-jobs cv build` if they have no CV at all.

---

## Step 2: Build the candidate picture (internal, brief)

From the CV/profile, write down (for yourself, not the user):
- **Level:** student / fresh graduate / NYSC / 1–3 yrs / 3–7 yrs / senior
- **Strongest evidence:** the 3–5 most impressive, specific things they have done (with numbers)
- **Real skills** (used at work or in projects) vs **claimed skills** (listed only)
- **Transferable strengths**: e.g. a teacher during NYSC has presentation and training skills; a POS/family-business role shows cash handling, customer service, bookkeeping
- **Hard constraints:** qualification, class of degree, NYSC, age, location limits, salary floor, deal-breakers

---

## Step 3: Score each job (quick, honest)

For each candidate job, read its description (from `scan-results.json`, or open the page if it's missing and the job looks promising).

Give a **Fit** of 1–5 using these questions:
1. **Could they do this job in 3 months?** (skills they've really used, not just listed)
2. **Would they pass the screen?** (qualification, class of degree, NYSC, age, years of experience, certifications)
3. **Is their best evidence relevant here?**
4. **Does it match what they want?** (location/remote, salary, sector, deal-breakers)

Then combine with opportunity signals already on the job:
- `ageHours` < 24 and applicants < 50 → strong "act now" signal
- `flags` present → exclude and list under "Be careful"
- Remote with `eligibility` `no` → exclude; `unclear` → include with a note

**Hard blockers** (age over the limit, class of degree below a strict cutoff, missing required licence, NYSC required but not done) → exclude from the shortlist but list them briefly under "Not eligible" so the user knows why.

**Missing facts:** if a single fact would change a verdict (e.g. the advert's age limit and no date of birth on file), collect it. Ask at most 3 questions at the end, then re-rank if they answer.

---

## Step 4: Present the shortlist

Keep it short: the best 5–8. Quality over volume.

```
Your best matches ({date})
════════════════════════════

1. 🔥 Data Analyst at Moniepoint · Lagos · 2h ago · <25 applicants
   Fit 4.5/5. You've built Power BI dashboards (NYSC PPA) and use SQL daily; entry-level; Lagos ✓
   Watch out: asks for "must have completed NYSC" and you have ✓
   → Apply today. Lead with the attendance dashboard (300 users).

2. Data Analyst at Andela (remote, Africa/Europe) · 20h ago · USD
   Fit 4.0/5. Strong SQL/Python match; remote from Nigeria ✓; contractor via Deel
   Watch out: 4h overlap with CET, which is fine for WAT
   → Apply this week.

...

Stretch (worth it if you want to push)
 - Senior Data Engineer at Kuda: asks 5+ yrs, you have 1.5. Skip unless you have a referral.

Not eligible
 - Access Bank Graduate Trainee: age limit 26 (you're 28).

Be careful
 - "Sales Executive" at Bright Future Ventures: asks for a ₦5,000 fee → scam signal.

Questions that would sharpen this:
 1. Is your SIWES at Dangote counted as 6 or 12 months?
 2. Would you take a contract (no HMO/pension) for a USD role?
```

Then offer:
- "Run the full evaluation on #1–#3?" → `modes/eval.md` for each (or `/naija-jobs pipeline`)
- "Tailor your CV and cover letter for #1?" → `/naija-jobs pdf` / `/naija-jobs cover-letter`
- "Save these answers to your profile?" → update `config/profile.yml` / `profile-skills.md` after the user agrees

---

## Rules

- Never inflate fit to make the list look better. An empty "best matches" with honest reasons beats a padded one.
- Never recommend a listing with a scam flag.
- Never suggest misrepresenting age, grades, NYSC status, or experience.
- Prefer fresh + low-competition roles when fit is similar. The user asked for jobs "before everyone else applies".
- When the list is mostly poor fits, say what to change: broader keywords, different sources, or a skill gap worth closing (suggest `/naija-jobs training`).
