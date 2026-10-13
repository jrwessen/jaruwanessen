/* ─────────────────────────────────────────────────────────────────────────
   pelican-i18n.js – English versions of the text that scripts/analyze.py
   writes into data/results.js (verdicts, metric names, semesters …).

   Class names (Prioritert, Følg med …) and course names stay Norwegian in
   both languages on purpose. If analyze.py gets a new sentence template,
   add a pattern to VERDICT_RULES below; untranslated text falls back to
   Norwegian, so nothing breaks.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  const WORDS = {
    // metrics
    Studenter: "Students",
    Bestått: "Pass rate",
    Frafall: "Dropout",
    Studentundersøkelse: "Student survey",
    Emneansvarlig: "Course leader",
    Redaksjon: "Editorial",
    "Kostnad per student": "Cost per student",
    Revisjonskostnad: "Revision cost",
    "Vekst mot marked": "Growth vs market",
    // timeline events
    "Studenter (mot året før)": "Students (vs year before)",
    "Studenter opp (mot året før)": "Students up (vs year before)",
    "Studentundersøkelse opp": "Student survey up",
    Revisjonsbølge: "Revision wave",
    // patterns
    Uendret: "Unchanged",
    Effektivisering: "Efficiency gain",
    "Kostnad uten effekt": "Cost without effect",
    "Kvalitet faller": "Quality falling",
    "Bedre for samme eller lavere kostnad": "Better for same or lower cost",
    "Sparing som svekker": "Savings that weaken",
    "Revisjon uten effekt": "Revision without effect",
    "Revisjon med effekt": "Revision with effect",
    "Markedsdrevet – taper andel": "Market-driven – losing share",
    Kvalitetsdrevet: "Quality-driven",
    "Eksamensform endret": "Exam format changed",
    "Hjemmeeksamen → Skoleeksamen": "Home exam → On-site exam",
    // data notes
    "Nytt emne – grunnlinje er de to første semestrene": "New course – baseline is its first two semesters",
    "For kort historikk": "Too little history",
    "For få studenter til å vurdere": "Too few students to assess",
    "Inaktivt emne": "Inactive course",
    // segments
    Alle: "All",
    Enkeltemne: "Single course",
    Studieprogram: "Study programme",
    "Ny kunde": "New customer",
    "Tilbakevendende kunde": "Returning customer",
    // organisation
    Teknologi: "Technology",
    Ledelse: "Management",
    Helse: "Health",
    Design: "Design",
    "Data og IT": "Data and IT",
    "Økonomi og styring": "Finance and control",
    "Helse og livsmestring": "Health and life skills",
    "Kreative fag": "Creative subjects",
    "Pedagogikk og veiledning": "Pedagogy and guidance",
    "Institutt for teknologi": "Department of Technology",
    "Institutt for ledelse og økonomi": "Department of Management and Economics",
    "Institutt for helsevitenskap": "Department of Health Sciences",
    "Institutt for design og kreative fag": "Department of Design and Creative Subjects",
  };
  const lower = Object.fromEntries(Object.entries(WORDS).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]));

  const sem = (s) => String(s).replace(/Høst (\d{4})/g, "Autumn $1").replace(/Vår (\d{4})/g, "Spring $1");
  const list = (s) =>
    s
      .split(", ")
      .map((w) => lower[w.toLowerCase()] || w)
      .join(", ");

  const VERDICT_RULES = [
    [/^Bedre på (\d+) av (\d+) signaler \((.+)\)\.$/, (m) => `Better on ${m[1]} of ${m[2]} signals (${list(m[3])}).`],
    [/^Svakere på (\d+) av (\d+) signaler \((.+)\)\.$/, (m) => `Weaker on ${m[1]} of ${m[2]} signals (${list(m[3])}).`],
    [/^Studenttallet faller \((.+?)\) mens markedet for faget vokser \((.+?)\)\.$/, (m) => `Enrolment is falling (${m[1]}) while the market for the subject is growing (${m[2]}).`],
    [/^Studenttilfredsheten holder seg – emnet taper andel, ikke kvalitet\.$/, () => "Student satisfaction holds – the course is losing share, not quality."],
    [/^Mange revisjonssaker \((.+?)× porteføljenivå\) uten at studenttilfredsheten bedres\.$/, (m) => `Many revision tickets (${m[1]}× portfolio level) without better student satisfaction.`],
    [/^Studenttilfredsheten falt fra (.+?), og studenttallet fulgte etter fra (.+?)\.$/, (m) => `Student satisfaction fell from ${sem(m[1])}, and enrolment followed from ${sem(m[2])}.`],
    [/^Studenttilfredsheten falt fra (.+?)\.$/, (m) => `Student satisfaction fell from ${sem(m[1])}.`],
    [/^Studenttallet har ikke falt tydelig ennå \((.+?)\) – et tidlig varsel\.$/, (m) => `Enrolment has not clearly fallen yet (${m[1]}) – an early warning.`],
    [/^Lavere kostnad per student, men tilfredsheten faller samtidig\.$/, () => "Lower cost per student, but satisfaction is falling at the same time."],
    [/^Høyere kostnad per student uten bedre studenttilfredshet\.$/, () => "Higher cost per student without better student satisfaction."],
    [/^Lavere kostnad per student uten at kvaliteten faller\.$/, () => "Lower cost per student without quality falling."],
    [/^Bedre studenttilfredshet uten høyere kostnad per student\.$/, () => "Better student satisfaction without higher cost per student."],
    [/^Ingen tydelige endringer siden grunnlinjen\.$/, () => "No clear changes since the baseline."],
    [/^Eksamensform endret \((.+?)\): kostnad per student (.+?), bestått (.+?)\.$/, (m) => `Exam format changed (${WORDS[m[1]] || m[1]}): cost per student ${m[2]}, pass rate ${m[3]}.`],
    [/^Revisjonsbølgen i (.+?) ble fulgt av høyere studenttilfredshet \((.+?) poeng\)\.$/, (m) => `The revision wave in ${sem(m[1])} was followed by higher student satisfaction (${m[2]} points).`],
    [/^For få studenter til å vurdere\.$/, () => "Too few students to assess."],
    [/^For kort historikk\.$/, () => "Too little history."],
    [/^Vises, men vurderes ikke\.$/, () => "Shown, but not assessed."],
    [/^Inaktivt emne uten studenter, men emneansvarlig koster fortsatt (.+?) kr per semester\.$/, (m) => `Inactive course with no students, but the course leader still costs NOK ${m[1]} per semester.`],
  ];

  function sentence(s) {
    for (const [re, fn] of VERDICT_RULES) {
      const m = s.match(re);
      if (m) return fn(m);
    }
    return null;
  }

  /* Translate one data string. Verdicts are split into sentences first,
     because analyze.py joins several templates into one paragraph. */
  function tr(s) {
    if (window.LANG !== "en" || s == null || s === "") return s;
    const str = String(s);
    if (WORDS[str]) return WORDS[str];
    if (lower[str.toLowerCase()]) return lower[str.toLowerCase()];
    if (/^(Høst|Vår) \d{4}/.test(str)) return sem(str);
    if (/^[A-ZÆØÅa-zæøå][^.]*(, [^.]+)+$/.test(str) && str.split(", ").every((w) => lower[w.toLowerCase()]))
      return list(str);
    const parts = str.match(/[^.]+(?:\.\d+[^.]*)*\.(?=\s|$)|[^.]+$/g) || [str];
    const out = parts.map((p) => sentence(p.trim()));
    return out.every(Boolean) ? out.join(" ") : str;
  }

  window.PX = { tr, sem: (s) => (window.LANG === "en" ? sem(s) : s) };
})();
