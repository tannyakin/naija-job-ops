# Mode: tutorial (Learn naija-job-ops in 10 Minutes)

An interactive walkthrough that teaches the user how to get the best out of naija-job-ops by **doing**, not reading. Each lesson is short, uses the user's real profile where possible, and ends with a checkpoint.

Triggered by `/naija-jobs tutorial`, `/naija-jobs tutorial {lesson number or topic}`, `/naija-jobs help`, or "how do I use this?".

---

## How to run the tutorial

1. Check setup silently (same checks as onboarding). Note what exists: `profile-skills.md`, `config/profile.yml`, `cv.md`, `portals.yml`, `data/applications.md`, any `reports/`.
2. Greet briefly and show the lesson map with ✅ on lessons already effectively done (e.g. profile exists → Lesson 1 ✅):

```
naija-job-ops tutorial. Pick a lesson, or say "start" to go in order

 1. Set up your profile          (2 min)  ✅
 2. Your CV: build or fix it    (3 min)
 3. Find fresh jobs              (2 min)  ← LinkedIn + Nigerian boards + remote
 4. Pick the right ones          (2 min)
 5. Evaluate a job properly      (2 min)
 6. CV + cover letter for a job  (3 min)
 7. Fill application forms       (2 min)
 8. Tests and interviews         (3 min)
 9. Track and follow up          (1 min)
10. Pro tips + daily routine     (1 min)
```

3. Teach one lesson at a time: **what it does → why it matters → try it now → checkpoint**. Keep each message short. Wait for the user before moving on.
4. If the user is in a hurry, offer the **Quick Start** (bottom of this file) instead.
5. Never skip the "try it now" step when the user's data allows it. Doing beats reading.

---

## Lesson 1: Set up your profile

**What:** Your profile is how the system knows what "a good job for you" means. Everything else depends on it.
**Why:** Nigerian adverts have hard cut-offs (NYSC, class of degree, age limits, O'Level). The system checks them automatically, but only if it knows your details.
**Try it:** If no profile exists → run `/naija-jobs onboard` now. If it exists → show a 5-line summary of `config/profile.yml` and ask "Anything out of date?"
**Checkpoint:** profile-skills.md and config/profile.yml exist, with target roles and skills filled in.
**Tip:** You can say things like "add Abuja to my locations" or "I'm now done with NYSC" any time. No need to edit files.

## Lesson 2: Your CV

**What:** `cv.md` is your master CV. Tailored versions for each job are generated from it; the master is never overwritten.
**Why:** A strong master CV makes every tailored CV and cover letter better.
**Try it:**
- No CV → `/naija-jobs cv build` (a guided chat that also finds experience you didn't know counts: SIWES, NYSC PPA/CDS, family business, church/mosque roles, tutoring, freelancing)
- Has a CV → `/naija-jobs cv edit` for an ATS audit
**Checkpoint:** cv.md exists.
**Tip:** Numbers win. "Taught 160 students" beats "taught students".

## Lesson 3: Find fresh jobs

**What:** `/naija-jobs scan` searches LinkedIn, Jobberman, MyJobMag, HotNigerianJobs, NgCareers, Jobgurus, Indeed Nigeria, remote boards open to Nigeria, and company career pages, all at once.
**Why:** Recruiters often shortlist the first applicants. A job posted 2 hours ago with 12 applicants is worth far more than one posted 3 weeks ago with 900.
**Try it:** Run a small live scan for one of their target roles:
`node scan.mjs --keywords "{their role}" --source linkedin --since 24h --top 5`
Walk through the output: 🔥 marker, posted age, applicant count, fit score, warnings.
**Variations to show:**
- `/naija-jobs linkedin {role}`: LinkedIn only; say "last hour" for the very newest
- `/naija-jobs remote {role}`: remote roles you can take from Nigeria (USD-paid included)
- `/naija-jobs scan {any field}`: nursing, civil engineering, HR, law… any field
**Checkpoint:** they've seen a ranked list.
**Tip:** Scan every morning. `node scan.mjs` costs no AI tokens and can run on a schedule.

## Lesson 4: Pick the right ones

**What:** `/naija-jobs match` re-ranks scan results against your *whole* CV and tells you why each one fits (or doesn't), what's blocking you, and what to do first.
**Why:** Five targeted applications beat fifty generic ones. The system will tell you honestly when a job isn't worth it.
**Try it:** Run `/naija-jobs match` on the scan from Lesson 3.
**Checkpoint:** a shortlist of 3–5 jobs.
**Tip:** When it asks you a question (e.g. your date of birth for an age-limited scheme), answer once. It's saved and never asked again.

## Lesson 5: Evaluate a job properly

**What:** Paste any job link or advert text and you get a full report: fit, eligibility (NYSC, degree class, age, O'Level), competition, company legitimacy and scam check, and a score out of 5.
**Try it:** Paste the #1 job from the shortlist (or any advert they have).
**Checkpoint:** a report saved in `reports/` and a row in the tracker.
**Tip:** Below 3.5/5 → usually don't apply. Any fee request → it's a scam, full stop.

## Lesson 6: CV and cover letter for a specific job

**What:** `/naija-jobs pdf` builds a tailored CV (reordered for the job, JD keywords added honestly) and a cover letter as PDFs. `/naija-jobs cover-letter` writes just the letter, as a PDF, a paste-in text box answer, or an email.
**Try it:** Generate the cover letter for their top job (email or PDF format, whichever that job needs).
**Checkpoint:** a file in `output/`.
**Tip:** Always read it before sending. You make the final call; the system never submits anything for you.

## Lesson 7: Application forms and surveys

**What:** `/naija-jobs apply` drafts answers for application forms: "why this company", screening questions, salary expectations, NYSC and O'Level fields, essay questions with word limits.
**Why:** Portals like bank graduate schemes ask 10–20 questions; good answers take hours by hand.
**Try it:** Paste 2–3 questions from any application form.
**Tip:** It answers screening questions honestly. It won't answer live aptitude or personality tests for you. That's what Lesson 8 is for.

## Lesson 8: Tests and interviews

**What:**
- `/naija-jobs aptitude`: practice numerical, verbal, logical, SJT and Excel tests in the style of SHL/Workforce/TestGorilla, with a revision plan
- `/naija-jobs interview {company}`: research how that company interviews (bank assessment centres, FMCG group exercises, Big 4 cases, public-sector panels)
- `/naija-jobs mock`: a live mock interview with feedback after every answer
**Try it:** 3 practice questions from `/naija-jobs aptitude`, or one mock interview question ("Tell us about yourself").
**Tip:** Build your story bank once (5–8 STAR stories); it gets reused for every interview.

## Lesson 9: Track and follow up

**What:** `/naija-jobs tracker` shows every job you've evaluated and applied for. `/naija-jobs followup` tells you who to chase and drafts the message.
**Try it:** Show their tracker. If they applied somewhere, say "I applied to {company}" → status updates.
**Tip:** Follow up once after 7–10 days. Politely. Most people never do.

## Lesson 10: Pro tips and a daily routine

```
Daily (10–15 min)
  1. /naija-jobs scan                → fresh jobs (or run node scan.mjs on a schedule)
  2. /naija-jobs match               → pick 1–3
  3. Paste the best one              → evaluate
  4. /naija-jobs pdf                 → tailored CV + cover letter
  5. Apply yourself, then say "I applied to X"

Weekly
  - /naija-jobs followup             → chase applications
  - /naija-jobs patterns             → what's working, what isn't
  - Update your profile when anything changes
```

More tips:
- **Speed matters on LinkedIn:** `/naija-jobs linkedin {role}` with "last hour" finds roles before the crowd.
- **Graduate trainee season** is roughly July–November. Start aptitude practice before it opens.
- **Remote from Nigeria:** check "worldwide/Africa/EMEA" eligibility; the scanner filters out US-only roles.
- **Scams:** fees, Gmail/Yahoo application emails, WhatsApp-only contact, BVN requests, hotel "interviews". The system flags these.
- **Make it yours:** ask it to add companies, change scoring priorities, add a job board, or ignore certain roles. It edits its own config.

Finish with: "That's the tour. Want to start your first real application now? Paste a job link or say `scan`."

---

## Quick Start (for users in a hurry)

```
1. /naija-jobs onboard                 set up your profile (2 min)
2. /naija-jobs scan {your role}         fresh jobs from LinkedIn + Nigerian boards + remote
3. /naija-jobs match                    which ones fit you best
4. paste a job link                     full evaluation + score
5. /naija-jobs pdf                      tailored CV + cover letter
6. /naija-jobs apply                    form answers (you submit)
Help any time: /naija-jobs tutorial {topic}
```

---

## Topic jump

If the user asks `/naija-jobs tutorial {topic}`, go straight to the matching lesson: profile/onboard → 1, cv/resume → 2, scan/linkedin/remote/find → 3, match/fit → 4, eval/score → 5, pdf/cover letter → 6, apply/forms/survey → 7, test/aptitude/interview/mock → 8, tracker/followup → 9, tips/routine → 10.
