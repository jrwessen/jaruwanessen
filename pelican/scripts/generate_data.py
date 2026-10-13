"""
Generate the SYNTHETIC Pelican University dataset (Høst 2023 – Vår 2026).

Outputs (data/):
  dim_course.csv            one row per course (40)
  dim_semester.csv          one row per semester (6)
  fact_enrollment.csv       one row per student per course per semester
  fact_course_semester.csv  one row per course per semester (wide) - aggregated from
                            fact_enrollment + surveys + costs

Everything here is fictional except two calibration inputs:
  - NUS codes/names come from nus_clean.csv
  - each course's baseline pass rate is the real national pass rate for its NUS
    code (DBH exam data, lower-level courses, 2023–2025)

Planted patterns are listed in PLANTED below and in DATA_DICTIONARY.md.
Run: python scripts/generate_data.py   (seeded -> identical output every run)
"""
from pathlib import Path
import math
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SRC, OUT = ROOT / "source", ROOT / "data"
rng = np.random.default_rng(42)

# ── Calendar ────────────────────────────────────────────────────────────────
SEMESTERS = [  # period_index, code, year, start date
    (1, "H", 2023, "2023-08-21"), (2, "V", 2024, "2024-01-15"),
    (3, "H", 2024, "2024-08-19"), (4, "V", 2025, "2025-01-13"),
    (5, "H", 2025, "2025-08-18"), (6, "V", 2026, "2026-01-12"),
]
N_P = len(SEMESTERS)
SEASON = {"H": 1.0, "V": 0.85}          # spring intake is smaller
SEM_WEEKS = 20                          # teaching weeks before exam

# ── Prices and cost rates (NOK) ─────────────────────────────────────────────
PRICE = {15.0: 12000, 7.5: 9500}
EXAM_COST = {"Hjemmeeksamen": 2500, "Skoleeksamen": 7500,
             "Muntlig eksamen": 7500, "Mappeinnlevering": 2000}   # mappe = assumption
ADVISER_COST = {"Intern": 45000, "Ekstern": 30000}                  # per adviser per semester
STUDENTS_PER_ADVISER = 30
LEADER_COST = {"Master": 40000, "PhD": 55000, "Professor": 70000}  # fixed per semester
TICKET_COST = 4000
TICKET_RATE = {"high": 8.0, "medium": 4.0, "low": 1.5}              # tickets per semester
DEV_COST = {"high": 650000, "medium": 450000, "low": 300000}        # one-time at launch

INSTITUTT = {"Ledelse": "Institutt for ledelse og økonomi", "Teknologi": "Institutt for teknologi",
             "Helse": "Institutt for helsevitenskap", "Design": "Institutt for design og kreative fag"}
PORTFOLIO_VOLATILITY = {  # same ticket rate for every course in a portfolio
    "Ledelse": "high", "Økonomi og styring": "low", "Teknologi": "high", "Data og IT": "high",
    "Helse og livsmestring": "high", "Pedagogikk og veiledning": "low",
    "Design": "medium", "Kreative fag": "medium"}

# ── Helpers for per-period paths ───────────────────────────────────────────
def growth(g):          # steady annual growth g -> multiplier per period
    return [(1 + g) ** ((p - 1) / 2) for p in range(1, N_P + 1)]

ZERO = [0.0] * N_P
ONES = [1.0] * N_P
MARKET_DECLINE = [1.00, 0.98, 0.90, 0.84, 0.78, 0.72]

# ── Courses ────────────────────────────────────────────────────────────────
# code, name, area, portfolio, nus5, sp, launch_key, base Høst intake, survey_base,
# exam_type, leader_level, internal_share, dropout_base, overrides
C = []
def course(code, name, area, portfolio, nus, sp, launch, base, survey, exam, leader, internal,
           dropout=0.16, **kw):
    C.append(dict(code=code, name=name, area=area, portfolio=portfolio, nus=nus, sp=sp,
                  launch=launch, base=base, survey=survey, exam=exam, leader=leader,
                  internal=internal, dropout=dropout, **kw))

# Ledelse – Ledelse
course("LED2101", "Endringsledelse i praksis", "Ledelse", "Ledelse", "641124", 15.0, "H-2019", 210, 4.2, "Hjemmeeksamen", "PhD", 0.5, enrol=growth(0.08))
course("LED2210", "Prosjektledelse", "Ledelse", "Ledelse", "641124", 15.0, "H-2017", 380, 4.1, "Mappeinnlevering", "Professor", 0.3, enrol=MARKET_DECLINE, story="Markedsdrevet nedgang")
course("LED2315", "Strategisk HR", "Ledelse", "Ledelse", "641124", 7.5, "V-2020", 90, 3.9, "Hjemmeeksamen", "Master", 1.0, enrol=growth(-0.03))
course("LED2402", "Bærekraftig virksomhetsstyring", "Ledelse", "Ledelse", "641124", 7.5, "H-2022", 70, 4.0, "Hjemmeeksamen", "PhD", 0.5, enrol=growth(0.20), survey_path=[0, 0.05, 0.1, 0.15, 0.25, 0.3])
course("LED2510", "Forhandling og påvirkning", "Ledelse", "Ledelse", "641124", 7.5, "H-2021", 120, 4.4, "Muntlig eksamen", "PhD", 1.0, enrol=growth(0.15), survey_missing=[4])
# Ledelse – Økonomi og styring
course("LED2608", "Operativ økonomistyring", "Ledelse", "Økonomi og styring", "641104", 7.5, "H-2018", 60, 3.9, "Hjemmeeksamen", "PhD", 1.0,
       enrol=[1, 1, 1, 0.97, 0.9, 0.85], internal_path=[1, 1, 1, 0, 0, 0], survey_path=[0, 0, 0, -0.35, -0.45, -0.5], story="Sparing som svekker")
course("LED2701", "Bedriftsøkonomi grunnkurs", "Ledelse", "Økonomi og styring", "641104", 15.0, "H-2016", 420, 3.9, "Skoleeksamen", "Professor", 0.3, enrol=MARKET_DECLINE, story="Markedsdrevet nedgang")
course("LED2705", "Regnskap og årsoppgjør", "Ledelse", "Økonomi og styring", "641125", 15.0, "H-2016", 340, 3.8, "Skoleeksamen", "PhD", 0.5, enrol=MARKET_DECLINE, story="Markedsdrevet nedgang")
course("LED2710", "Finansregnskap med analyse", "Ledelse", "Økonomi og styring", "641125", 7.5, "V-2019", 110, 3.8, "Hjemmeeksamen", "PhD", 0.5, enrol=growth(0.0))
course("LED2720", "Digital markedsføring", "Ledelse", "Økonomi og styring", "642207", 7.5, "H-2021", 150, 4.2, "Mappeinnlevering", "Master", 0.0, enrol=growth(0.10))
# Teknologi – Teknologi
course("TEK2414", "Informasjonssikkerhet", "Teknologi", "Teknologi", "654101", 7.5, "H-2019", 150, 4.0, "Hjemmeeksamen", "PhD", 1.0, enrol=growth(-0.02),
       ticket_path=[1, 1, 3, 3.2, 3, 3], survey_path=[0, 0, 0, -0.05, 0, -0.05], editor_base=3.3, story="Revisjon uten effekt")
course("TEK2611", "Digital arbeidsflyt", "Teknologi", "Teknologi", "654101", 7.5, "V-2019", 80, 4.0, "Hjemmeeksamen", "Master", 0.3,
       enrol=[1, 1.02, 1.03, 0.86, 0.74, 0.66], survey_path=[0, 0, -0.45, -0.6, -0.7, -0.75], editor_path=[0, 0, -0.3, -0.4, -0.4, -0.4], story="Kvalitetsdrevet nedgang")
course("TEK2701", "Skytjenester og infrastruktur", "Teknologi", "Teknologi", "654101", 7.5, "H-2021", 95, 4.1, "Mappeinnlevering", "PhD", 0.5, enrol=growth(0.10))
course("TEK2805", "Programmering med Python", "Teknologi", "Teknologi", "654101", 15.0, "H-2018", 300, 4.0, "Skoleeksamen", "PhD", 0.7, enrol=growth(0.05), dropout=0.20)
course("TEK2950", "Webutvikling", "Teknologi", "Teknologi", "654101", 7.5, "V-2020", 130, 3.9, "Mappeinnlevering", "Master", 0.3, enrol=growth(0.0))
# Teknologi – Data og IT
course("TEK2105", "Datavisualisering", "Teknologi", "Data og IT", "654199", 7.5, "H-2020", 170, 4.4, "Mappeinnlevering", "PhD", 0.5, enrol=growth(0.18), survey_path=[0, 0, 0.05, 0.1, 0.1, 0.15])
course("TEK2209", "Grunnleggende dataanalyse", "Teknologi", "Data og IT", "654199", 15.0, "H-2018", 280, 4.1, "Hjemmeeksamen", "Professor", 1.0, enrol=growth(0.06),
       internal_path=[1, 1, 1, 0.3, 0.3, 0.3], survey_path=[0, 0, 0.05, 0.05, 0.1, 0.1], story="Effektivisering")
course("TEK2312", "Praktisk maskinlæring", "Teknologi", "Data og IT", "654999", 7.5, "H-2022", 110, 3.9, "Hjemmeeksamen", "PhD", 1.0, enrol=growth(0.25), dropout=0.27)
course("TEK2507", "Databaser og SQL", "Teknologi", "Data og IT", "654199", 7.5, "H-2019", 150, 4.0, "Hjemmeeksamen", "PhD", 0.5, enrol=growth(0.04),
       exam_path=["Hjemmeeksamen"] * 3 + ["Skoleeksamen"] * 3, survey_path=[0, 0, 0, -0.15, -0.1, -0.1], pass_path=[0, 0, 0, -0.07, -0.06, -0.06], story="Endret eksamensform")
course("TEK2902", "KI i arbeidslivet", "Teknologi", "Data og IT", "654999", 7.5, "H-2024", 160, 4.3, "Mappeinnlevering", "Master", 0.0, enrol=growth(0.30), story="Nytt emne")
# Helse – Helse og livsmestring
course("HEL2112", "Psykisk helse i arbeidslivet", "Helse", "Helse og livsmestring", "636101", 7.5, "H-2020", 190, 4.5, "Hjemmeeksamen", "PhD", 0.5, enrol=growth(0.15))
course("HEL2203", "Folkehelse og livsmestring", "Helse", "Helse og livsmestring", "669999", 7.5, "H-2018", 100, 4.1, "Hjemmeeksamen", "Master", 0.5, enrol=growth(-0.04))
course("HEL2309", "Helsekommunikasjon", "Helse", "Helse og livsmestring", "669927", 7.5, "V-2021", 75, 4.0, "Mappeinnlevering", "Master", 0.0, enrol=growth(0.06))
course("HEL2417", "Aktiv aldring", "Helse", "Helse og livsmestring", "669999", 7.5, "H-2019", 60, 4.1, "Hjemmeeksamen", "Master", 1.0,
       enrol=[1, 1, 1.0, 0.99, 0.80, 0.72], survey_path=[0, 0, 0, -0.5, -0.65, -0.7], editor_path=[0, 0, 0, -0.3, -0.35, -0.4], story="Kvalitetsdrevet nedgang")
course("HEL2513", "Digital helseforståelse", "Helse", "Helse og livsmestring", "669999", 7.5, "V-2022", 70, 3.7, "Hjemmeeksamen", "PhD", 0.5,
       enrol=[1, 1, 1.02, 1.0, 1.25, 1.35], ticket_path=[1, 1, 3.0, 2.8, 1, 1], survey_path=[0, 0, 0.05, 0.45, 0.55, 0.6],
       editor_path=[0, 0, 0.2, 0.4, 0.5, 0.5], story="Investering som virker")
course("HEL2701", "Ernæring og helse", "Helse", "Helse og livsmestring", "669904", 15.0, "H-2017", 160, 4.2, "Skoleeksamen", "PhD", 0.7, enrol=growth(0.08))
# Helse – Pedagogikk og veiledning
course("HEL2604", "Veiledning og relasjonsarbeid", "Helse", "Pedagogikk og veiledning", "624104", 7.5, "H-2017", 120, 4.4, "Muntlig eksamen", "Professor", 1.0, enrol=growth(0.0), dropout=0.11)
course("HEL2805", "Voksenpedagogikk", "Helse", "Pedagogikk og veiledning", "624107", 7.5, "V-2020", 85, 4.2, "Hjemmeeksamen", "PhD", 0.5, enrol=growth(0.05))
course("HEL2810", "Spesialpedagogikk i praksis", "Helse", "Pedagogikk og veiledning", "624202", 7.5, "H-2021", 16, 4.3, "Hjemmeeksamen", "PhD", 1.0, enrol=growth(0.0), story="Lite emne")
course("HEL2902", "Coaching og motiverende samtale", "Helse", "Pedagogikk og veiledning", "624199", 7.5, "H-2022", 95, 4.3, "Muntlig eksamen", "Master", 0.5, enrol=growth(0.12))
# Design – Design
course("DES2107", "Tjenestedesign", "Design", "Design", "616199", 7.5, "H-2019", 140, 4.3, "Mappeinnlevering", "PhD", 0.5, enrol=growth(0.12))
course("DES2318", "Universell utforming", "Design", "Design", "616199", 7.5, "V-2021", 70, 4.2, "Mappeinnlevering", "Master", 0.0, enrol=growth(0.10))
course("DES2519", "Digital prototyping", "Design", "Design", "616199", 7.5, "H-2020", 105, 4.0, "Mappeinnlevering", "Master", 0.3, enrol=growth(0.06))
course("DES2615", "Designledelse", "Design", "Design", "616199", 7.5, "H-2018", 45, 3.8, "Hjemmeeksamen", "Professor", 1.0, enrol=growth(-0.10),
       ticket_path=[1, 1.2, 3, 3.5, 3.5, 3], survey_path=[0, 0, -0.1, -0.15, -0.2, -0.2], editor_base=3.2, story="Revisjon uten effekt")
course("DES2701", "UX-design grunnkurs", "Design", "Design", "616199", 15.0, "H-2019", 150, 4.1, "Mappeinnlevering", "PhD", 0.5, enrol=growth(0.08))
# Design – Kreative fag
course("DES2216", "Visuell historiefortelling", "Design", "Kreative fag", "635999", 7.5, "V-2020", 95, 4.3, "Mappeinnlevering", "Master", 0.5, enrol=growth(0.03))
course("DES2406", "Kreative metoder", "Design", "Kreative fag", "635999", 7.5, "H-2019", 70, 4.1, "Mappeinnlevering", "Master", 0.0,
       enrol=[1, 1, 1.02, 0.98, 0.78, 0.70], survey_path=[0, 0, -0.4, -0.55, -0.6, -0.6], story="Kvalitetsdrevet nedgang")
course("DES2810", "Innholdsproduksjon for sosiale medier", "Design", "Kreative fag", "635107", 7.5, "V-2025", 120, 4.1, "Mappeinnlevering", "Master", 0.0, enrol=growth(0.15), story="Nytt emne")
course("DES2905", "Fotografi og bildeformidling", "Design", "Kreative fag", "635999", 7.5, "H-2020", 14, 4.4, "Mappeinnlevering", "Master", 1.0, enrol=growth(0.0), story="Lite emne")
course("DES2950", "Film og videoproduksjon", "Design", "Kreative fag", "615202", 15.0, "H-2017", 40, 3.7, "Mappeinnlevering", "PhD", 1.0,
       enrol=[1, 0.85, 0.7, 0, 0, 0], inactive_from=4, story="Inaktivt emne")

REDAKTOR = ["R1", "R2", "R3", "R4", "R5"]


def key_to_period(key):
    code, year = key.split("-")
    year = int(year)
    t = year * 2 + (1 if code == "H" else 0)
    return t - (2023 * 2 + 1) + 1


# ── Real pass-rate reference per NUS code ──────────────────────────────────
def pass_reference(codes):
    e = pd.read_csv(SRC / "Eksamensdata_med_NUS.csv", sep=";", dtype=str, encoding="utf-8-sig",
                    usecols=["Årstall", "Nivåkode", "Møtt til eksamen", "Bestått", "NUS-kode",
                             "Institusjonskode", "Emnekode", "Semester", "Studieprogramkode"]).drop_duplicates()
    e = e[e["Nivåkode"].isin(["LN", "B3", "ÅR"]) & e["Årstall"].isin(["2023", "2024", "2025"])]
    e["NUS-kode"] = e["NUS-kode"].str.zfill(6)
    for c in ["Møtt til eksamen", "Bestått"]:
        e[c] = pd.to_numeric(e[c], errors="coerce")
    nus = pd.read_csv(SRC / "nus_clean.csv", dtype=str, encoding="utf-8-sig")
    e = e.merge(nus[["code5", "code3"]], left_on="NUS-kode", right_on="code5", how="left")
    by5 = e.groupby("NUS-kode")[["Bestått", "Møtt til eksamen"]].sum()
    by3 = e.groupby("code3")[["Bestått", "Møtt til eksamen"]].sum()
    out = {}
    for c in codes:
        if c in by5.index and by5.loc[c, "Møtt til eksamen"] >= 500:
            r = by5.loc[c]; src = "NUS nivå 5"
        else:
            r = by3.loc[c[:3]]; src = "NUS nivå 3"
        out[c] = (round(r["Bestått"] / r["Møtt til eksamen"], 3), int(r["Møtt til eksamen"]), src)
    return out


def main():
    nus = pd.read_csv(SRC / "nus_clean.csv", dtype=str, encoding="utf-8-sig").set_index("code5")
    ref = pass_reference(sorted({c["nus"] for c in C}))

    # ── dim_semester ──
    dim_sem = pd.DataFrame([{
        "semester_key": f"{s}-{y}", "semester_code": s, "year": y,
        "semester_label": f"{'Høst' if s == 'H' else 'Vår'} {y}", "period_index": p,
        "start_date": d, "exam_date": str((pd.Timestamp(d) + pd.Timedelta(weeks=SEM_WEEKS)).date()),
        "academic_year": f"{y}/{y + 1}" if s == "H" else f"{y - 1}/{y}",
    } for p, s, y, d in SEMESTERS])

    # ── dim_course ──
    dim_rows = []
    for i, c in enumerate(C):
        n = nus.loc[c["nus"]]
        vol = PORTFOLIO_VOLATILITY[c["portfolio"]]
        launch_p = key_to_period(c["launch"])
        dev = round(DEV_COST[vol] * rng.uniform(0.85, 1.15) / 5000) * 5000
        c["_launch_p"], c["_vol"], c["_dev"] = launch_p, vol, dev
        c["_pass"] = ref[c["nus"]][0]
        c["_editor"] = c.get("editor_base", round(float(rng.normal(4.0, 0.2)), 2))
        c["_leader_bias"] = float(rng.normal(-0.1, 0.12))
        dim_rows.append({
            "course_code": c["code"], "course_name": c["name"],
            "institutt": INSTITUTT[c["area"]], "fagomrade": c["area"], "portefolje": c["portfolio"],
            "nus_code": c["nus"], "nus_lvl3_code": n["code3"], "nus_lvl3_name": n["nus_lvl3_name"],
            "nus_lvl4_code": n["code4"], "nus_lvl4_name": n["nus_lvl4_name"], "nus_lvl5_name": n["nus_lvl5_name"],
            "studiepoeng": c["sp"], "price_nok": PRICE[c["sp"]],
            "launch_semester_key": c["launch"], "launch_year": int(c["launch"][-4:]),
            "subject_volatility": {"high": "Høy", "medium": "Middels", "low": "Lav"}[vol],
            "expected_tickets_per_semester": TICKET_RATE[vol],
            "development_cost_nok": dev,
            "course_leader_level": c["leader"],
            "redaktor": REDAKTOR[i % len(REDAKTOR)],
            "ref_pass_rate_nus": ref[c["nus"]][0], "ref_pass_rate_source": ref[c["nus"]][2],
            "ref_pass_rate_attended_n": ref[c["nus"]][1],
            "emne_status": "Inaktiv" if c.get("inactive_from") else "Aktiv",
            "planted_story": c.get("story", ""),
        })
    dim_course = pd.DataFrame(dim_rows)

    # ── fact_enrollment ──
    enr_rows, cs_extra = [], []
    seen_students = []          # (student_id, attrs)
    student_courses = {}        # student_id -> set(course codes)
    next_sid, next_eid = 1, 1
    ages = ["20–29", "30–39", "40–49", "50+"]
    for (p, s, y, start) in SEMESTERS:
        sem_key = f"{s}-{y}"
        start_ts = pd.Timestamp(start)
        for c in C:
            if p < c["_launch_p"]:
                continue                      # course did not exist yet
            idx = p - 1
            inactive = c.get("inactive_from") and p >= c["inactive_from"]
            mult = c.get("enrol", ONES)[idx]
            n_enr = 0 if inactive else max(0, int(round(c["base"] * SEASON[s] * mult * rng.normal(1, 0.05))))
            if c["base"] < 20 and not inactive:
                n_enr = max(3, int(rng.poisson(c["base"] * SEASON[s])))
            exam_type = c.get("exam_path", [c["exam"]] * N_P)[idx]
            share_int = c.get("internal_path", [c["internal"]] * N_P)[idx]
            n_adv = math.ceil(n_enr / STUDENTS_PER_ADVISER) if n_enr else 0
            adv_int = int(round(n_adv * share_int))
            adv_ext = n_adv - adv_int
            survey_delta = c.get("survey_path", ZERO)[idx]
            drop_p = c["dropout"] - 0.12 * survey_delta
            pass_p = c["_pass"] + 0.04 * survey_delta + c.get("pass_path", ZERO)[idx] \
                - (0.05 if exam_type in ("Skoleeksamen",) else 0)
            for _ in range(n_enr):
                # returning customer or new student
                if seen_students and rng.random() < 0.22:
                    for _try in range(5):
                        sid, attrs = seen_students[rng.integers(len(seen_students))]
                        if c["code"] not in student_courses[sid]:
                            break
                    else:
                        sid = None
                else:
                    sid = None
                if sid is None:
                    sid = f"S{next_sid:06d}"; next_sid += 1
                    attrs = {"age_group": rng.choice(ages, p=[0.28, 0.34, 0.24, 0.14]),
                             "student_type": "Studieprogram" if rng.random() < 0.35 else "Enkeltemne"}
                    seen_students.append((sid, attrs)); student_courses[sid] = set()
                prior = len(student_courses[sid])
                returning = prior > 0
                student_courses[sid].add(c["code"])
                # dropout
                dp = drop_p
                dp *= 0.6 if attrs["student_type"] == "Studieprogram" else 1.0
                dp *= 0.55 if returning else 1.0
                dp *= 1.2 if attrs["age_group"] == "20–29" else 1.0
                dropped = rng.random() < min(dp, 0.9)
                week = None
                if dropped:
                    if rng.random() < 0.7:
                        week = int(rng.choice([1, 2, 3, 4, 5, 6], p=[0.22, 0.22, 0.18, 0.15, 0.12, 0.11]))
                    else:
                        week = int(rng.integers(7, SEM_WEEKS))
                refunded = dropped and week <= 2
                attended = (not dropped) and rng.random() < 0.92
                passed = attended and rng.random() < min(pass_p, 0.99)
                outcome = "Sluttet" if dropped else ("Ikke møtt" if not attended else ("Bestått" if passed else "Ikke bestått"))
                adviser = "Intern" if (n_adv and rng.random() < adv_int / n_adv) else ("Ekstern" if n_adv else "")
                enr_rows.append({
                    "enrollment_id": f"E{next_eid:07d}", "student_id": sid,
                    "course_code": c["code"], "semester_key": sem_key,
                    "course_semester_key": f"{c['code']}-{sem_key}", "period_index": p,
                    "enrolled_date": str((start_ts - pd.Timedelta(days=int(rng.integers(3, 40)))).date()),
                    "age_group": attrs["age_group"], "student_type": attrs["student_type"],
                    "is_returning_customer": returning, "prior_courses_count": prior,
                    "adviser_type": adviser,
                    "outcome": outcome, "dropped_out": dropped,
                    "dropout_week": week,
                    "dropout_date": str((start_ts + pd.Timedelta(days=7 * (week - 1) + int(rng.integers(0, 7)))).date()) if dropped else None,
                    "refunded_angrerett": refunded,
                    "attended_exam": attended, "passed": passed,
                    "paid_nok": 0 if refunded else PRICE[c["sp"]],
                })
                next_eid += 1
            cs_extra.append(dict(c=c, p=p, sem_key=sem_key, exam_type=exam_type, adv_int=adv_int,
                                 adv_ext=adv_ext, inactive=bool(inactive), survey_delta=survey_delta))
    enr = pd.DataFrame(enr_rows)
    enr["dropout_week"] = enr["dropout_week"].astype("Int64")

    # ── fact_course_semester ──
    g = enr.groupby("course_semester_key")
    agg = pd.DataFrame({
        "students_enrolled": g.size(),
        "students_refunded": g["refunded_angrerett"].sum(),
        "students_dropped": g["dropped_out"].sum(),
        "students_attended_exam": g["attended_exam"].sum(),
        "students_passed": g["passed"].sum(),
        "students_returning": g["is_returning_customer"].sum(),
        "students_programme": g["student_type"].apply(lambda x: (x == "Studieprogram").sum()),
        "revenue_nok": g["paid_nok"].sum(),
    })
    rows = []
    for x in cs_extra:
        c, p = x["c"], x["p"]
        idx = p - 1
        key = f"{c['code']}-{x['sem_key']}"
        a = agg.loc[key] if key in agg.index else pd.Series(0, index=agg.columns)
        enrolled = int(a["students_enrolled"])
        completed = enrolled - int(a["students_dropped"])
        # surveys
        status, score, resp = "OK", None, 0
        if enrolled == 0:
            status = "Ingen studenter"
        elif p in c.get("survey_missing", []):
            status = "Ikke gjennomført"
        else:
            resp = int(rng.binomial(completed, 0.35)) if completed else 0
            if resp < 5:
                status = "For få svar"
            else:
                score = float(np.clip(c["survey"] + x["survey_delta"] + rng.normal(0, 0.07), 1, 5))
        leader_score = None if enrolled == 0 else round(float(np.clip(
            c["survey"] + c["_leader_bias"] + 0.5 * x["survey_delta"] + rng.normal(0, 0.1), 1, 5)), 1)
        editor_score = None if enrolled == 0 else round(float(np.clip(
            c["_editor"] + c.get("editor_path", ZERO)[idx] + rng.normal(0, 0.1), 1, 5)), 1)
        # costs
        launch_sem = p == c["_launch_p"]
        tickets = 0 if (x["inactive"] or launch_sem) else int(rng.poisson(TICKET_RATE[c["_vol"]] * c.get("ticket_path", ONES)[idx]))
        exam_cps = EXAM_COST[x["exam_type"]]
        exam_cost = int(a["students_attended_exam"]) * exam_cps
        adv_cost = x["adv_int"] * ADVISER_COST["Intern"] + x["adv_ext"] * ADVISER_COST["Ekstern"]
        leader_cost = LEADER_COST[c["leader"]]
        rev_cost = tickets * TICKET_COST
        dev_cost = c["_dev"] if launch_sem else 0
        op_cost = exam_cost + adv_cost + leader_cost + rev_cost
        age_sem = p - c["_launch_p"]
        if x["inactive"]:
            fase = "Utfasing"
        elif age_sem < 2:
            fase = "Utvikling"
        else:
            fase = "Drift"
        rows.append({
            "course_semester_key": key, "course_code": c["code"], "course_name": c["name"],
            "semester_key": x["sem_key"], "semester_code": x["sem_key"][0], "year": int(x["sem_key"][2:]),
            "semester_label": f"{'Høst' if x['sem_key'][0] == 'H' else 'Vår'} {x['sem_key'][2:]}",
            "period_index": p,
            "institutt": INSTITUTT[c["area"]], "fagomrade": c["area"], "portefolje": c["portfolio"],
            "nus_code": c["nus"], "studiepoeng": c["sp"], "price_nok": PRICE[c["sp"]],
            "emne_status": "Inaktiv" if x["inactive"] else "Aktiv", "fase": fase,
            "course_age_semesters": age_sem,
            "students_enrolled": enrolled,
            "students_refunded": int(a["students_refunded"]),
            "students_dropped": int(a["students_dropped"]),
            "students_completed": completed,
            "students_attended_exam": int(a["students_attended_exam"]),
            "students_no_show": completed - int(a["students_attended_exam"]),
            "students_passed": int(a["students_passed"]),
            "students_returning": int(a["students_returning"]),
            "students_programme": int(a["students_programme"]),
            "dropout_rate": round(a["students_dropped"] / enrolled, 4) if enrolled else None,
            "pass_rate": round(a["students_passed"] / a["students_attended_exam"], 4) if a["students_attended_exam"] else None,
            "completion_rate": round(a["students_passed"] / enrolled, 4) if enrolled else None,
            "student_survey_score": round(score, 2) if score is not None else None,
            "student_survey_responses": resp,
            "student_survey_status": status,
            "course_leader_score": leader_score,
            "editorial_score": editor_score,
            "exam_type": x["exam_type"], "exam_cost_per_student_nok": exam_cps, "exam_cost_nok": exam_cost,
            "advisers_internal": x["adv_int"], "advisers_external": x["adv_ext"], "adviser_cost_nok": adv_cost,
            "course_leader_level": c["leader"], "course_leader_cost_nok": leader_cost,
            "revision_tickets": tickets, "revision_cost_nok": rev_cost,
            "development_cost_nok": dev_cost,
            "operating_cost_nok": op_cost,
            "total_cost_nok": op_cost + dev_cost,
            "revenue_nok": int(a["revenue_nok"]),
            "contribution_nok": int(a["revenue_nok"]) - op_cost,
            "cost_per_student_nok": round(op_cost / enrolled) if enrolled else None,
        })
    fcs = pd.DataFrame(rows).sort_values(["course_code", "period_index"])

    dim_sem.to_csv(OUT / "dim_semester.csv", index=False)
    dim_course.to_csv(OUT / "dim_course.csv", index=False)
    enr.to_csv(OUT / "fact_enrollment.csv", index=False)
    fcs.to_csv(OUT / "fact_course_semester.csv", index=False)
    print(f"dim_course {len(dim_course)}, dim_semester {len(dim_sem)}, "
          f"fact_course_semester {len(fcs)}, fact_enrollment {len(enr)}, students {next_sid - 1}")


if __name__ == "__main__":
    main()
