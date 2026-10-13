"""
Analysis for the Pelican University portfolio case.

Answers
  Q1  Who drops out, and when?               (retention curves, segment lifts)
  Q3  Does quality drop before enrolment?    (onset dates per metric, sequences)
  Q6  Where do we start / what goes well?    (net signal matrix: X = net signals, Y = students)
plus the "what changed" heatmap, cost x quality patterns, revision flags and the real
market comparison.

Inputs : data/*.csv (from generate_data.py and build_market.py)
Outputs: data/course_summary.csv  (one row per course, every derived metric + verdict)
         data/results.json         (everything the website draws)

All thresholds live in RULES so the website and the data dictionary can quote them.
"""
from pathlib import Path
import json
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / "data"

RULES = {
    "baseline_periods": [1, 2],        # Høst 2023 + Vår 2024
    "latest_periods": [5, 6],          # Høst 2025 + Vår 2026
    "relative_threshold": 0.05,        # 5 % change counts as a signal (counts, scores, costs)
    "rate_threshold_pp": 3.0,          # 3 percentage points for pass / dropout rates
    "market_threshold_pp": 5.0,        # course growth minus market growth
    "revision_min_ticket_change": 4,   # floor; real floor = max(4, 2 x expected tickets per semester)
    "large_multiplier": 2.0,           # |change| >= 2 x threshold -> "large"
    "small_course_avg_students": 25,   # below -> too few to judge
    "market_basis": "national_all",    # all organisering; the online flag in DBH is incomplete
    "revision_outlier_ratio": 1.8,     # tickets >= 1.8 x portfolio expectation -> flag
    "revision_spike_ratio": 2.5,       # a semester >= max(2.5 x expected, expected + 5) -> revision wave
    "revision_spike_abs": 5,
    "revision_effect_min_points": 0.2, # survey must rise this much after an event to count as effect
    "onset": {"enrol_yoy": -0.10, "survey_points": -0.25, "editor_points": -0.25,
              "dropout_pp": 4.0, "pass_pp": -4.0, "cost_rel": 0.10},
    "classes": [  # net score -> class, evaluated top-down
        {"min": 3, "class": "Skalér"}, {"min": 2, "class": "God utvikling"},
        {"min": -1, "class": "Stabil"}, {"min": -2, "class": "Følg med"},
        {"min": -99, "class": "Handle nå"}],
    "big_course_upgrade": "net = -2 and students_latest >= median of judged courses -> Handle nå",
}

METRICS = [  # key, label, kind, good direction
    ("students", "Studenter", "rel", +1),
    ("pass_rate", "Bestått", "pp", +1),
    ("dropout_rate", "Frafall", "pp", -1),
    ("student_survey", "Studentundersøkelse", "rel", +1),
    ("course_leader", "Emneansvarlig", "rel", +1),
    ("editorial", "Redaksjon", "rel", +1),
    ("cost_per_student", "Kostnad per student", "rel", -1),
    ("revision_cost", "Revisjonskostnad", "rel", -1),
    ("market_relative", "Vekst mot marked", "pp_market", +1),
]


def wmean(values, weights):
    v, w = np.asarray(values, float), np.asarray(weights, float)
    m = ~np.isnan(v) & (w > 0)
    return float((v[m] * w[m]).sum() / w[m].sum()) if m.any() else np.nan


def window_stats(rows: pd.DataFrame) -> dict:
    enr = rows.students_enrolled.sum()
    att = rows.students_attended_exam.sum()
    op_ex_rev = (rows.operating_cost_nok - rows.revision_cost_nok).sum()
    return {
        "students": enr,
        "pass_rate": rows.students_passed.sum() / att * 100 if att else np.nan,
        "dropout_rate": rows.students_dropped.sum() / enr * 100 if enr else np.nan,
        "student_survey": wmean(rows.student_survey_score, rows.student_survey_responses),
        "course_leader": rows.course_leader_score.mean(),
        "editorial": rows.editorial_score.mean(),
        "cost_per_student": op_ex_rev / enr if enr else np.nan,
        "revision_cost": rows.revision_cost_nok.sum(),
        "revision_tickets": rows.revision_tickets.sum(),
        "revenue": rows.revenue_nok.sum(),
        "contribution": rows.contribution_nok.sum(),
        "semesters": len(rows),
    }


def signal(kind, change, direction):
    """Return (goodness -1/0/+1, magnitude 'small'/'large'/'') for a change."""
    if change is None or (isinstance(change, float) and np.isnan(change)):
        return 0, ""
    thr = {"rel": RULES["relative_threshold"] * 100, "pp": RULES["rate_threshold_pp"],
           "pp_market": RULES["market_threshold_pp"]}[kind]
    if abs(change) < thr:
        return 0, ""
    good = 1 if np.sign(change) == direction else -1
    return good, "large" if abs(change) >= thr * RULES["large_multiplier"] else "small"


def classify(net):
    for c in RULES["classes"]:
        if net >= c["min"]:
            return c["class"]


def onset(series: dict, bad) -> int | None:
    """First period where bad(value) is true and stays true for every later period."""
    periods = sorted(series)
    for i, p in enumerate(periods):
        if all(bad(series[q]) for q in periods[i:] if not np.isnan(series[q])) and not np.isnan(series[p]) and bad(series[p]):
            return p
    return None


def nok(v):
    return f"{v:,.0f} kr".replace(",", " ")


def main():
    dc = pd.read_csv(D / "dim_course.csv", dtype={"nus_code": str, "nus_lvl4_code": str, "nus_lvl3_code": str})
    ds = pd.read_csv(D / "dim_semester.csv")
    f = pd.read_csv(D / "fact_course_semester.csv", dtype={"nus_code": str})
    enr = pd.read_csv(D / "fact_enrollment.csv")
    mk = pd.read_csv(D / "market_nus.csv", dtype={"nus_code": str})
    label = dict(zip(ds.period_index, ds.semester_label))
    mk4 = mk[mk.nus_level == 4]

    # ── market growth per NUS lvl4 for a pair of windows ──
    def market_growth(code4, base_p, latest_p, col="national_all"):
        m = mk4[mk4.nus_code == code4].set_index("period_index")
        b, l = m.loc[base_p, col].sum(), m.loc[latest_p, col].sum()
        return (l / b - 1) * 100 if b else np.nan

    # ── per course summary ──
    summ, heat = [], []
    for _, c in dc.iterrows():
        rows = f[f.course_code == c.course_code]
        active = rows[rows.students_enrolled > 0]
        periods = sorted(active.period_index)
        rec = {k: c[k] for k in ["course_code", "course_name", "institutt", "fagomrade", "portefolje",
                                 "nus_code", "nus_lvl4_code", "nus_lvl4_name", "studiepoeng",
                                 "launch_semester_key", "emne_status", "subject_volatility", "redaktor"]}
        base_p, latest_p = RULES["baseline_periods"], RULES["latest_periods"]
        note = ""
        if c.emne_status == "Inaktiv":
            note = "Inaktivt emne"
        elif periods and periods[0] > base_p[-1]:
            # new course: own first two semesters as baseline if there is room for a separate latest window
            if len(periods) >= 4:
                base_p = periods[:2]; note = "Nytt emne – grunnlinje er de to første semestrene"
            else:
                note = "For kort historikk"
        b = window_stats(rows[rows.period_index.isin(base_p)])
        l = window_stats(rows[rows.period_index.isin(latest_p)])
        avg_students = active.students_enrolled.mean() if len(active) else 0
        small = avg_students < RULES["small_course_avg_students"]
        if small and not note:
            note = "For få studenter til å vurdere"
        mg = market_growth(c.nus_lvl4_code, base_p, latest_p)
        mg_online = market_growth(c.nus_lvl4_code, base_p, latest_p, "national_online")
        exam_base = rows[rows.period_index.isin(base_p)].exam_type.mode()
        exam_latest = rows[rows.period_index.isin(latest_p)].exam_type.mode()
        exam_change = (f"{exam_base.iloc[0]} → {exam_latest.iloc[0]}"
                       if len(exam_base) and len(exam_latest) and exam_base.iloc[0] != exam_latest.iloc[0] else "")
        changes = {}
        for key, _, kind, _ in METRICS:
            if key == "market_relative":
                cg = (l["students"] / b["students"] - 1) * 100 if b["students"] else np.nan
                changes[key] = cg - mg
            elif kind == "pp":
                changes[key] = l[key] - b[key]
            else:
                changes[key] = (l[key] / b[key] - 1) * 100 if b[key] else np.nan
        judged = note in ("", "Nytt emne – grunnlinje er de to første semestrene")
        net, goods, bads = 0, [], []
        for key, lab, kind, direction in METRICS:
            g, mag = signal(kind, changes[key], direction) if judged else (0, "")
            if key == "revision_cost" and abs(l["revision_tickets"] - b["revision_tickets"]) < max(
                    RULES["revision_min_ticket_change"], 2 * c.expected_tickets_per_semester):
                g, mag = 0, ""
            net += g
            (goods if g > 0 else bads if g < 0 else []).append(lab)
            heat.append({"course_code": c.course_code, "metric": key, "metric_label": lab,
                         "unit": {"rel": "%", "pp": "pp", "pp_market": "pp"}[kind],
                         "change": None if np.isnan(changes[key]) else round(float(changes[key]), 1),
                         "goodness": g, "magnitude": mag})
        rec.update({
            "baseline_window": " + ".join(label[p] for p in base_p),
            "latest_window": " + ".join(label[p] for p in latest_p),
            "students_baseline": int(b["students"]), "students_latest": int(l["students"]),
            "avg_students_per_semester": round(avg_students, 1),
            "revenue_latest_nok": int(l["revenue"]), "contribution_latest_nok": int(l["contribution"]),
            **{f"chg_{k}": (None if np.isnan(v) else round(float(v), 1)) for k, v in changes.items()},
            "pass_rate_latest": round(l["pass_rate"], 1) if not np.isnan(l["pass_rate"]) else None,
            "dropout_rate_latest": round(l["dropout_rate"], 1) if not np.isnan(l["dropout_rate"]) else None,
            "student_survey_latest": round(l["student_survey"], 2) if not np.isnan(l["student_survey"]) else None,
            "cost_per_student_latest_nok": round(l["cost_per_student"]) if not np.isnan(l["cost_per_student"]) else None,
            "market_growth_pct": round(mg, 1) if not np.isnan(mg) else None,
            "market_growth_online_pct": round(mg_online, 1) if not np.isnan(mg_online) else None,
            "exam_change": exam_change,
            "signals_good": len(goods), "signals_bad": len(bads), "net_score": net if judged else None,
            "good_metrics": ", ".join(goods), "bad_metrics": ", ".join(bads),
            "matrix_class": classify(net) if judged else ("Inaktiv" if c.emne_status == "Inaktiv" else "For lite datagrunnlag"),
            "data_note": note,
        })
        summ.append(rec)
    cs = pd.DataFrame(summ)

    med = cs.loc[cs.net_score.notna(), "students_latest"].median()
    up = (cs.net_score == -2) & (cs.students_latest >= med)
    cs.loc[up, "matrix_class"] = "Handle nå"
    cs["big_course"] = cs.students_latest >= med

    # ── revision: outliers and events ──
    rev = []
    for _, c in dc.iterrows():
        rows = f[(f.course_code == c.course_code) & (f.students_enrolled > 0)].sort_values("period_index")
        exp = c.expected_tickets_per_semester
        normal_rows = rows[rows.period_index != rows.period_index.min()] if c.launch_semester_key in set(f.semester_key) else rows
        ratio = normal_rows.revision_tickets.sum() / (exp * len(normal_rows)) if len(normal_rows) else np.nan
        spike_lim = max(RULES["revision_spike_ratio"] * exp, exp + RULES["revision_spike_abs"])
        spikes = rows[rows.revision_tickets >= spike_lim].period_index.tolist()
        effect = None
        if spikes:
            first = spikes[0]
            sv = rows.set_index("period_index").student_survey_score
            before = sv[[p for p in sv.index if p < first]].mean()
            after = sv[[p for p in sv.index if p >= first + 1]].mean()
            if not np.isnan(before) and not np.isnan(after):
                effect = round(after - before, 2)
        if ratio >= RULES["revision_outlier_ratio"] or spikes:  # flagged -> did the survey respond?
            verdict = ("Revisjon med effekt" if effect is not None and effect >= RULES["revision_effect_min_points"]
                       else "Revisjon uten effekt")
        else:
            verdict = ""
        rev.append({"course_code": c.course_code, "revision_ratio_vs_portfolio": round(ratio, 2),
                    "revision_outlier_flag": bool(ratio >= RULES["revision_outlier_ratio"]),
                    "revision_spike_semesters": ", ".join(label[p] for p in spikes),
                    "survey_change_after_revision": effect, "revision_verdict": verdict})
    cs = cs.merge(pd.DataFrame(rev), on="course_code")

    # ── cost x quality pattern (descriptive, not causal) ──
    def pattern(r):
        if r.net_score is None or pd.isna(r.net_score):
            return ""
        q, k = r.chg_student_survey, r.chg_cost_per_student
        thr = RULES["relative_threshold"] * 100
        if q is None or k is None or pd.isna(q) or pd.isna(k):
            return ""
        qd = 1 if q >= thr else -1 if q <= -thr else 0
        kd = 1 if k >= thr else -1 if k <= -thr else 0
        if kd == 0 and qd == 0:
            return "Uendret"
        if kd <= 0 and qd > 0:
            return "Bedre for samme eller lavere kostnad"
        if kd < 0 and qd == 0:
            return "Effektivisering"
        if kd < 0 and qd < 0:
            return "Sparing som svekker"
        if kd > 0 and qd > 0:
            return "Investering som virker"
        if kd > 0 and qd <= 0:
            return "Kostnad uten effekt"
        return "Kvalitet faller"
    cs["cost_quality_pattern"] = cs.apply(pattern, axis=1)

    # ── Q3: onset per metric per course ──
    seqs = []
    for _, c in dc.iterrows():
        rows = f[(f.course_code == c.course_code) & (f.students_enrolled > 0)].set_index("period_index").sort_index()
        if len(rows) < 4 or cs.loc[cs.course_code == c.course_code, "data_note"].iloc[0] in ("For få studenter til å vurdere",):
            continue
        ps = list(rows.index)
        base = ps[:2]
        bmean = lambda col: rows.loc[base, col].mean()
        series = {
            "Studentundersøkelse": ({p: rows.loc[p, "student_survey_score"] - bmean("student_survey_score") for p in ps[2:]},
                                    lambda v: v <= RULES["onset"]["survey_points"], "poeng"),
            "Redaksjon": ({p: rows.loc[p, "editorial_score"] - bmean("editorial_score") for p in ps[2:]},
                          lambda v: v <= RULES["onset"]["editor_points"], "poeng"),
            "Frafall": ({p: (rows.loc[p, "dropout_rate"] - bmean("dropout_rate")) * 100 for p in ps[2:]},
                        lambda v: v >= RULES["onset"]["dropout_pp"], "pp"),
            "Bestått": ({p: (rows.loc[p, "pass_rate"] - bmean("pass_rate")) * 100 for p in ps[2:]},
                        lambda v: v <= RULES["onset"]["pass_pp"], "pp"),
            "Kostnad per student": ({p: (rows.loc[p, "cost_per_student_nok"] / bmean("cost_per_student_nok") - 1) * 100 for p in ps[2:]},
                                    lambda v: v >= RULES["onset"]["cost_rel"] * 100, "%"),
            "Studenter (mot året før)": ({p: (rows.loc[p, "students_enrolled"] / rows.loc[p - 2, "students_enrolled"] - 1) * 100
                                          for p in ps[2:] if p - 2 in rows.index},
                                         lambda v: v <= RULES["onset"]["enrol_yoy"] * 100, "%"),
        }
        events = []
        for name, (s, bad, unit) in series.items():
            s = {k: float(v) for k, v in s.items() if not pd.isna(v)}
            o = onset(s, bad)
            if o is not None:
                events.append({"metric": name, "onset_period": int(o), "onset_label": label[o],
                               "value_at_onset": round(s[o], 2), "value_latest": round(s[max(s)], 2), "unit": unit})
        # revision events (good-or-bad, shown on timeline)
        exp = c.expected_tickets_per_semester
        for p in ps:
            if rows.loc[p, "revision_tickets"] >= max(RULES["revision_spike_ratio"] * exp, exp + RULES["revision_spike_abs"]):
                events.append({"metric": "Revisjonsbølge", "onset_period": int(p), "onset_label": label[p],
                               "value_at_onset": int(rows.loc[p, "revision_tickets"]), "value_latest": None, "unit": "saker"})
                break
        # survey rise (for the "investment works" sequence)
        s_up = {p: rows.loc[p, "student_survey_score"] - bmean("student_survey_score") for p in ps[2:]}
        o_up = onset({k: float(v) for k, v in s_up.items() if not pd.isna(v)}, lambda v: v >= 0.25)
        if o_up:
            events.append({"metric": "Studentundersøkelse opp", "onset_period": int(o_up), "onset_label": label[o_up],
                           "value_at_onset": round(float(s_up[o_up]), 2), "value_latest": round(float(s_up[max(s_up)]), 2), "unit": "poeng"})
        e_up = {p: (rows.loc[p, "students_enrolled"] / rows.loc[p - 2, "students_enrolled"] - 1) * 100 for p in ps[2:] if p - 2 in rows.index}
        o_e = onset(e_up, lambda v: v >= 10)
        if o_e and o_up:
            events.append({"metric": "Studenter opp (mot året før)", "onset_period": int(o_e), "onset_label": label[o_e],
                           "value_at_onset": round(e_up[o_e], 1), "value_latest": round(e_up[max(e_up)], 1), "unit": "%"})
        events.sort(key=lambda e: (e["onset_period"], e["metric"]))
        seqs.append({"course_code": c.course_code, "course_name": c.course_name, "events": events})
    seq_by = {s["course_code"]: s for s in seqs}

    def first(code, metric):
        for e in seq_by.get(code, {"events": []})["events"]:
            if e["metric"] == metric:
                return e["onset_period"]
        return None

    decline_rows = []
    for _, r in cs.iterrows():
        e_on, s_on = first(r.course_code, "Studenter (mot året før)"), first(r.course_code, "Studentundersøkelse")
        if r.chg_students is not None and not pd.isna(r.chg_students) and r.chg_students <= -5 and r.data_note == "":
            if s_on is not None and (e_on is None or s_on < e_on):
                t = "Kvalitetsdrevet"
            elif (r.market_growth_pct or 0) > 0 and s_on is None:
                t = "Markedsdrevet – taper andel"
            else:
                t = "Uavklart"
            decline_rows.append({"course_code": r.course_code, "decline_type": t,
                                 "survey_onset": label.get(s_on), "enrolment_onset": label.get(e_on),
                                 "lead_semesters": (e_on - s_on) if (e_on and s_on) else None})
    dec = pd.DataFrame(decline_rows)
    cs = cs.merge(dec, on="course_code", how="left")

    # early-warning lift: P(enrolment falls | survey fell first) vs P(enrolment falls | no survey fall)
    judged_codes = [s["course_code"] for s in seqs]
    with_s = [c for c in judged_codes if first(c, "Studentundersøkelse")]
    without_s = [c for c in judged_codes if not first(c, "Studentundersøkelse")]
    def followed(c):
        s, e = first(c, "Studentundersøkelse"), first(c, "Studenter (mot året før)")
        return e is not None and (s is None or e > s)
    p_with = np.mean([followed(c) for c in with_s]) if with_s else np.nan
    p_without = np.mean([first(c, "Studenter (mot året før)") is not None for c in without_s]) if without_s else np.nan

    # ── verdict text per course ──
    def verdict(r):
        if r.matrix_class == "Inaktiv":
            cost = f.loc[f.course_code == r.course_code, "course_leader_cost_nok"].iloc[-1]
            return f"Inaktivt emne uten studenter, men emneansvarlig koster fortsatt {nok(cost)} per semester."
        if r.matrix_class == "For lite datagrunnlag":
            return f"{r.data_note}. Vises, men vurderes ikke."
        parts = []
        if r.decline_type == "Kvalitetsdrevet":
            if isinstance(r.enrolment_onset, str):
                parts.append(f"Studenttilfredsheten falt fra {r.survey_onset}, og studenttallet fulgte etter fra {r.enrolment_onset}.")
            else:
                parts.append(f"Studenttilfredsheten falt fra {r.survey_onset}. Studenttallet har ikke falt tydelig ennå ({r.chg_students:+.0f} %) – et tidlig varsel.")
        elif r.decline_type == "Markedsdrevet – taper andel":
            parts.append(f"Studenttallet faller ({r.chg_students:+.0f} %) mens markedet for faget vokser ({r.market_growth_pct:+.0f} %). Studenttilfredsheten holder seg – emnet taper andel, ikke kvalitet.")
        if r.exam_change:
            parts.append(f"Eksamensform endret ({r.exam_change}): kostnad per student {r.chg_cost_per_student:+.0f} %, bestått {r.chg_pass_rate:+.1f} pp.")
        if r.revision_verdict == "Revisjon uten effekt":
            parts.append(f"Mange revisjonssaker ({r.revision_ratio_vs_portfolio:.1f}× porteføljenivå) uten at studenttilfredsheten bedres.")
        elif r.revision_verdict == "Revisjon med effekt":
            parts.append(f"Revisjonsbølgen i {r.revision_spike_semesters.split(',')[0]} ble fulgt av høyere studenttilfredshet (+{r.survey_change_after_revision:.2f} poeng).")
        if r.cost_quality_pattern in ("Sparing som svekker", "Effektivisering", "Bedre for samme eller lavere kostnad", "Kostnad uten effekt", "Investering som virker") and not any(("revisjon" in p.lower()) or ("eksamensform" in p.lower()) for p in parts):
            parts.append({
                "Sparing som svekker": "Lavere kostnad per student, men tilfredsheten faller samtidig.",
                "Effektivisering": "Lavere kostnad per student uten at kvaliteten faller.",
                "Bedre for samme eller lavere kostnad": "Bedre studenttilfredshet uten høyere kostnad per student.",
                "Kostnad uten effekt": "Høyere kostnad per student uten bedre studenttilfredshet.",
                "Investering som virker": "Høyere kostnad per student, og tilfredsheten øker.",
            }[r.cost_quality_pattern])
        if not parts:
            if r.matrix_class in ("Skalér", "God utvikling"):
                parts.append(f"Bedre på {r.signals_good} av 9 signaler ({r.good_metrics.lower()}).")
            elif r.matrix_class in ("Handle nå", "Følg med"):
                parts.append(f"Svakere på {r.signals_bad} av 9 signaler ({r.bad_metrics.lower()}).")
            else:
                parts.append("Ingen tydelige endringer siden grunnlinjen.")
        return " ".join(parts)
    cs["verdict"] = cs.apply(verdict, axis=1)

    # ── Q1: retention / dropout ──
    weeks = list(range(0, 21))
    def curve(df):
        n = len(df)
        return [round(100 * (1 - ((df.dropped_out) & (df.dropout_week <= w)).sum() / n), 2) for w in weeks] if n else []
    segs = {"Alle": enr}
    for col, vals in [("student_type", ["Enkeltemne", "Studieprogram"]),
                      ("is_returning_customer", [False, True]), ("age_group", ["20–29", "30–39", "40–49", "50+"])]:
        for v in vals:
            nm = {False: "Ny kunde", True: "Tilbakevendende kunde"}.get(v, v)
            segs[nm] = enr[enr[col] == v]
    curves = [{"segment": k, "n": int(len(v)), "dropout_rate": round(100 * v.dropped_out.mean(), 1), "active_pct_by_week": curve(v)} for k, v in segs.items()]
    drops = enr[enr.dropped_out]
    by_week = drops.dropout_week.value_counts().reindex(range(1, 20), fill_value=0)
    lift = lambda a, b: round((segs[a].dropped_out.mean() / segs[b].dropped_out.mean() - 1) * 100, 1)
    q1 = {
        "overall_dropout_rate": round(100 * enr.dropped_out.mean(), 1),
        "share_of_dropouts_weeks_1_6": round(100 * (drops.dropout_week <= 6).mean(), 1),
        "share_of_dropouts_weeks_1_2_angrerett": round(100 * (drops.dropout_week <= 2).mean(), 1),
        "refunded_revenue_nok": int((enr.refunded_angrerett * enr.course_code.map(dict(zip(dc.course_code, dc.price_nok)))).sum()),
        "dropouts_by_week": [{"week": int(w), "dropouts": int(n)} for w, n in by_week.items()],
        "curves": curves,
        "lifts": {
            "programme_vs_single_course_pct": lift("Studieprogram", "Enkeltemne"),
            "returning_vs_new_pct": lift("Tilbakevendende kunde", "Ny kunde"),
            "age_20_29_vs_all_pct": round((segs["20–29"].dropped_out.mean() / enr.dropped_out.mean() - 1) * 100, 1),
        },
        "by_period": [{"period_index": int(p), "semester_label": label[p], "dropout_rate": round(100 * g.dropped_out.mean(), 1)}
                      for p, g in enr.groupby("period_index")],
        "by_course": [{"course_code": k, "dropout_rate": round(100 * g.dropped_out.mean(), 1),
                       "median_dropout_week": (int(g[g.dropped_out].dropout_week.median()) if g.dropped_out.any() else None),
                       "share_first_6_weeks": (round(100 * (g[g.dropped_out].dropout_week <= 6).mean(), 1) if g.dropped_out.any() else None),
                       "n": int(len(g))}
                      for k, g in enr.groupby("course_code")],
    }

    # ── Q6 matrix points ──
    matrix = [{
        "course_code": r.course_code, "course_name": r.course_name, "portefolje": r.portefolje,
        "x_net_score": None if pd.isna(r.net_score) else int(r.net_score),
        "y_students_latest": r.students_latest, "students_baseline": r.students_baseline,
        "signals_good": r.signals_good, "signals_bad": r.signals_bad,
        "class": r.matrix_class, "verdict": r.verdict,
        "revenue_latest_nok": r.revenue_latest_nok,
    } for r in cs.itertuples()]
    judged = cs[cs.net_score.notna()]
    act = judged[judged.matrix_class == "Handle nå"].sort_values("students_latest", ascending=False)
    star = judged[judged.matrix_class == "Skalér"].sort_values("students_latest", ascending=False)
    headlines = {
        "act_now": [{"course_code": r.course_code, "course_name": r.course_name, "students_latest": int(r.students_latest), "reason": r.verdict} for r in act.itertuples()],
        "scale": [{"course_code": r.course_code, "course_name": r.course_name, "students_latest": int(r.students_latest), "reason": r.verdict} for r in star.itertuples()],
        "market_driven_students_lost": int((cs[cs.decline_type == "Markedsdrevet – taper andel"].students_baseline - cs[cs.decline_type == "Markedsdrevet – taper andel"].students_latest).sum()),
        "class_counts": judged.matrix_class.value_counts().to_dict(),
    }

    # ── market comparison: Pelican vs national, per NUS lvl4 used ──
    market = []
    for code4, grp in dc.groupby("nus_lvl4_code"):
        m = mk4[mk4.nus_code == code4].sort_values("period_index")
        pel = f[f.course_code.isin(grp.course_code)].groupby("period_index").students_enrolled.sum()
        market.append({
            "nus_lvl4_code": code4, "nus_lvl4_name": grp.nus_lvl4_name.iloc[0], "courses": grp.course_code.tolist(),
            "series": [{"period_index": int(r.period_index), "semester_label": r.semester_label,
                        "national_online": int(r.national_online), "national_all": int(r.national_all),
                        "oslomet_online": int(r.oslomet_online), "oslomet_all": int(r.oslomet_all),
                        "pelican_students": int(pel.get(r.period_index, 0)) if 1 <= r.period_index <= 6 else None}
                       for r in m.itertuples()],
        })

    results = {
        "meta": {"school": "Pelican University (fiktiv)", "generated_by": "scripts/analyze.py",
                 "periods": ds.to_dict(orient="records"), "rules": RULES,
                 "metrics": [{"key": k, "label": l, "kind": kd, "good_direction": d} for k, l, kd, d in METRICS],
                 "note": "Kursdata er syntetiske. Markedsdata er ekte (DBH tabell 124) og gjelder studieprogram, ikke emner."},
        "q1_dropout": q1,
        "q3_sequences": {
            "courses": seqs,
            "early_warning": {"courses_with_survey_drop": len(with_s),
                              "share_followed_by_enrolment_drop": round(100 * p_with, 1) if not np.isnan(p_with) else None,
                              "courses_without_survey_drop": len(without_s),
                              "share_with_enrolment_drop_anyway": round(100 * p_without, 1) if not np.isnan(p_without) else None},
            "declines": dec.to_dict(orient="records"),
        },
        "q6_matrix": {"points": matrix, "headlines": headlines},
        "heatmap": heat,
        "market": market,
    }
    cs = cs.sort_values("students_latest", ascending=False)
    cs.to_csv(D / "course_summary.csv", index=False)
    with open(D / "results.json", "w", encoding="utf-8") as fh:
        json.dump(results, fh, ensure_ascii=False, indent=1, default=lambda o: None if (isinstance(o, float) and np.isnan(o)) else (o.item() if hasattr(o, "item") else str(o)))
    print("course_summary", len(cs), "| results.json written")


if __name__ == "__main__":
    main()
