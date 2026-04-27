# Mode: compare — Compare Multiple Listings

Compare two or more job listings side by side using the Nigerian scoring dimensions. Rank them and recommend which to pursue first.

---

## Step 1 — Collect the Listings

The user provides 2 or more listings. Each can be:
- A URL — use Playwright to extract JD (`browser_navigate` + `browser_snapshot`)
- Pasted JD text — parse directly
- A report already in `reports/` — read the file

If URLs are provided, extract each JD sequentially (never 2 Playwright sessions in parallel).

---

## Step 2 — Score Each Listing

For each listing, run the full 8-dimension scoring from `modes/_shared.md`:

| Dimension | Weight |
|-----------|--------|
| Role-skill match | 25% |
| Qualification eligibility | 20% |
| NYSC eligibility | 15% |
| Deadline urgency | 10% |
| Applicant competition | 10% |
| Company legitimacy | 10% |
| Location fit | 5% |
| Growth potential | 5% |

Apply the same hard blockers: NYSC required but user hasn't completed = 0.0. Qualification too high = 0.0. Application fee = flag Suspicious.

Read user profile from `profile-skills.md` and `config/profile.yml`.

---

## Step 3 — Side-by-Side Table

Present a comparison table:

```
LISTING COMPARISON — {date}
══════════════════════════════════════════════════════════════════

                        | Listing A           | Listing B           | Listing C
Company                 | {company}           | {company}           | {company}
Role                    | {title}             | {title}             | {title}
Location                | {city/state}        | {city/state}        | {city/state}
Work mode               | {on-site/hybrid/remote} | ...             | ...
Qualification req       | {OND/HND/BSc/MSc}  | ...                 | ...
NYSC requirement        | {Yes/No/Preferred}  | ...                 | ...
Salary range            | {₦X – ₦Y}          | ...                 | ...
Application deadline    | {date or N/A}       | ...                 | ...
Applicant count         | {N or unknown}      | ...                 | ...
─────────────────────────────────────────────────────────────────
Role-skill match        | {X}/25              | {X}/25              | {X}/25
Qualification elig.     | {X}/20              | {X}/20              | {X}/20
NYSC eligibility        | {X}/15              | {X}/15              | {X}/15
Deadline urgency        | {X}/10              | {X}/10              | {X}/10
Applicant competition   | {X}/10              | {X}/10              | {X}/10
Company legitimacy      | {X}/10              | {X}/10              | {X}/10
Location fit            | {X}/5               | {X}/5               | {X}/5
Growth potential        | {X}/5               | {X}/5               | {X}/5
─────────────────────────────────────────────────────────────────
TOTAL SCORE             | {X.X}/5             | {X.X}/5             | {X.X}/5
Legitimacy              | {tier}              | {tier}              | {tier}
Verdict                 | {Recommend/Flag/Skip} | ...               | ...
```

---

## Step 4 — Ranking and Recommendation

List the listings ranked by total score, highest first:

```
Ranking:
  1. {company} — {role} | {score}/5 | {Recommend/Flag}
  2. {company} — {role} | {score}/5 | {Recommend/Flag}
  3. {company} — {role} | {score}/5 | {Skip}

Recommendation:
  → Apply to {company #1} first — {1-sentence reason}.
  → {company #2} is worth applying to in parallel — {1-sentence reason}.
  → Skip {company #3} — {1-sentence reason}.
```

If two listings are within 0.3 points of each other, note the tie and highlight the single deciding dimension.

---

## Step 5 — Application Sequencing Advice

Based on deadlines and competition levels, advise on order and timing:

- Apply to the highest-urgency listing first (closest deadline or fast-closing roles)
- If company legitimacy is lower on one listing, deprioritize effort
- If two listings overlap heavily in skills required, tailor the CV once and adapt lightly for each

---

## Step 6 — Save Reports (optional)

If the user wants full evaluation reports for each listing, run `modes/eval.md` for each and save to `reports/`. Otherwise, the comparison table is the only output.
