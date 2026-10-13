# Pelican University – data dictionary

Portfolio case: an online course portfolio at a fictional school, **Pelican University**.
Course data is **synthetic**. Market data is **real** (DBH table 124) and describes study
*programmes*, not courses.

Period: **Høst 2023 → Vår 2026** (6 semesters). Grain of the main table: **one course per semester**.

---

## 1. Files

| File | Rows | Real or synthetic | Used by the website? |
|---|---|---|---|
| `data/dim_course.csv` | 40 | Synthetic (NUS + pass rate reference are real) | Yes – filters, labels |
| `data/dim_semester.csv` | 6 | Calendar | Yes – axis labels |
| `data/fact_course_semester.csv` | 235 | Synthetic | Yes – course table (wide, scrollable) |
| `data/fact_enrollment.csv` | 30 692 | Synthetic | **No** (4 MB). Source for retention analysis; aggregates are in `results.json` |
| `data/market_nus.csv` | 4 112 | **Real** (DBH 124, 2021–Vår 2026) | Yes – market growth chart |
| `data/course_summary.csv` | 40 | Derived | Yes – one row per course with every metric, class and verdict |
| `data/results.json` | – | Derived | Yes – everything the charts draw (Q1, Q3, Q6, heatmap, market) |
| `scripts/build_market.py` | | | Builds `market_nus.csv` from DBH 124 |
| `scripts/generate_data.py` | | | Builds the four synthetic tables (seed 42 → same output every run) |
| `scripts/analyze.py` | | | Builds `course_summary.csv` and `results.json` |

Run order: `build_market.py` → `generate_data.py` → `analyze.py`.
Source files expected in `source/`: `DBH-tabell124.csv`, `Eksamensdata_med_NUS.csv`, `nus_clean.csv`.

### Keys and relationships

```
dim_semester.semester_key ─┐
                           ├─< fact_course_semester.course_semester_key >─┬─< fact_enrollment
dim_course.course_code ────┘     (course_code-semester_code-year)          │   (many students per course-semester)
dim_course.nus_lvl4_code ──────< market_nus.nus_code (nus_level = 4)        │
course_summary.course_code  = dim_course.course_code (1:1)                  │
```

- `course_semester_key` = `coursecode-semestercode-year`, e.g. `LED2101-H-2023`. Hyphens are safe.
- `semester_key` = `H-2023` / `V-2024`. **Do not sort on the text keys** – sort on `period_index`
  (1 = Høst 2023 … 6 = Vår 2026; market data goes back to −4 = Vår 2021).
- Semester codes: `H` = Høst (autumn), `V` = Vår (spring).

---

## 2. dim_course (one row per course)

| Column | Type | Description |
|---|---|---|
| course_code | text | Course code, e.g. `TEK2105`. Prefix = area (LED, TEK, HEL, DES) |
| course_name | text | Course name (Norwegian) |
| institutt | text | Department, same four as the existing site |
| fagomrade | text | Area: Ledelse, Teknologi, Helse, Design |
| portefolje | text | Portfolio (8 values, same as the existing site) |
| nus_code | text(6) | Real NUS level-5 code from `nus_clean.csv`. Keep as text (leading zeros) |
| nus_lvl3_code / nus_lvl3_name | text | NUS faggruppe |
| nus_lvl4_code / nus_lvl4_name | text | NUS utdanningsgruppe – **join key to the market data** |
| nus_lvl5_name | text | NUS name |
| studiepoeng | number | 7.5 or 15 |
| price_nok | int | 9 500 (7.5 sp) or 12 000 (15 sp) |
| launch_semester_key | text | When the course started. Two courses launch inside the window |
| launch_year | int | Year of launch |
| subject_volatility | text | Høy / Middels / Lav – how fast the subject changes. **Set per portfolio** |
| expected_tickets_per_semester | number | Normal revision tickets for the portfolio: Høy 8, Middels 4, Lav 1.5 |
| development_cost_nok | int | One-time development cost (paid in the launch semester) |
| course_leader_level | text | Emneansvarlig competence: Master, PhD, Professor |
| redaktor | text | Responsible editor, R1–R5 (8 courses each). No pattern planted |
| ref_pass_rate_nus | number | **Real** national pass rate (bestått / møtt) for the NUS code, lower-level courses 2023–2025 |
| ref_pass_rate_source | text | `NUS nivå 5`, or `NUS nivå 3` when level 5 had < 500 exam candidates |
| ref_pass_rate_attended_n | int | Number of real exam candidates behind the reference |
| emne_status | text | Aktiv / Inaktiv (status today) |
| planted_story | text | What was planted in this course (see §8). **Remove before publishing** if you want visitors to find the stories themselves |

## 3. dim_semester

| Column | Description |
|---|---|
| semester_key | `H-2023` … `V-2026` |
| semester_code | H / V |
| year | Calendar year |
| semester_label | `Høst 2023` (display label) |
| period_index | 1–6, chronological |
| start_date | First teaching day (Monday) |
| exam_date | Start + 20 weeks |
| academic_year | `2023/2024` |

## 4. fact_course_semester (one row per course per semester – wide)

235 rows = 40 courses × 6 semesters − rows before launch (TEK2902 from Høst 2024, DES2810 from Vår 2025).
An inactive course keeps its rows with 0 students, because the course leader is still paid.

**Identity and attributes**

| Column | Description |
|---|---|
| course_semester_key | Primary key, `LED2101-H-2023` |
| course_code, course_name, semester_key, semester_code, year, semester_label, period_index | As in the dimensions (repeated so the website needs no joins) |
| institutt, fagomrade, portefolje, nus_code, studiepoeng, price_nok | Repeated from dim_course |
| emne_status | Aktiv / Inaktiv **in that semester** |
| fase | Utvikling (first 2 semesters after launch), Drift, Utfasing (inactive) |
| course_age_semesters | Semesters since launch (0 = launch semester) |

**Students** (aggregated from fact_enrollment, so the two tables always agree)

| Column | Definition |
|---|---|
| students_enrolled | Enrolments that semester (incl. those who later dropped out) |
| students_refunded | Dropped in week 1–2 → refunded (angrerett, 14 days) |
| students_dropped | Dropped out before the exam (incl. refunded) |
| students_completed | enrolled − dropped |
| students_attended_exam | Sat the exam |
| students_no_show | completed − attended (stayed, but did not sit the exam) |
| students_passed | Passed |
| students_returning | Had taken an earlier Pelican course (returning customer) |
| students_programme | Taking the course as part of a study programme (others: single course) |
| dropout_rate | dropped / enrolled |
| pass_rate | passed / attended_exam (same definition as the real DBH reference) |
| completion_rate | passed / enrolled |

**Surveys** (scale 1–5)

| Column | Definition |
|---|---|
| student_survey_score | Mean student rating. **Empty** when status ≠ OK |
| student_survey_responses | Number of responses (≈ 35 % of those who completed) |
| student_survey_status | `OK`, `For få svar` (< 5 responses – suppressed), `Ikke gjennomført` (survey not run), `Ingen studenter` |
| course_leader_score | Emneansvarlig's assessment of the course (one decimal) |
| editorial_score | Redaktør's assessment of the course (one decimal) |

**Costs and revenue** (NOK per semester)

| Column | Rule |
|---|---|
| exam_type | Hjemmeeksamen, Skoleeksamen, Muntlig eksamen, Mappeinnlevering |
| exam_cost_per_student_nok | Hjemmeeksamen 2 500 · Skoleeksamen 7 500 · Muntlig 7 500 (3×) · Mappeinnlevering 2 000 (*assumption*) |
| exam_cost_nok | attended_exam × rate |
| advisers_internal / advisers_external | Total advisers = ceil(enrolled / 30); split by the course's internal share (varies by course, can be 0 or 1) |
| adviser_cost_nok | Internal 45 000, external 30 000 per adviser per semester (*assumption*; externals cheaper as stated) |
| course_leader_level | Master / PhD / Professor |
| course_leader_cost_nok | Fixed per semester, also with 0 students: 40 000 / 55 000 / 70 000 (*assumption*) |
| revision_tickets | Tickets the editor sent to course developers that semester |
| revision_cost_nok | tickets × 4 000 (*assumption*) |
| development_cost_nok | One-time; non-zero only in the launch semester (only TEK2902 and DES2810 launch inside the window) |
| operating_cost_nok | exam + advisers + course leader + revision |
| total_cost_nok | operating + development |
| revenue_nok | Σ paid by students (refunded students pay 0) |
| contribution_nok | revenue − operating cost (dekningsbidrag, development excluded) |
| cost_per_student_nok | operating cost / enrolled |

## 5. fact_enrollment (one row per student per course per semester)

| Column | Description |
|---|---|
| enrollment_id | `E0000001` – primary key |
| student_id | `S000001` – anonymous; the same id appears again when a student buys another course |
| course_code, semester_key, course_semester_key, period_index | Links |
| enrolled_date | Date of purchase (3–40 days before start) |
| age_group | 20–29, 30–39, 40–49, 50+ |
| student_type | Enkeltemne / Studieprogram |
| is_returning_customer | True if the student had an earlier Pelican course |
| prior_courses_count | Number of earlier courses |
| adviser_type | Intern / Ekstern |
| outcome | Bestått, Ikke bestått, Ikke møtt, Sluttet |
| dropped_out | True/False |
| dropout_week | Teaching week of dropout, 1–19 (empty if not dropped) |
| dropout_date | Date of dropout |
| refunded_angrerett | Dropped in week 1–2 → full refund |
| attended_exam, passed | True/False |
| paid_nok | Price paid (0 if refunded) |

## 6. market_nus (REAL – DBH table 124)

One row per semester × NUS group, for NUS level 3 and level 4 (`nus_level` column). Vår 2021 → Vår 2026.

| Column | Description |
|---|---|
| semester_key, semester_label, year, semester_code, period_index | period_index 1 = Høst 2023 (earlier semesters ≤ 0) |
| in_pelican_window | True for Høst 2023 – Vår 2026 |
| nus_level | 3 or 4 |
| nus_code, nus_name | NUS group |
| national_all | All registered students (Studentkategori = S), all organisation types |
| national_online | Online only, using Kip's cleaning rule (below) |
| oslomet_all / oslomet_online | OsloMet only. **Only real institution named anywhere in the case** |
| *_idx | Index, Høst 2023 = 100 (empty when base is 0) |

**Online rule** (same as the Power Query step): a row is online if `Organisering` = Nettbasert, or
Avdelingsnavn contains "nett", or Studieprogramkode ends with `_N`, or Studieprogramnavn contains
"nett-", " nettstudium", "nettbasert", "årsstudium, nett", "-7, nett", "- 10, nett" or "1 nett 5".
The online flag is still incomplete, so **the analysis uses `national_all`**. Online growth is shown as extra info.

**How to read it:** compare **growth rates**, never levels. DBH counts programme students; Pelican counts course
enrolments. Høst is always larger than Vår (seasonality), so compare a full year to a full year, or Høst to Høst.

## 7. course_summary and results.json (derived)

### Windows
- **Baseline** = Høst 2023 + Vår 2024. **Latest** = Høst 2025 + Vår 2026. Full years, so seasonality cancels out.
- New course TEK2902: baseline = its first two semesters. DES2810 (launched Vår 2025): too little history, not judged.

### The nine signals (bigger = better after direction is applied)

| Key | Label | Change measured as | Good when | Threshold |
|---|---|---|---|---|
| students | Studenter | % change | up | ±5 % |
| pass_rate | Bestått | percentage points | up | ±3 pp |
| dropout_rate | Frafall | percentage points | down | ±3 pp |
| student_survey | Studentundersøkelse | % change of response-weighted mean | up | ±5 % |
| course_leader | Emneansvarlig | % change | up | ±5 % |
| editorial | Redaksjon | % change | up | ±5 % |
| cost_per_student | Kostnad per student | % change (excl. revision, so it is not counted twice) | down | ±5 % |
| revision_cost | Revisjonskostnad | % change | down | ±5 % **and** ≥ max(4, 2 × expected tickets) tickets changed |
| market_relative | Vekst mot marked | course growth % − market growth % (NUS lvl 4) | up | ±5 pp |

Why rates use percentage points: dropout 10 % → 15 % is "+50 %" relative, which exaggerates.
Why revision has an extra floor: low-change portfolios expect 1–2 tickets a semester; 1 → 3 tickets is "+200 %" but noise.
"Large" = change ≥ 2 × threshold (dark cell in the heatmap); under threshold = neutral (show "·").

### Matrix (Q6)
- **X = net score** = signals improved − signals worsened (−9 … +9). Bigger is better.
- **Y = students** in the latest window (Høst 2025 + Vår 2026).
- **Class**: ≥ +3 Skalér · +2 God utvikling · −1…+1 Stabil · −2 Følg med · ≤ −3 Handle nå.
  A course at −2 that is in the bigger half (students ≥ median) is upgraded to **Handle nå** – big and falling is where the stake is.
- Not judged: courses averaging < 25 students per semester ("For få studenter til å vurdere"), DES2810 ("For kort historikk"), the inactive course.

### Other derived columns in course_summary.csv

| Column | Meaning |
|---|---|
| chg_* | Change per signal (units as above) |
| *_latest | Level in the latest window |
| market_growth_pct / market_growth_online_pct | Real market growth for the course's NUS lvl 4, same windows |
| exam_change | e.g. `Hjemmeeksamen → Skoleeksamen` if the exam form changed |
| signals_good / signals_bad / net_score / good_metrics / bad_metrics | Matrix inputs |
| matrix_class, big_course, data_note | Matrix output and why a course is not judged |
| revision_ratio_vs_portfolio | Course tickets ÷ (portfolio expectation × semesters). ≥ 1.8 → `revision_outlier_flag` |
| revision_spike_semesters | Semesters with ≥ max(2.5 × expected, expected + 5) tickets (a "revision wave") |
| survey_change_after_revision | Mean survey after the first wave − mean before (points) |
| revision_verdict | `Revisjon med effekt` (≥ +0.2 points) / `Revisjon uten effekt` |
| cost_quality_pattern | Cost per student × student survey, 2×2: Effektivisering, Sparing som svekker, Investering som virker, Kostnad uten effekt, Bedre for samme eller lavere kostnad, Kvalitet faller, Uendret |
| decline_type | For courses with students ≤ −5 %: `Kvalitetsdrevet` (survey fell first), `Markedsdrevet – taper andel` (market grows, survey stable), `Uavklart` |
| survey_onset / enrolment_onset / lead_semesters | Q3 onset semesters and the gap between them |
| verdict | One generated sentence per course (Norwegian), for the detail panel |

### Onset rule (Q3)
A metric's onset is the **first semester it crossed its threshold and stayed across it in every later semester**.
Compared with the course's own first two semesters, except enrolment, which is compared with the same semester a year earlier (seasonality).
Thresholds: survey ≤ −0.25 points · editor ≤ −0.25 · dropout ≥ +4 pp · pass ≤ −4 pp · cost/student ≥ +10 % · enrolment ≤ −10 % year on year.

### results.json – structure

| Key | Content | Draws |
|---|---|---|
| `meta` | periods, all `rules`, metric list, data note | Footnotes, legends |
| `q1_dropout` | overall rate, share of dropouts in weeks 1–6 and 1–2, refunded revenue, dropouts per week, retention curves per segment (`active_pct_by_week`, weeks 0–20), lifts, per period, per course | Q1: "Who drops out, and when?" |
| `q3_sequences.courses[]` | per course: ordered `events` (metric, onset semester, value) | Timeline panel ("one problem led to the next") |
| `q3_sequences.early_warning` | share of courses whose enrolment fell after a survey drop, vs. without | The early-warning card |
| `q3_sequences.declines[]` | decline type per falling course | Two kinds of decline |
| `q6_matrix.points[]` | x_net_score, y_students_latest, class, verdict | The bubble matrix |
| `q6_matrix.headlines` | act-now list, scale list, students lost in market-driven declines, class counts | Side panel text |
| `heatmap[]` | course × metric: change, unit, goodness (+1 green / −1 red / 0 neutral), magnitude | "What changed" heatmap |
| `market[]` | per NUS lvl 4: national, OsloMet and Pelican students per semester | Market growth chart |

Loading in script.js:

```js
const results = await fetch("data/results.json").then(r => r.json());
// fetch does not work from file:// – use GitHub Pages or `python -m http.server`
```

---

## 8. Planted patterns (answer key – keep off the public page)

| Story | Courses | What the data shows |
|---|---|---|
| Market-driven decline | LED2701, LED2705, LED2210 | The three biggest courses lose 22–28 % of students while the real market for økonomisk-administrative fag grows ~10 %. Survey stable. ~550 students lost |
| Quality-driven decline (early warning) | TEK2611, HEL2417, DES2406 (+ LED2608) | Student survey falls 1–2 semesters **before** enrolment |
| Revision without effect | TEK2414, DES2615 | ~3× the portfolio's normal tickets, survey flat |
| Revision that worked | HEL2513 | Revision wave Høst 2024 → survey up Vår 2025 → students up Høst 2025 |
| Savings that hurt | LED2608 | Internal advisers replaced by external (cost ↓), survey and pass rate ↓ |
| Efficiency | TEK2209 | Same switch to externals, survey stable/up |
| Exam form change | TEK2507 | Home → school exam from Vår 2025: cost per student ~2×, pass rate −11 pp |
| Stars | TEK2105, LED2402, LED2720, HEL2112, HEL2902, TEK2312 … | Growing, stable or better quality |
| Messy data | HEL2810, DES2905 (tiny, surveys suppressed), LED2510 (survey not run Vår 2025), DES2950 (inactive, still costs 55 000 kr/semester), TEK2902/DES2810 (new) | |

**Dropout (Q1):** 13.7 % drop out; 70 % of them in weeks 1–6 and a third within angrerett (weeks 1–2).
Programme students drop out 36 % less than single-course students; returning customers 45 % less; age 20–29 14 % more.
Telecom translation: early-life churn, bundled customers churn less.

**Causation caveat:** every pattern above is a *sequence* or a *co-movement*, not proof of cause. The site should say so.
A sequence (survey falls, then enrolment) is stronger evidence than a correlation, but still not an experiment.

## 9. Assumptions I made (change in `generate_data.py`)

- Cost rates marked *assumption* above (adviser 45 000 / 30 000, course leader 40 000 / 55 000 / 70 000, ticket 4 000, mappe exam 2 000, development 300 000 / 450 000 / 650 000 ± 15 %).
- Vår intake = 85 % of Høst. Survey response rate 35 %. Exam attendance 92 % of those who stay.
- 22 % of enrolments are returning customers; 35 % are programme students.
- Revision ticket rate is set per **portfolio** (Ledelse, Teknologi, Data og IT, Helse og livsmestring = high; Design, Kreative fag = medium; Økonomi og styring, Pedagogikk og veiledning = low).
- Digital markedsføring sits in Økonomi og styring with NUS 642207 (markedsføring).
