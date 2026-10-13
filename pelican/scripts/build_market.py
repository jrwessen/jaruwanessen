"""
Build the REAL market table from DBH table 124 (registered students per study programme).

Output: data/market_nus.csv  (one row per semester x NUS group, NUS level 3 and 4)

Notes
- DBH 124 is per study PROGRAMME, not per course. Use it only for growth rates
  (index), never for market share against Pelican's course enrolments.
- "Nettbasert" is re-derived with the same rule Kip uses in Power Query, because
  many online programmes are registered as "Undervisning ved institusjonen".
- Only Studentkategori 'S' (Studenter) is counted.
"""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SRC, OUT = ROOT / "source", ROOT / "data"

NET_NAME_PATTERNS = ["nett-", " nettstudium", "nettbasert", "årsstudium, nett",
                     "-7, nett", "- 10, nett", "1 nett 5"]


def is_online(df: pd.DataFrame) -> pd.Series:
    name = df["Studieprogramnavn"].fillna("").str.lower()
    rule = (
        df["Avdelingsnavn"].fillna("").str.lower().str.contains("nett", regex=False)
        | df["Studieprogramkode"].fillna("").str.endswith("_N")
        | (df["Organisering"] == "Nettbasert undervisning")
    )
    for p in NET_NAME_PATTERNS:
        rule |= name.str.contains(p, regex=False)
    return rule


def main():
    d = pd.read_csv(SRC / "DBH-tabell124.csv", sep=";", dtype=str)
    nus = pd.read_csv(SRC / "nus_clean.csv", dtype=str, encoding="utf-8-sig")
    d = d[d["Studentkategori"] == "S"].copy()
    d["Antall"] = pd.to_numeric(d["Antall"], errors="coerce").fillna(0)
    d["online"] = is_online(d)
    d["oslomet"] = d["Institusjonsnavn"].str.contains("OsloMet", regex=False)
    d = d.merge(nus[["code5", "code3", "nus_lvl3_name", "code4", "nus_lvl4_name"]],
                left_on="NUS-kode", right_on="code5", how="left")

    d["year"] = d["Årstall"].astype(int)
    d["semester_code"] = d["Semesternavn"].map({"Høst": "H", "Vår": "V"})
    d = d[d["year"] >= 2021]
    # chronological order: Vår before Høst in the same year
    d["t"] = d["year"] * 2 + (d["semester_code"] == "H").astype(int)
    t0 = 2023 * 2 + 1  # Høst 2023 = period_index 1
    d["period_index"] = d["t"] - t0 + 1

    rows = []
    for level, code_col, name_col in [(3, "code3", "nus_lvl3_name"), (4, "code4", "nus_lvl4_name")]:
        g = d.groupby(["period_index", "year", "semester_code", code_col, name_col])
        agg = pd.DataFrame({
            "national_all": g["Antall"].sum(),
            "national_online": g.apply(lambda x: x.loc[x.online, "Antall"].sum(), include_groups=False),
            "oslomet_all": g.apply(lambda x: x.loc[x.oslomet, "Antall"].sum(), include_groups=False),
            "oslomet_online": g.apply(lambda x: x.loc[x.oslomet & x.online, "Antall"].sum(), include_groups=False),
        }).reset_index().rename(columns={code_col: "nus_code", name_col: "nus_name"})
        agg.insert(0, "nus_level", level)
        rows.append(agg)
    m = pd.concat(rows, ignore_index=True)

    # index: Høst 2023 = 100 (empty when base is 0)
    base = m[m.period_index == 1].set_index(["nus_level", "nus_code"])
    for col in ["national_all", "national_online", "oslomet_all", "oslomet_online"]:
        b = m.set_index(["nus_level", "nus_code"]).index.map(base[col])
        idx = (m[col] / pd.Series(b, index=m.index) * 100).round(1)
        m[f"{col}_idx"] = idx.where(pd.Series(b, index=m.index) > 0)

    m["semester_key"] = m["semester_code"] + "-" + m["year"].astype(str)
    m["semester_label"] = m["semester_code"].map({"H": "Høst", "V": "Vår"}) + " " + m["year"].astype(str)
    m["in_pelican_window"] = m["period_index"].between(1, 6)
    cols = ["semester_key", "semester_label", "year", "semester_code", "period_index", "in_pelican_window",
            "nus_level", "nus_code", "nus_name",
            "national_online", "national_all", "oslomet_online", "oslomet_all",
            "national_online_idx", "national_all_idx", "oslomet_online_idx", "oslomet_all_idx"]
    m = m[cols].sort_values(["nus_level", "nus_code", "period_index"])
    for c in ["national_online", "national_all", "oslomet_online", "oslomet_all"]:
        m[c] = m[c].astype(int)
    m.to_csv(OUT / "market_nus.csv", index=False, encoding="utf-8")
    print(len(m), "rows written")


if __name__ == "__main__":
    main()
