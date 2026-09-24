# Mode: mock — Live Mock Interview With Feedback

Run a realistic practice interview, one question at a time, and give specific feedback after each answer. The goal is that the real interview feels like the second time.

Triggered by `/naija-jobs mock`, `/naija-jobs mock {company} {role}`, or "practise interview with me".

---

## Step 1 — Set up (ask, max 3 questions)

Read, if present: the evaluation report for this company/role in `reports/`, `interview-prep/{company}-{role}.md`, `interview-prep/story-bank.md`, `cv.md` / `profile-skills.md`, `config/profile.yml`.

Then confirm:
1. **Which job?** (company + role, or "general graduate trainee", "general data analyst", etc.)
2. **Which round?** HR/"tell us about yourself" · behavioural/competency · technical · case/presentation · panel · public-sector oral · remote/video
3. **How tough?** Friendly · Realistic · Hard (interrupts, follow-ups, pressure — like a tough Nigerian panel)

Also agree: number of questions (default 6–8) and whether they want feedback after each answer (default) or all at the end.

---

## Step 2 — Build the question set (hidden from the user)

Mix, matched to the round and the listing:
- 1 opener ("Tell us about yourself", "Walk me through your CV")
- 2–3 competency questions mapped to the top JD requirements
- 1–2 role/technical questions (at the right level — entry-level means fundamentals, not trick questions)
- 1 question on a weak spot from the evaluation's gap list (e.g. no full-time experience, HND vs BSc, career gap, relocation)
- 1 motivation/company question ("Why us?", "Where do you see yourself in 5 years?")
- For banks/public sector: 1 current-affairs or ethics question
- End: "Do you have any questions for us?"

Label questions from real research as such; everything else is `[inferred]`. Never claim a question is "what they always ask" without a source.

---

## Step 3 — Run it

- Introduce the interviewer persona briefly (e.g. "I'm Mrs Okonkwo, HR Business Partner. On the panel with me is the Head of Data.").
- Ask **one question at a time**. Wait for the answer. Don't answer for the user.
- In Realistic/Hard mode, ask 1 natural follow-up when the answer is vague ("What exactly did *you* do?", "What was the result in numbers?").
- If the user says "pass" or "help", give a hint (a structure or a relevant story from their CV), then let them try again.

---

## Step 4 — Feedback after each answer

Keep it short and useful:

```
Score: 3/5
✅ Strong: clear situation, good number (300 users)
⚠ Improve: the "Action" part said "we" — say what YOU did; ending was flat
💡 Better version (from your own experience):
   "As CDS project lead, I designed the attendance form and built the Excel dashboard myself…
    Attendance tracking went from paper to same-day reports, and the school still uses it."
```

Scoring guide: 5 = would advance you clearly · 4 = good · 3 = acceptable but forgettable · 2 = weak/unclear · 1 = would hurt you.

Check each answer for: structure (STAR for behavioural), specificity and numbers, relevance to the JD, ownership ("I" vs "we"), length (60–120 seconds spoken ≈ 150–300 words), honesty, and confidence without arrogance.

---

## Step 5 — Debrief

At the end:
- Overall readiness: **Ready / Nearly ready / Needs more practice**, with the reason
- Top 3 strengths to keep
- Top 3 fixes, each with a concrete drill
- Stories that worked → offer to save/improve them in `interview-prep/story-bank.md` (STAR+R format)
- Questions they struggled with → offer another round focused on those
- Their 2–3 best questions to ask the interviewer

Offer: "Another round (harder)?", "Aptitude test practice? → `/naija-jobs aptitude`", "Full company prep? → `/naija-jobs interview`".

---

## Rules

- Never invent experience for the user's "better version" — rewrite only with facts from their CV/profile/answers. If a fact is missing, ask.
- Be honest: praise what works, be direct about what doesn't. No generic "great answer!".
- Keep the persona realistic but respectful; Hard mode is tough, never demeaning.
