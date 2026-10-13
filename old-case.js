/* ─────────────────────────────────────────────────────────────────────────
   old-case.js – first version of the portfolio case (emneportefolje.html).
   Fictional data generated in the browser. Text goes through t() from
   i18n.js; course names and tiltak (Skalér, Stabiliser, Forbedre, Revurder)
   stay Norwegian in both languages.
   ───────────────────────────────────────────────────────────────────────── */

/* ── Base (fictional) course economics ─────────────────────────────────── */
const courseBlueprints = [
  { code: "LED2101", name: "Endringsledelse i praksis", area: "Ledelse", students: 188, profit: 690000, growth: 18, completion: 84 },
  { code: "LED2210", name: "Prosjektledelse", area: "Ledelse", students: 234, profit: 910000, growth: 7, completion: 79 },
  { code: "LED2315", name: "Strategisk HR", area: "Ledelse", students: 92, profit: 210000, growth: -13, completion: 81 },
  { code: "LED2402", name: "Bærekraftig virksomhetsstyring", area: "Ledelse", students: 64, profit: -90000, growth: 22, completion: 71 },
  { code: "LED2510", name: "Forhandling og påvirkning", area: "Ledelse", students: 121, profit: 370000, growth: 31, completion: 86 },
  { code: "LED2608", name: "Operativ økonomistyring", area: "Ledelse", students: 53, profit: -175000, growth: -18, completion: 62 },
  { code: "TEK2105", name: "Datavisualisering", area: "Teknologi", students: 205, profit: 830000, growth: 27, completion: 82 },
  { code: "TEK2209", name: "Grunnleggende dataanalyse", area: "Teknologi", students: 267, profit: 1060000, growth: 14, completion: 76 },
  { code: "TEK2312", name: "Praktisk maskinlæring", area: "Teknologi", students: 118, profit: 180000, growth: 39, completion: 69 },
  { code: "TEK2414", name: "Informasjonssikkerhet", area: "Teknologi", students: 148, profit: 520000, growth: -4, completion: 88 },
  { code: "TEK2507", name: "Databaser og SQL", area: "Teknologi", students: 176, profit: 610000, growth: 12, completion: 73 },
  { code: "TEK2611", name: "Digital arbeidsflyt", area: "Teknologi", students: 43, profit: -220000, growth: -27, completion: 58 },
  { code: "HEL2112", name: "Psykisk helse i arbeidslivet", area: "Helse", students: 156, profit: 470000, growth: 24, completion: 89 },
  { code: "HEL2203", name: "Folkehelse og livsmestring", area: "Helse", students: 101, profit: 160000, growth: -8, completion: 85 },
  { code: "HEL2309", name: "Helsekommunikasjon", area: "Helse", students: 76, profit: -40000, growth: 15, completion: 78 },
  { code: "HEL2417", name: "Aktiv aldring", area: "Helse", students: 46, profit: -145000, growth: -21, completion: 72 },
  { code: "HEL2513", name: "Digital helseforståelse", area: "Helse", students: 84, profit: 90000, growth: 34, completion: 75 },
  { code: "HEL2604", name: "Veiledning og relasjonsarbeid", area: "Helse", students: 113, profit: 240000, growth: -2, completion: 91 },
  { code: "DES2107", name: "Tjenestedesign", area: "Design", students: 139, profit: 420000, growth: 16, completion: 83 },
  { code: "DES2216", name: "Visuell historiefortelling", area: "Design", students: 97, profit: 120000, growth: 9, completion: 87 },
  { code: "DES2318", name: "Universell utforming", area: "Design", students: 72, profit: -65000, growth: 28, completion: 80 },
  { code: "DES2406", name: "Kreative metoder", area: "Design", students: 68, profit: 50000, growth: -17, completion: 77 },
  { code: "DES2519", name: "Digital prototyping", area: "Design", students: 109, profit: 260000, growth: 21, completion: 74 },
  { code: "DES2615", name: "Designledelse", area: "Design", students: 38, profit: -195000, growth: -24, completion: 64 },
];

const TODAY_YEAR = 2026;

/* Matrix runs on rolling periods; table runs on a fixed "startår" snapshot. */
const periodFactors = {
  "12m": { no: "siste 12 måneder", en: "the last 12 months", students: 0.42, profit: 0.38, growth: 1.35, completion: 0.5, noise: 4, years: 1 },
  "2y": { no: "siste 2 år", en: "the last 2 years", students: 0.68, profit: 0.64, growth: 0.9, completion: 0.2, noise: 3, years: 2 },
  "3y": { no: "siste 3 år", en: "the last 3 years", students: 1, profit: 1, growth: 1, completion: 0, noise: 0, years: 3 },
  "4y": { no: "siste 4 år", en: "the last 4 years", students: 1.22, profit: 1.28, growth: 0.8, completion: -0.5, noise: 2, years: 4 },
  "5y": { no: "siste 5 år", en: "the last 5 years", students: 1.4, profit: 1.5, growth: 0.68, completion: -1, noise: 2, years: 5 },
};
const yearFactors = {
  2025: { students: 1, profit: 1, growth: 1, completion: 0, noise: 0 },
  2024: { students: 0.91, profit: 0.84, growth: 0.72, completion: -1, noise: 3 },
  2023: { students: 0.82, profit: 0.69, growth: 0.52, completion: -2, noise: 3 },
};

const colors = { Skalér: "#226b56", Stabiliser: "#c99d48", Forbedre: "#c35a31", Revurder: "#a84237" };

const instituttMap = {
  Ledelse: "Institutt for ledelse og økonomi",
  Teknologi: "Institutt for teknologi",
  Helse: "Institutt for helsevitenskap",
  Design: "Institutt for design og kreative fag",
};
const portefoljeMap = {
  Ledelse: ["Ledelse", "Økonomi og styring"],
  Teknologi: ["Teknologi", "Data og IT"],
  Helse: ["Helse og livsmestring", "Pedagogikk og veiledning"],
  Design: ["Design", "Kreative fag"],
};
const nuskodeMap = {
  Ledelse: "524101",
  "Økonomi og styring": "524108",
  Teknologi: "484101",
  "Data og IT": "484109",
  "Helse og livsmestring": "624101",
  "Pedagogikk og veiledning": "624104",
  Design: "212101",
  "Kreative fag": "212108",
};

/* Display labels for data values (values themselves stay Norwegian). */
const FASE_EN = { Drift: "Operation", Utvikling: "Development", Utfasing: "Phase-out", Alle: "All" };
const STATUS_EN = { Aktiv: "Active", Inaktiv: "Inactive", Alle: "All" };
const faseLabel = (v) => t(v, FASE_EN[v] || v);
const statusLabel = (v) => t(v, STATUS_EN[v] || v);
const tr = (s) => (window.PX ? window.PX.tr(s) : s);

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function actionFor(profit, growth) {
  if (profit >= 0 && growth >= 0) return "Skalér";
  if (profit >= 0 && growth < 0) return "Stabiliser";
  if (profit < 0 && growth >= 0) return "Forbedre";
  return "Revurder";
}

/* Builds one fully-derived row: structural fields are period-independent;
   economic fields are scaled by `factor`. */
function buildRow(course, index, factor) {
  const variance = ((index % 5) - 2) * 0.025;
  const profit = Math.round((course.profit * factor.profit * (1 + variance)) / 5000) * 5000;
  const growth = Math.round(course.growth * factor.growth + ((index % 3) - 1) * factor.noise);
  const students = Math.max(18, Math.round(course.students * factor.students * (1 + variance)));
  const completion = clamp(course.completion + factor.completion + (index % 4 === 0 ? -1 : 0), 51, 94);
  const action = actionFor(profit, growth);
  const deltaStudents = Math.round(students * (growth / 100));

  const launchYear = TODAY_YEAR - (1 + (index % 7));
  const alder = Math.max(1, TODAY_YEAR - launchYear);
  const fase = alder <= 1 ? "Utvikling" : alder >= 7 && growth < 0 ? "Utfasing" : "Drift";
  const status = profit < -120000 && growth < -12 ? "Inaktiv" : "Aktiv";

  const portefolje = portefoljeMap[course.area][index % 2];
  const kjerne = index % 3;
  const valg = 2 + (index % 8);
  const spesial = (index + 1) % 3;
  const antallKjop = Math.max(10, Math.round(course.students * (0.55 + (index % 5) * 0.07) * factor.students * (1 + variance)));
  const studenterSidenLansering = Math.round(students * (1 + alder * 0.35));

  return {
    ...course,
    profit,
    growth,
    students,
    completion,
    action,
    deltaStudents,
    launchYear,
    alder,
    fase,
    status,
    institutt: instituttMap[course.area],
    portefolje,
    nusGruppe: portefolje,
    nuskode: nuskodeMap[portefolje],
    kjerne,
    valg,
    spesial,
    totalProgram: kjerne + valg + spesial,
    antallKjop,
    studenterSidenLansering,
  };
}

/* ── State ───────────────────────────────────────────────────────────── */
const DEFAULT_TABLE = () => ({
  startYear: 2025,
  fase: "Alle",
  status: "Aktiv",
  institutt: "Alle",
  portefolje: "Alle",
  alder: "Alle",
  search: "",
  sortKey: null,
  sortDir: "asc",
});
const state = {
  period: "3y",
  area: "Alle",
  selected: null, // the selected row object
  table: DEFAULT_TABLE(),
  toggles: { size: false, regression: true, age: false },
};

function matrixRows() {
  return courseBlueprints
    .map((c, i) => buildRow(c, i, periodFactors[state.period]))
    .filter((r) => state.area === "Alle" || r.area === state.area);
}

function tableRows(includeSearch = true) {
  const f = state.table;
  return courseBlueprints
    .map((c, i) => buildRow(c, i, yearFactors[f.startYear]))
    .filter(
      (r) =>
        (f.fase === "Alle" || r.fase === f.fase) &&
        (f.status === "Alle" || r.status === f.status) &&
        (f.institutt === "Alle" || r.institutt === f.institutt) &&
        (f.portefolje === "Alle" || r.portefolje === f.portefolje) &&
        (f.alder === "Alle" ||
          (f.alder === "0-2" && r.alder <= 2) ||
          (f.alder === "3-5" && r.alder >= 3 && r.alder <= 5) ||
          (f.alder === "6+" && r.alder >= 6)) &&
        (!includeSearch || !f.search || `${r.name} ${r.code}`.toLowerCase().includes(f.search)),
    );
}

/* ── Formatting helpers ─────────────────────────────────────────────── */
const num = (v, d = 0) => v.toLocaleString(LOCALE(), { maximumFractionDigits: d });
function formatNok(value, compact = false) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (compact) {
    if (abs >= 1000000) return `${sign}${num(abs / 1000000, 1)} ${t("mill.", "M")}`;
    return `${sign}${num(Math.round(abs / 1000))}k`;
  }
  return t(`${sign}${num(abs)} kr`, `${sign}NOK ${num(abs)}`);
}
function signedInt(value) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${num(Math.abs(value))}`;
}
const arrowGlyph = (v) => (v > 0 ? "▲" : v < 0 ? "▼" : "▬");
const arrowColor = (v) => (v > 0 ? "#1e7a46" : v < 0 ? "#b23a3a" : "#6b675f");
const periodText = () => t(periodFactors[state.period].no, periodFactors[state.period].en);

/* ── Color scales ───────────────────────────────────────────────────── */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbLerp = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const rgbCss = (rgb) => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;

const REGR_STOPS = [
  { t: 0, c: hexToRgb("#ff2626") },
  { t: 0.33, c: hexToRgb("#fde93b") },
  { t: 0.66, c: hexToRgb("#36d666") },
  { t: 1, c: hexToRgb("#0053ab") },
];
function regressionColor(value, domainMin, domainMax) {
  if (value === 0) return "#9aa0a6";
  const k = clamp((value - domainMin) / (domainMax - domainMin || 1), 0, 1);
  for (let i = 0; i < REGR_STOPS.length - 1; i++) {
    const a = REGR_STOPS[i],
      b = REGR_STOPS[i + 1];
    if (k >= a.t && k <= b.t) return rgbCss(rgbLerp(a.c, b.c, (k - a.t) / (b.t - a.t)));
  }
  return rgbCss(REGR_STOPS[REGR_STOPS.length - 1].c);
}
const STUDENT_RAMP = ["#caf0f8", "#90e0ef", "#00b4d8", "#0077b6", "#03045e"].map(hexToRgb);
function studentColor(value, min, max) {
  const k = clamp((value - min) / (max - min || 1), 0, 1);
  const seg = k * (STUDENT_RAMP.length - 1);
  const i = Math.min(STUDENT_RAMP.length - 2, Math.floor(seg));
  return rgbCss(rgbLerp(STUDENT_RAMP[i], STUDENT_RAMP[i + 1], seg - i));
}
function ageStateFor(row) {
  const periodStartYear = TODAY_YEAR - periodFactors[state.period].years;
  if (row.launchYear > periodStartYear) return "newer";
  if (row.launchYear === periodStartYear) return "equal";
  return "older";
}
const AGE_COLORS = { newer: "#5b5eb8", equal: "#a1b1ca", older: "#5b8db8" };

function colorForRow(row, domain) {
  if (state.toggles.regression) return regressionColor(row.deltaStudents, domain.regrMin, domain.regrMax);
  if (state.toggles.size) return studentColor(row.students, domain.studMin, domain.studMax);
  if (state.toggles.age) return AGE_COLORS[ageStateFor(row)];
  return "#5b8db8";
}

/* ── Filters (options are built here so labels can change language) ── */
function fillSelect(id, options, current) {
  const el = document.getElementById(id);
  el.innerHTML = options.map(([v, label]) => `<option value="${v}">${label}</option>`).join("");
  el.value = current;
}
function fillSelects() {
  const areas = ["Ledelse", "Teknologi", "Helse", "Design"];
  fillSelect("areaFilter", [["Alle", t("Alle fagområder", "All subject areas")], ...areas.map((a) => [a, tr(a)])], state.area);
  fillSelect("faseFilter", ["Alle", "Drift", "Utvikling", "Utfasing"].map((v) => [v, faseLabel(v)]), state.table.fase);
  fillSelect("statusFilter", ["Alle", "Aktiv", "Inaktiv"].map((v) => [v, statusLabel(v)]), state.table.status);
  fillSelect(
    "instituttFilter",
    [["Alle", t("Alle", "All")], ...Object.values(instituttMap).map((v) => [v, tr(v)])],
    state.table.institutt,
  );
  fillSelect(
    "portefoljeFilter",
    [["Alle", t("Alle", "All")], ...Object.keys(nuskodeMap).map((v) => [v, tr(v)])],
    state.table.portefolje,
  );
  fillSelect(
    "alderFilter",
    [
      ["Alle", t("Alle", "All")],
      ["0-2", t("0–2 år", "0–2 years")],
      ["3-5", t("3–5 år", "3–5 years")],
      ["6+", t("6+ år", "6+ years")],
    ],
    state.table.alder,
  );
}

/* ── KPI cards ──────────────────────────────────────────────────────── */
function updateKpis() {
  const rows = matrixRows();
  const profit = rows.reduce((s, r) => s + r.profit, 0);
  const students = rows.reduce((s, r) => s + r.students, 0);
  const completion = students ? rows.reduce((s, r) => s + r.completion * r.students, 0) / students : 0;
  const attention = rows.filter((r) => r.action === "Forbedre" || r.action === "Revurder").length;

  document.querySelector("#kpiProfit").textContent = formatNok(profit, true);
  document.querySelector("#kpiStudents").textContent = num(students);
  document.querySelector("#kpiCompletion").textContent = `${num(completion, 1)} %`;
  document.querySelector("#kpiAttention").textContent = num(attention);
  const label = `${t("For", "For")} ${periodText()}`;
  document.querySelector("#kpiProfitDelta").textContent = label;
  document.querySelector("#kpiStudentDelta").textContent = label;
}

/* ── Matrix (SVG) ───────────────────────────────────────────────────── */
function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}
function evenTicks(min, max, count) {
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => min + step * i);
}

function renderChart() {
  const svg = document.querySelector("#portfolioChart");
  svg.querySelectorAll(":scope > :not(title):not(desc)").forEach((n) => n.remove());
  const rows = matrixRows();
  const W = 760,
    H = 430;
  const pad = { left: 74, right: 24, top: 40, bottom: 52 };
  const plotW = W - pad.left - pad.right,
    plotH = H - pad.top - pad.bottom;

  const profits = rows.map((r) => r.profit);
  const deltas = rows.map((r) => r.deltaStudents);
  let minX = Math.min(...profits),
    maxX = Math.max(...profits);
  let minY = Math.min(...deltas),
    maxY = Math.max(...deltas);
  if (minX === maxX) (minX -= 1), (maxX += 1);
  if (minY === maxY) (minY -= 1), (maxY += 1);
  const xPad = (maxX - minX) * 0.08,
    yPad = (maxY - minY) * 0.12;
  minX -= xPad;
  maxX += xPad;
  minY -= yPad;
  maxY += yPad;

  const x = (v) => pad.left + ((v - minX) / (maxX - minX)) * plotW;
  const y = (v) => pad.top + ((maxY - v) / (maxY - minY)) * plotH;
  const studCounts = rows.map((r) => r.students);
  const sMin = Math.min(...studCounts),
    sMax = Math.max(...studCounts);
  const rScale = (v) => (state.toggles.size ? 6 + Math.sqrt((v - sMin) / (sMax - sMin || 1)) * 16 : 8);

  const domain = {
    regrMin: Math.min(0, ...deltas),
    regrMax: Math.max(0, ...deltas),
    studMin: sMin,
    studMax: sMax,
  };

  evenTicks(minX, maxX, 6).forEach((v) => {
    svg.appendChild(
      svgEl("line", {
        x1: x(v),
        y1: pad.top,
        x2: x(v),
        y2: H - pad.bottom,
        stroke: "#e7ebe8",
      }),
    );
    const lbl = svgEl("text", { x: x(v), y: H - pad.bottom + 18, "text-anchor": "middle", class: "axis-text" });
    lbl.textContent = `${num(Math.round(v / 1000))}k`;
    svg.appendChild(lbl);
  });
  evenTicks(minY, maxY, 6).forEach((v) => {
    svg.appendChild(svgEl("line", { x1: pad.left, y1: y(v), x2: W - pad.right, y2: y(v), stroke: "#e7ebe8" }));
    const lbl = svgEl("text", { x: pad.left - 10, y: y(v) + 4, "text-anchor": "end", class: "axis-text" });
    lbl.textContent = num(Math.round(v));
    svg.appendChild(lbl);
  });
  // zero lines
  if (minX < 0 && maxX > 0)
    svg.appendChild(svgEl("line", { x1: x(0), y1: pad.top, x2: x(0), y2: H - pad.bottom, stroke: "#8a9490", "stroke-width": 1.4 }));
  if (minY < 0 && maxY > 0)
    svg.appendChild(svgEl("line", { x1: pad.left, y1: y(0), x2: W - pad.right, y2: y(0), stroke: "#8a9490", "stroke-width": 1.4 }));

  const xTitle = svgEl("text", { x: pad.left + plotW / 2, y: H - 8, "text-anchor": "middle", class: "axis-title" });
  xTitle.textContent = t("Endring i dekningsbidrag (kr)", "Change in contribution margin (NOK)");
  svg.appendChild(xTitle);
  const yTitle = svgEl("text", {
    x: 16,
    y: pad.top + plotH / 2,
    transform: `rotate(-90 16 ${pad.top + plotH / 2})`,
    "text-anchor": "middle",
    class: "axis-title",
  });
  yTitle.textContent = t("Endring i antall studenter", "Change in number of students");
  svg.appendChild(yTitle);

  const HI_G = t("HØY STUDENTVEKST", "HIGH STUDENT GROWTH");
  const LO_G = t("LAV STUDENTVEKST", "LOW STUDENT GROWTH");
  const HI_P = t("HØYT DEKNINGSBIDRAG", "HIGH CONTRIBUTION");
  const LO_P = t("LAVT DEKNINGSBIDRAG", "LOW CONTRIBUTION");
  [
    { x: pad.left + 10, y: pad.top + 14, ax: "start", l: [HI_G, LO_P] },
    { x: W - pad.right - 10, y: pad.top + 14, ax: "end", l: [HI_G, HI_P] },
    { x: pad.left + 10, y: H - pad.bottom - 24, ax: "start", l: [LO_G, LO_P] },
    { x: W - pad.right - 10, y: H - pad.bottom - 24, ax: "end", l: [LO_G, HI_P] },
  ].forEach((c) =>
    c.l.forEach((line, i) => {
      const txt = svgEl("text", { x: c.x, y: c.y + i * 12, "text-anchor": c.ax, class: "quad-label" });
      txt.textContent = line;
      svg.appendChild(txt);
    }),
  );

  const tip = document.querySelector("#chartTooltip");
  rows.forEach((row) => {
    const ageState = ageStateFor(row);
    const shortened = ageState === "newer" || ageState === "equal";
    const studentsWord = t("studenter", "students");
    const circle = svgEl("circle", {
      cx: x(row.profit),
      cy: y(row.deltaStudents),
      r: rScale(row.students),
      fill: colorForRow(row, domain),
      opacity: 0.92,
      class: `bubble${state.selected && state.selected.code !== row.code ? " dimmed" : ""}`,
      "stroke-dasharray": shortened ? "4,3" : "none",
      tabindex: 0,
      role: "button",
      "aria-label": `${row.name}: ${formatNok(row.profit)}, ${signedInt(row.deltaStudents)} ${studentsWord}, ${t("tiltak", "action")} ${row.action}`,
    });
    const showTip = () => {
      tip.innerHTML = `<strong>${row.name}</strong>${formatNok(row.profit)} · ${signedInt(row.deltaStudents)} ${studentsWord}`;
      tip.hidden = false;
      const box = svg.getBoundingClientRect();
      const lx = (Number(circle.getAttribute("cx")) / W) * box.width;
      const ly = (Number(circle.getAttribute("cy")) / H) * box.height;
      tip.style.left = `${Math.min(Math.max(4, lx + 12), box.width - 170)}px`;
      tip.style.top = `${Math.max(4, ly - 25)}px`;
    };
    const hideTip = () => (tip.hidden = true);
    circle.addEventListener("mouseenter", showTip);
    circle.addEventListener("focus", showTip);
    circle.addEventListener("mouseleave", hideTip);
    circle.addEventListener("blur", hideTip);
    circle.addEventListener("click", () => selectCourse(row));
    circle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectCourse(row);
      }
    });
    svg.appendChild(circle);
  });

  updateLegend();
}

function updateLegend() {
  const legend = document.querySelector("#gradientLegend");
  if (state.toggles.regression) {
    legend.innerHTML = `
      <span class="gl-label">${t("SYNKENDE", "DECLINING")}</span>
      <span class="gl-bar"></span>
      <span class="gl-label">${t("VOKSENDE", "GROWING")}</span>
      <span class="gl-swatch" aria-hidden="true"></span>
      <span class="gl-label">${t("INGEN ENDRING", "NO CHANGE")}</span>`;
  } else if (state.toggles.age) {
    legend.innerHTML = `
      <span class="gl-swatch" style="background:${AGE_COLORS.newer}"></span><span class="gl-label">${t("NYERE ENN PERIODEN", "NEWER THAN PERIOD")}</span>
      <span class="gl-swatch" style="background:${AGE_COLORS.equal}"></span><span class="gl-label">${t("SAMME ÅR", "SAME YEAR")}</span>
      <span class="gl-swatch" style="background:${AGE_COLORS.older}"></span><span class="gl-label">${t("ELDRE", "OLDER")}</span>`;
  } else if (state.toggles.size) {
    legend.innerHTML = `<span class="gl-label">${t("FÅ STUDENTER", "FEW STUDENTS")}</span><span class="gl-bar gl-bar--student"></span><span class="gl-label">${t("MANGE STUDENTER", "MANY STUDENTS")}</span>`;
  } else {
    legend.innerHTML = "";
  }
}

/* ── Detail card ────────────────────────────────────────────────────── */
function fillDetail(row) {
  const $ = (id) => document.getElementById(id);
  $("detailFase").textContent = `${t("Fase", "Phase")}: ${faseLabel(row.fase)}`;
  $("detailTiltak").textContent = `${t("Tiltak", "Action")}: ${row.action}`;
  $("detailTiltak").style.background = colors[row.action];
  $("detailName").textContent = row.name;
  $("detailCode").textContent = `${row.code} · ${tr(row.institutt)}`;
  $("detailLaunch").textContent = `${t("Lansert", "Launched")} ${row.launchYear}`;

  $("detailProfitArrow").textContent = arrowGlyph(row.profit);
  $("detailProfitArrow").style.color = arrowColor(row.profit);
  $("detailProfit").textContent = formatNok(row.profit, true);

  $("detailDeltaArrow").textContent = arrowGlyph(row.deltaStudents);
  $("detailDeltaArrow").style.color = arrowColor(row.deltaStudents);
  $("detailDeltaLabel").textContent = t(
    `Differanse i antall studenter i dag vs samme dato i ${row.launchYear}`,
    `Difference in students today vs the same date in ${row.launchYear}`,
  );
  $("detailDelta").textContent = signedInt(row.deltaStudents);
  $("detailStudentsNow").textContent = num(row.students);
  $("detailSinceLabel").textContent = t(`Antall studenter fra ${row.launchYear} til i dag`, `Students from ${row.launchYear} to today`);
  $("detailSince").textContent = num(row.studenterSidenLansering);
  $("detailProgramsTitle").innerHTML = t(
    `Tilknytning til <strong>${row.totalProgram}</strong> studieprogram totalt`,
    `Linked to <strong>${row.totalProgram}</strong> study programmes in total`,
  );
  $("detailKjerne").textContent = row.kjerne;
  $("detailValg").textContent = row.valg;
  $("detailSpesial").textContent = row.spesial;
}

function selectCourse(row) {
  if (!row) return;
  state.selected = row;
  document.querySelector("#insightPlaceholder").hidden = true;
  document.querySelector("#insightContent").hidden = false;
  fillDetail(row);
  renderChart();
}

function clearSelection() {
  state.selected = null;
  document.querySelector("#insightPlaceholder").hidden = false;
  document.querySelector("#insightContent").hidden = true;
  renderChart();
}

/* ── Table ──────────────────────────────────────────────────────────── */
function alderTint(alder, minA, maxA) {
  const k = clamp((alder - minA) / (maxA - minA || 1), 0, 1);
  return `hsl(${95 - k * 40} 55% ${88 - k * 10}%)`;
}

const SORT_ACCESSORS = {
  fase: (r) => faseLabel(r.fase),
  emne: (r) => `${r.code} ${r.name}`,
  alder: (r) => r.alder,
  students: (r) => r.students,
  overskudd: (r) => r.profit,
  kjop: (r) => r.antallKjop,
  portefolje: (r) => tr(r.portefolje),
  nus: (r) => tr(r.nusGruppe),
  nuskode: (r) => Number(r.nuskode),
  tiltak: (r) => r.action,
};

function defaultTableOrder(a, b) {
  const order = { Revurder: 0, Forbedre: 1, Stabiliser: 2, Skalér: 3 };
  return order[a.action] - order[b.action] || a.profit - b.profit;
}

function sortedTableRows() {
  const rows = tableRows(true);
  const { sortKey, sortDir } = state.table;
  if (!sortKey) return rows.slice().sort(defaultTableOrder);
  const get = SORT_ACCESSORS[sortKey];
  return rows.slice().sort((a, b) => {
    const av = get(a),
      bv = get(b);
    const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv), LANG === "en" ? "en" : "nb");
    return sortDir === "desc" ? -cmp : cmp;
  });
}

function updateSortHeaders() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.setAttribute(
      "aria-sort",
      th.dataset.key === state.table.sortKey ? (state.table.sortDir === "desc" ? "descending" : "ascending") : "none",
    );
  });
}

function handleSort(key) {
  if (state.table.sortKey === key) {
    state.table.sortDir = state.table.sortDir === "asc" ? "desc" : "asc";
  } else {
    state.table.sortKey = key;
    state.table.sortDir = "asc";
  }
  updateSortHeaders();
  renderTable();
}

function renderTable() {
  const body = document.querySelector("#courseTable");
  const rows = sortedTableRows();
  const total = tableRows(false).length;
  document.querySelector("#resultCount").textContent = t(
    `Viser ${rows.length} av ${total} emner for startår ${state.table.startYear}`,
    `Showing ${rows.length} of ${total} courses for start year ${state.table.startYear}`,
  );

  if (!rows.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="10">${t("Ingen emner matcher filtrene.", "No courses match the filters.")}</td></tr>`;
    return;
  }
  const maxStud = Math.max(...rows.map((r) => r.students), 1);
  const maxKjop = Math.max(...rows.map((r) => r.antallKjop), 1);
  const minA = Math.min(...rows.map((r) => r.alder)),
    maxA = Math.max(...rows.map((r) => r.alder));

  body.innerHTML = rows
    .map(
      (r) => `
    <tr data-code="${r.code}" tabindex="0" aria-label="${t("Vis detaljer for", "Show details for")} ${r.name}">
      <td class="cell-left"><span class="fase-dot fase-${r.fase}"></span>${faseLabel(r.fase)}</td>
      <td class="cell-left"><strong>${r.code}</strong> ${r.name}</td>
      <td style="background:${alderTint(r.alder, minA, maxA)}">${r.alder}</td>
      <td><div class="bar-cell"><span class="bar-track"><span class="bar-fill bar-fill--blue" style="width:${(r.students / maxStud) * 100}%"></span></span><span class="bar-value">${num(r.students)}</span></div></td>
      <td>${formatNok(r.profit, true)}</td>
      <td><div class="bar-cell"><span class="bar-track"><span class="bar-fill bar-fill--green" style="width:${(r.antallKjop / maxKjop) * 100}%"></span></span><span class="bar-value">${num(r.antallKjop)}</span></div></td>
      <td class="cell-left">${tr(r.portefolje)}</td>
      <td class="cell-left">${tr(r.nusGruppe)}</td>
      <td>${r.nuskode}</td>
      <td><span class="status-pill status-${r.action}">${r.action}</span></td>
    </tr>`,
    )
    .join("");

  body.querySelectorAll("tr[data-code]").forEach((row) => {
    const activate = () => selectCourse(tableRows(false).find((r) => r.code === row.dataset.code));
    row.addEventListener("click", activate);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter") activate();
    });
  });
}

/* ── Wiring ─────────────────────────────────────────────────────────── */
function renderAll() {
  updateKpis();
  renderChart();
  renderTable();
}

document.querySelectorAll("th.sortable").forEach((th) => {
  th.addEventListener("click", () => handleSort(th.dataset.key));
  th.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSort(th.dataset.key);
    }
  });
});

document.querySelectorAll(".period-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".period-pill").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.period = btn.dataset.period;
    updateKpis();
    renderChart();
  });
});

const filtereBtn = document.querySelector("#filtereBtn");
const filterePanel = document.querySelector("#filterePanel");
filtereBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = filterePanel.hidden;
  filterePanel.hidden = !open;
  filtereBtn.setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (e) => {
  if (!filterePanel.hidden && !filterePanel.contains(e.target) && e.target !== filtereBtn) {
    filterePanel.hidden = true;
    filtereBtn.setAttribute("aria-expanded", "false");
  }
});
document.querySelector("#areaFilter").addEventListener("change", (e) => {
  state.area = e.target.value;
  updateKpis();
  renderChart();
});

function wireToggle(id, key) {
  document.getElementById(id).addEventListener("click", function () {
    state.toggles[key] = !state.toggles[key];
    this.classList.toggle("active", state.toggles[key]);
    this.setAttribute("aria-pressed", String(state.toggles[key]));
    renderChart();
  });
}
wireToggle("toggleSize", "size");
wireToggle("toggleRegression", "regression");
wireToggle("toggleAge", "age");

[
  ["startYearFilter", "startYear", Number],
  ["faseFilter", "fase", String],
  ["statusFilter", "status", String],
  ["instituttFilter", "institutt", String],
  ["portefoljeFilter", "portefolje", String],
  ["alderFilter", "alder", String],
].forEach(([id, key, cast]) =>
  document.getElementById(id).addEventListener("change", (e) => {
    state.table[key] = cast(e.target.value);
    renderTable();
  }),
);
document.querySelector("#courseSearch").addEventListener("input", (e) => {
  state.table.search = e.target.value.trim().toLowerCase();
  renderTable();
});

document.querySelector("#closeInsight").addEventListener("click", clearSelection);

/* Click outside a bubble, a table row or the detail card clears the selection. */
document.addEventListener("click", (e) => {
  if (!state.selected) return;
  if (e.target.closest(".bubble") || e.target.closest("tr[data-code]") || e.target.closest(".insight-card")) return;
  clearSelection();
});

document.querySelector("#resetFilters").addEventListener("click", () => {
  state.period = "3y";
  state.area = "Alle";
  state.table = DEFAULT_TABLE();
  state.toggles = { size: false, regression: true, age: false };
  document.querySelectorAll(".period-pill").forEach((b) => b.classList.toggle("active", b.dataset.period === "3y"));
  document.querySelector("#startYearFilter").value = "2025";
  document.querySelector("#courseSearch").value = "";
  [
    ["toggleSize", false],
    ["toggleRegression", true],
    ["toggleAge", false],
  ].forEach(([id, on]) => {
    const b = document.getElementById(id);
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  fillSelects();
  updateSortHeaders();
  clearSelection();
  renderAll();
});

document.addEventListener("langchange", () => {
  fillSelects();
  if (state.selected) fillDetail(state.selected);
  renderAll();
});

fillSelects();
renderAll();
