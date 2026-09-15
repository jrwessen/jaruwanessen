/* ── Base (fictional) course economics ─────────────────────────────────── */
const courseBlueprints = [
  {
    code: "LED2101",
    name: "Endringsledelse i praksis",
    area: "Ledelse",
    students: 188,
    profit: 690000,
    growth: 18,
    completion: 84,
  },
  {
    code: "LED2210",
    name: "Prosjektledelse",
    area: "Ledelse",
    students: 234,
    profit: 910000,
    growth: 7,
    completion: 79,
  },
  {
    code: "LED2315",
    name: "Strategisk HR",
    area: "Ledelse",
    students: 92,
    profit: 210000,
    growth: -13,
    completion: 81,
  },
  {
    code: "LED2402",
    name: "Bærekraftig virksomhetsstyring",
    area: "Ledelse",
    students: 64,
    profit: -90000,
    growth: 22,
    completion: 71,
  },
  {
    code: "LED2510",
    name: "Forhandling og påvirkning",
    area: "Ledelse",
    students: 121,
    profit: 370000,
    growth: 31,
    completion: 86,
  },
  {
    code: "LED2608",
    name: "Operativ økonomistyring",
    area: "Ledelse",
    students: 53,
    profit: -175000,
    growth: -18,
    completion: 62,
  },
  {
    code: "TEK2105",
    name: "Datavisualisering",
    area: "Teknologi",
    students: 205,
    profit: 830000,
    growth: 27,
    completion: 82,
  },
  {
    code: "TEK2209",
    name: "Grunnleggende dataanalyse",
    area: "Teknologi",
    students: 267,
    profit: 1060000,
    growth: 14,
    completion: 76,
  },
  {
    code: "TEK2312",
    name: "Praktisk maskinlæring",
    area: "Teknologi",
    students: 118,
    profit: 180000,
    growth: 39,
    completion: 69,
  },
  {
    code: "TEK2414",
    name: "Informasjonssikkerhet",
    area: "Teknologi",
    students: 148,
    profit: 520000,
    growth: -4,
    completion: 88,
  },
  {
    code: "TEK2507",
    name: "Databaser og SQL",
    area: "Teknologi",
    students: 176,
    profit: 610000,
    growth: 12,
    completion: 73,
  },
  {
    code: "TEK2611",
    name: "Digital arbeidsflyt",
    area: "Teknologi",
    students: 43,
    profit: -220000,
    growth: -27,
    completion: 58,
  },
  {
    code: "HEL2112",
    name: "Psykisk helse i arbeidslivet",
    area: "Helse",
    students: 156,
    profit: 470000,
    growth: 24,
    completion: 89,
  },
  {
    code: "HEL2203",
    name: "Folkehelse og livsmestring",
    area: "Helse",
    students: 101,
    profit: 160000,
    growth: -8,
    completion: 85,
  },
  {
    code: "HEL2309",
    name: "Helsekommunikasjon",
    area: "Helse",
    students: 76,
    profit: -40000,
    growth: 15,
    completion: 78,
  },
  {
    code: "HEL2417",
    name: "Aktiv aldring",
    area: "Helse",
    students: 46,
    profit: -145000,
    growth: -21,
    completion: 72,
  },
  {
    code: "HEL2513",
    name: "Digital helseforståelse",
    area: "Helse",
    students: 84,
    profit: 90000,
    growth: 34,
    completion: 75,
  },
  {
    code: "HEL2604",
    name: "Veiledning og relasjonsarbeid",
    area: "Helse",
    students: 113,
    profit: 240000,
    growth: -2,
    completion: 91,
  },
  {
    code: "DES2107",
    name: "Tjenestedesign",
    area: "Design",
    students: 139,
    profit: 420000,
    growth: 16,
    completion: 83,
  },
  {
    code: "DES2216",
    name: "Visuell historiefortelling",
    area: "Design",
    students: 97,
    profit: 120000,
    growth: 9,
    completion: 87,
  },
  {
    code: "DES2318",
    name: "Universell utforming",
    area: "Design",
    students: 72,
    profit: -65000,
    growth: 28,
    completion: 80,
  },
  {
    code: "DES2406",
    name: "Kreative metoder",
    area: "Design",
    students: 68,
    profit: 50000,
    growth: -17,
    completion: 77,
  },
  {
    code: "DES2519",
    name: "Digital prototyping",
    area: "Design",
    students: 109,
    profit: 260000,
    growth: 21,
    completion: 74,
  },
  {
    code: "DES2615",
    name: "Designledelse",
    area: "Design",
    students: 38,
    profit: -195000,
    growth: -24,
    completion: 64,
  },
];

const TODAY_YEAR = 2026;

/* Matrix runs on rolling periods; table runs on a fixed "startår" snapshot. */
const periodFactors = {
  "12m": {
    label: "Siste 12 måned",
    students: 0.42,
    profit: 0.38,
    growth: 1.35,
    completion: 0.5,
    noise: 4,
    years: 1,
  },
  "2y": {
    label: "Siste 2 år",
    students: 0.68,
    profit: 0.64,
    growth: 0.9,
    completion: 0.2,
    noise: 3,
    years: 2,
  },
  "3y": {
    label: "Siste 3 år",
    students: 1,
    profit: 1,
    growth: 1,
    completion: 0,
    noise: 0,
    years: 3,
  },
  "4y": {
    label: "Siste 4 år",
    students: 1.22,
    profit: 1.28,
    growth: 0.8,
    completion: -0.5,
    noise: 2,
    years: 4,
  },
  "5y": {
    label: "Siste 5 år",
    students: 1.4,
    profit: 1.5,
    growth: 0.68,
    completion: -1,
    noise: 2,
    years: 5,
  },
};
const yearFactors = {
  2025: { students: 1, profit: 1, growth: 1, completion: 0, noise: 0 },
  2024: {
    students: 0.91,
    profit: 0.84,
    growth: 0.72,
    completion: -1,
    noise: 3,
  },
  2023: {
    students: 0.82,
    profit: 0.69,
    growth: 0.52,
    completion: -2,
    noise: 3,
  },
};

const colors = {
  Skalér: "#226b56",
  Stabiliser: "#c99d48",
  Forbedre: "#c35a31",
  Revurder: "#a84237",
};

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

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function actionFor(profit, growth) {
  if (profit >= 0 && growth >= 0) return "Skalér";
  if (profit >= 0 && growth < 0) return "Stabiliser";
  if (profit < 0 && growth >= 0) return "Forbedre";
  return "Revurder";
}

/* Builds one fully-derived row: structural (institutt/alder/fase/program-tilknytning)
   fields are period-independent; economic fields are scaled by `factor`. */
function buildRow(course, index, factor) {
  const variance = ((index % 5) - 2) * 0.025;
  const profit =
    Math.round((course.profit * factor.profit * (1 + variance)) / 5000) * 5000;
  const growth = Math.round(
    course.growth * factor.growth + ((index % 3) - 1) * factor.noise,
  );
  const students = Math.max(
    18,
    Math.round(course.students * factor.students * (1 + variance)),
  );
  const completion = clamp(
    51,
    94,
    course.completion + factor.completion + (index % 4 === 0 ? -1 : 0),
  );
  const action = actionFor(profit, growth);
  const deltaStudents = Math.round(students * (growth / 100));

  const launchYear = TODAY_YEAR - (1 + (index % 7));
  const alder = Math.max(1, TODAY_YEAR - launchYear);
  const fase =
    alder <= 1 ? "Utvikling" : alder >= 7 && growth < 0 ? "Utfasing" : "Drift";
  const status = profit < -120000 && growth < -12 ? "Inaktiv" : "Aktiv";

  const portefoljeOptions = portefoljeMap[course.area];
  const portefolje = portefoljeOptions[index % 2];
  const kjerne = index % 3;
  const valg = 2 + (index % 8);
  const spesial = (index + 1) % 3;
  const antallKjop = Math.max(
    10,
    Math.round(
      course.students *
        (0.55 + (index % 5) * 0.07) *
        factor.students *
        (1 + variance),
    ),
  );
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
const state = {
  period: "3y",
  area: "Alle",
  selectedSource: null, // { code, kind: 'matrix' | 'table' }
  table: {
    startYear: 2025,
    fase: "Alle",
    status: "Aktiv",
    institutt: "Alle",
    portefolje: "Alle",
    alder: "Alle",
    search: "",
    sortKey: null,
    sortDir: "asc",
  },
  toggles: { size: false, regression: true, age: false },
};

function matrixRows() {
  return courseBlueprints
    .map((c, i) => buildRow(c, i, periodFactors[state.period]))
    .filter((r) => state.area === "Alle" || r.area === state.area);
}

function tableRows(includeSearch = true) {
  return courseBlueprints
    .map((c, i) => buildRow(c, i, yearFactors[state.table.startYear]))
    .filter(
      (r) =>
        (state.table.fase === "Alle" || r.fase === state.table.fase) &&
        (state.table.status === "Alle" || r.status === state.table.status) &&
        (state.table.institutt === "Alle" ||
          r.institutt === state.table.institutt) &&
        (state.table.portefolje === "Alle" ||
          r.portefolje === state.table.portefolje) &&
        (state.table.alder === "Alle" ||
          (state.table.alder === "0-2" && r.alder <= 2) ||
          (state.table.alder === "3-5" && r.alder >= 3 && r.alder <= 5) ||
          (state.table.alder === "6+" && r.alder >= 6)) &&
        (!includeSearch ||
          !state.table.search ||
          `${r.name} ${r.code}`.toLowerCase().includes(state.table.search)),
    );
}

/* ── Formatting helpers ─────────────────────────────────────────────── */
function formatNok(value, compact = false) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (compact) {
    if (abs >= 1000000)
      return `${sign}${(abs / 1000000).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} mill.`;
    return `${sign}${Math.round(abs / 1000).toLocaleString("nb-NO")}k`;
  }
  return `${sign}${abs.toLocaleString("nb-NO")} kr`;
}
function signedPercent(value) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value)} %`;
}
function signedInt(value) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("nb-NO")}`;
}
function arrowGlyph(v) {
  return v > 0 ? "▲" : v < 0 ? "▼" : "▬";
}
function arrowColor(v) {
  return v > 0 ? "#1e7a46" : v < 0 ? "#b23a3a" : "#6b675f";
}

/* ── Color scales ───────────────────────────────────────────────────── */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbLerp(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}
function rgbCss(rgb) {
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

const REGR_STOPS = [
  { t: 0, c: hexToRgb("#ff2626") },
  { t: 0.33, c: hexToRgb("#fde93b") },
  { t: 0.66, c: hexToRgb("#36d666") },
  { t: 1, c: hexToRgb("#0053ab") },
];
function regressionColor(value, domainMin, domainMax) {
  if (value === 0) return "#9aa0a6";
  const t = clamp((value - domainMin) / (domainMax - domainMin || 1), 0, 1);
  for (let i = 0; i < REGR_STOPS.length - 1; i++) {
    const a = REGR_STOPS[i],
      b = REGR_STOPS[i + 1];
    if (t >= a.t && t <= b.t)
      return rgbCss(rgbLerp(a.c, b.c, (t - a.t) / (b.t - a.t)));
  }
  return rgbCss(REGR_STOPS[REGR_STOPS.length - 1].c);
}
const STUDENT_RAMP = [
  "#caf0f8",
  "#90e0ef",
  "#00b4d8",
  "#0077b6",
  "#03045e",
].map(hexToRgb);
function studentColor(value, min, max) {
  const t = clamp((value - min) / (max - min || 1), 0, 1);
  const seg = t * (STUDENT_RAMP.length - 1);
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
  if (state.toggles.regression)
    return regressionColor(row.deltaStudents, domain.regrMin, domain.regrMax);
  if (state.toggles.size)
    return studentColor(row.students, domain.studMin, domain.studMax);
  if (state.toggles.age) return AGE_COLORS[ageStateFor(row)];
  return "#5b8db8";
}

/* ── KPI cards ──────────────────────────────────────────────────────── */
function updateKpis() {
  const rows = matrixRows();
  const profit = rows.reduce((s, r) => s + r.profit, 0);
  const students = rows.reduce((s, r) => s + r.students, 0);
  const completion = students
    ? rows.reduce((s, r) => s + r.completion * r.students, 0) / students
    : 0;
  const attention = rows.filter(
    (r) => r.action === "Forbedre" || r.action === "Revurder",
  ).length;

  document.querySelector("#kpiProfit").textContent = formatNok(profit, true);
  document.querySelector("#kpiStudents").textContent =
    students.toLocaleString("nb-NO");
  document.querySelector("#kpiCompletion").textContent =
    `${completion.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %`;
  document.querySelector("#kpiAttention").textContent =
    attention.toLocaleString("nb-NO");
  document.querySelector("#kpiProfitDelta").textContent =
    `For ${periodFactors[state.period].label.toLowerCase()}`;
  document.querySelector("#kpiStudentDelta").textContent =
    `For ${periodFactors[state.period].label.toLowerCase()}`;
}

/* ── Matrix (SVG) ───────────────────────────────────────────────────── */
function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function renderChart() {
  const svg = document.querySelector("#portfolioChart");
  svg
    .querySelectorAll(":scope > :not(title):not(desc)")
    .forEach((n) => n.remove());
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
  if (minX === maxX) {
    minX -= 1;
    maxX += 1;
  }
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const xPad = (maxX - minX) * 0.08,
    yPad = (maxY - minY) * 0.12;
  minX -= xPad;
  maxX += xPad;
  minY -= yPad;
  maxY += yPad;

  const x = (v) => pad.left + ((v - minX) / (maxX - minX)) * plotW;
  const y = (v) => pad.top + ((maxY - v) / (maxY - minY)) * plotH;
  const studCounts = rows.map((r) => r.students);
  const rScale = (v) =>
    state.toggles.size
      ? 6 +
        Math.sqrt(
          (v - Math.min(...studCounts)) /
            (Math.max(...studCounts) - Math.min(...studCounts) || 1),
        ) *
          16
      : 8;

  const domain = {
    regrMin: Math.min(0, ...deltas),
    regrMax: Math.max(0, ...deltas),
    studMin: Math.min(...studCounts),
    studMax: Math.max(...studCounts),
  };

  // gridlines
  const xTicks = d3ishTicks(minX, maxX, 6);
  const yTicks = d3ishTicks(minY, maxY, 6);
  xTicks.forEach((v) => {
    svg.appendChild(
      svgEl("line", {
        x1: x(v),
        y1: pad.top,
        x2: x(v),
        y2: H - pad.bottom,
        stroke: Math.abs(v) < 1e-6 ? "#8a9490" : "#e7ebe8",
        "stroke-width": Math.abs(v) < 1e-6 ? 1.4 : 1,
      }),
    );
    const lbl = svgEl("text", {
      x: x(v),
      y: H - pad.bottom + 18,
      "text-anchor": "middle",
      class: "axis-text",
    });
    lbl.textContent = `${Math.round(v / 1000).toLocaleString("nb-NO")}k kr`;
    svg.appendChild(lbl);
  });
  yTicks.forEach((v) => {
    svg.appendChild(
      svgEl("line", {
        x1: pad.left,
        y1: y(v),
        x2: W - pad.right,
        y2: y(v),
        stroke: Math.abs(v) < 1e-6 ? "#8a9490" : "#e7ebe8",
        "stroke-width": Math.abs(v) < 1e-6 ? 1.4 : 1,
      }),
    );
    const lbl = svgEl("text", {
      x: pad.left - 10,
      y: y(v) + 4,
      "text-anchor": "end",
      class: "axis-text",
    });
    lbl.textContent = Math.round(v).toLocaleString("nb-NO");
    svg.appendChild(lbl);
  });

  const xTitle = svgEl("text", {
    x: pad.left + plotW / 2,
    y: H - 8,
    "text-anchor": "middle",
    class: "axis-title",
  });
  xTitle.textContent = "Endring i Dekningsbidrag (kr)";
  svg.appendChild(xTitle);
  const yTitle = svgEl("text", {
    x: 16,
    y: pad.top + plotH / 2,
    transform: `rotate(-90 16 ${pad.top + plotH / 2})`,
    "text-anchor": "middle",
    class: "axis-title",
  });
  yTitle.textContent = "Endring i antall studenter";
  svg.appendChild(yTitle);

  // corner labels
  const corners = [
    {
      x: pad.left + 10,
      y: pad.top + 14,
      ax: "start",
      l: ["HØY STUDENTVEKST", "LAV DEKNINGSBIDRAG"],
    },
    {
      x: W - pad.right - 10,
      y: pad.top + 14,
      ax: "end",
      l: ["HØY STUDENTVEKST", "HØY DEKNINGSBIDRAG"],
    },
    {
      x: pad.left + 10,
      y: H - pad.bottom - 24,
      ax: "start",
      l: ["LAV STUDENTVEKST", "LAV DEKNINGSBIDRAG"],
    },
    {
      x: W - pad.right - 10,
      y: H - pad.bottom - 24,
      ax: "end",
      l: ["LAV STUDENTVEKST", "HØY DEKNINGSBIDRAG"],
    },
  ];
  corners.forEach((c) => {
    c.l.forEach((line, i) => {
      const t = svgEl("text", {
        x: c.x,
        y: c.y + i * 12,
        "text-anchor": c.ax,
        class: "quad-label",
      });
      t.textContent = line;
      svg.appendChild(t);
    });
  });

  rows.forEach((row) => {
    const ageState = ageStateFor(row);
    const shortened = ageState === "newer" || ageState === "equal";
    const circle = svgEl("circle", {
      cx: x(row.profit),
      cy: y(row.deltaStudents),
      r: rScale(row.students),
      fill: colorForRow(row, domain),
      opacity: 0.92,
      class: `bubble${state.selectedSource && state.selectedSource.code !== row.code ? " dimmed" : ""}`,
      "stroke-dasharray": shortened ? "4,3" : "none",
      tabindex: 0,
      role: "button",
      "aria-label": `${row.name}: ${formatNok(row.profit)}, ${signedInt(row.deltaStudents)} studenter, tiltak ${row.action}`,
    });
    const showTip = () => {
      const tip = document.querySelector("#chartTooltip");
      tip.innerHTML = `<strong>${row.name}</strong>${formatNok(row.profit)} · ${signedInt(row.deltaStudents)} studenter`;
      tip.hidden = false;
      const box = svg.getBoundingClientRect();
      const lx = (Number(circle.getAttribute("cx")) / W) * box.width;
      const ly = (Number(circle.getAttribute("cy")) / H) * box.height;
      tip.style.left = `${Math.min(Math.max(4, lx + 12), box.width - 170)}px`;
      tip.style.top = `${Math.max(4, ly - 25)}px`;
    };
    circle.addEventListener("mouseenter", showTip);
    circle.addEventListener("focus", showTip);
    circle.addEventListener(
      "mouseleave",
      () => (document.querySelector("#chartTooltip").hidden = true),
    );
    circle.addEventListener(
      "blur",
      () => (document.querySelector("#chartTooltip").hidden = true),
    );
    circle.addEventListener("click", () => selectCourse(row, "matrix"));
    circle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectCourse(row, "matrix");
      }
    });
    svg.appendChild(circle);
  });

  updateLegend(domain);
}

function d3ishTicks(min, max, count) {
  const step = (max - min) / count;
  const out = [];
  for (let i = 0; i <= count; i++) out.push(min + step * i);
  return out;
}

function updateLegend(domain) {
  const legend = document.querySelector("#gradientLegend");
  if (state.toggles.regression) {
    legend.innerHTML = `
      <span class="gl-label">SYNKENDE</span>
      <span class="gl-bar"></span>
      <span class="gl-label">VOKSENDE</span>
      <span class="gl-swatch" aria-hidden="true"></span>
      <span class="gl-label">INGEN ENDRING</span>`;
  } else if (state.toggles.age) {
    legend.innerHTML = `
      <span class="gl-swatch" style="background:${AGE_COLORS.newer}"></span><span class="gl-label">NYERE ENN PERIODEN</span>
      <span class="gl-swatch" style="background:${AGE_COLORS.equal}"></span><span class="gl-label">SAMME ÅR</span>
      <span class="gl-swatch" style="background:${AGE_COLORS.older}"></span><span class="gl-label">ELDRE</span>`;
  } else if (state.toggles.size) {
    legend.innerHTML = `<span class="gl-label">FÅ STUDENTER</span><span class="gl-bar gl-bar--student"></span><span class="gl-label">MANGE STUDENTER</span>`;
  } else {
    legend.innerHTML = "";
  }
}

/* ── Detail card ────────────────────────────────────────────────────── */
function selectCourse(row, kind) {
  if (!row) return;
  state.selectedSource = { code: row.code, kind };
  document.querySelector("#insightPlaceholder").hidden = true;
  document.querySelector("#insightContent").hidden = false;

  document.querySelector("#detailFase").textContent = `Fase: ${row.fase}`;
  const tiltakEl = document.querySelector("#detailTiltak");
  tiltakEl.textContent = `Tiltak: ${row.action}`;
  tiltakEl.style.background = colors[row.action];

  document.querySelector("#detailName").textContent = row.name;
  document.querySelector("#detailCode").textContent =
    `${row.code} · ${row.institutt}`;
  document.querySelector("#detailLaunch").textContent =
    `Lansert ${row.launchYear}`;

  const profitArrow = document.querySelector("#detailProfitArrow");
  profitArrow.textContent = arrowGlyph(row.profit);
  profitArrow.style.color = arrowColor(row.profit);
  document.querySelector("#detailProfit").textContent =
    `${formatNok(row.profit, true)} kr`;

  const deltaArrow = document.querySelector("#detailDeltaArrow");
  deltaArrow.textContent = arrowGlyph(row.deltaStudents);
  deltaArrow.style.color = arrowColor(row.deltaStudents);
  document.querySelector("#detailDeltaLabel").textContent =
    `Differanse i antall studenter i dag vs samme dato i ${row.launchYear}`;
  document.querySelector("#detailDelta").textContent = signedInt(
    row.deltaStudents,
  );

  document.querySelector("#detailStudentsNow").textContent =
    row.students.toLocaleString("nb-NO");
  document.querySelector("#detailSinceLabel").textContent =
    `Antall studenter fra ${row.launchYear} til i dag`;
  document.querySelector("#detailSince").textContent =
    row.studenterSidenLansering.toLocaleString("nb-NO");

  document.querySelector("#detailTotalPrograms").textContent = row.totalProgram;
  document.querySelector("#detailKjerne").textContent = row.kjerne;
  document.querySelector("#detailValg").textContent = row.valg;
  document.querySelector("#detailSpesial").textContent = row.spesial;

  renderChart();
}

function clearSelection() {
  state.selectedSource = null;
  document.querySelector("#insightPlaceholder").hidden = false;
  document.querySelector("#insightContent").hidden = true;
  renderChart();
}

/* ── Table ──────────────────────────────────────────────────────────── */
function alderTint(alder, minA, maxA) {
  const t = clamp((alder - minA) / (maxA - minA || 1), 0, 1);
  const hue = 95 - t * 40; // pale yellow-green (95) -> green (55)
  return `hsl(${hue} 55% ${88 - t * 10}%)`;
}

/* Column sort: accessor + type per sortable column key. Numeric columns
   compare as numbers; text columns compare with Norwegian collation. */
const SORT_ACCESSORS = {
  fase: (r) => r.fase,
  emne: (r) => `${r.code} ${r.name}`,
  alder: (r) => r.alder,
  students: (r) => r.students,
  overskudd: (r) => r.profit,
  kjop: (r) => r.antallKjop,
  portefolje: (r) => r.portefolje,
  nus: (r) => r.nusGruppe,
  nuskode: (r) => Number(r.nuskode),
  tiltak: (r) => r.action,
};
const SORT_TYPE = {
  fase: "string",
  emne: "string",
  alder: "number",
  students: "number",
  overskudd: "number",
  kjop: "number",
  portefolje: "string",
  nus: "string",
  nuskode: "number",
  tiltak: "string",
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
  const isNum = SORT_TYPE[sortKey] === "number";
  return rows.slice().sort((a, b) => {
    const av = get(a),
      bv = get(b);
    const cmp = isNum ? av - bv : String(av).localeCompare(String(bv), "nb");
    return sortDir === "desc" ? -cmp : cmp;
  });
}

function updateSortHeaders() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.setAttribute(
      "aria-sort",
      th.dataset.key === state.table.sortKey
        ? state.table.sortDir === "desc"
          ? "descending"
          : "ascending"
        : "none",
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
  document.querySelector("#resultCount").textContent =
    `Viser ${rows.length} av ${tableRows(false).length} emner for startår ${state.table.startYear}`;

  if (!rows.length) {
    body.innerHTML =
      '<tr class="empty-row"><td colspan="10">Ingen emner matcher filtrene.</td></tr>';
    return;
  }
  const maxStud = Math.max(...rows.map((r) => r.students), 1);
  const maxKjop = Math.max(...rows.map((r) => r.antallKjop), 1);
  const minA = Math.min(...rows.map((r) => r.alder)),
    maxA = Math.max(...rows.map((r) => r.alder));

  body.innerHTML = rows
    .map(
      (r) => `
    <tr data-code="${r.code}" tabindex="0" aria-label="Vis detaljer for ${r.name}">
      <td class="cell-left"><span class="fase-dot fase-${r.fase}"></span>${r.fase}</td>
      <td class="cell-left"><strong>${r.code}</strong> ${r.name}</td>
      <td style="background:${alderTint(r.alder, minA, maxA)}">${r.alder}</td>
      <td><div class="bar-cell"><span class="bar-track"><span class="bar-fill bar-fill--blue" style="width:${(r.students / maxStud) * 100}%"></span></span><span class="bar-value">${r.students.toLocaleString("nb-NO")}</span></div></td>
      <td>${formatNok(r.profit, true)}</td>
      <td><div class="bar-cell"><span class="bar-track"><span class="bar-fill bar-fill--green" style="width:${(r.antallKjop / maxKjop) * 100}%"></span></span><span class="bar-value">${r.antallKjop.toLocaleString("nb-NO")}</span></div></td>
      <td class="cell-left">${r.portefolje}</td>
      <td class="cell-left">${r.nusGruppe}</td>
      <td>${r.nuskode}</td>
      <td><span class="status-pill status-${r.action}">${r.action}</span></td>
    </tr>`,
    )
    .join("");

  body.querySelectorAll("tr[data-code]").forEach((tr) => {
    const activate = () => {
      const match = tableRows(false).find((r) => r.code === tr.dataset.code);
      selectCourse(match, "table");
    };
    tr.addEventListener("click", activate);
    tr.addEventListener("keydown", (e) => {
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
    document
      .querySelectorAll(".period-pill")
      .forEach((b) => b.classList.remove("active"));
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
  if (
    !filterePanel.hidden &&
    !filterePanel.contains(e.target) &&
    e.target !== filtereBtn
  ) {
    filterePanel.hidden = true;
    filtereBtn.setAttribute("aria-expanded", "false");
  }
});
document.querySelector("#areaFilter").addEventListener("change", (e) => {
  state.area = e.target.value;
  updateKpis();
  renderChart();
});

document.querySelector("#toggleSize").addEventListener("click", function () {
  state.toggles.size = !state.toggles.size;
  this.classList.toggle("active", state.toggles.size);
  this.setAttribute("aria-pressed", String(state.toggles.size));
  renderChart();
});
document
  .querySelector("#toggleRegression")
  .addEventListener("click", function () {
    state.toggles.regression = !state.toggles.regression;
    this.classList.toggle("active", state.toggles.regression);
    this.setAttribute("aria-pressed", String(state.toggles.regression));
    renderChart();
  });
document.querySelector("#toggleAge").addEventListener("click", function () {
  state.toggles.age = !state.toggles.age;
  this.classList.toggle("active", state.toggles.age);
  this.setAttribute("aria-pressed", String(state.toggles.age));
  renderChart();
});

document.querySelector("#startYearFilter").addEventListener("change", (e) => {
  state.table.startYear = Number(e.target.value);
  renderTable();
});
document.querySelector("#faseFilter").addEventListener("change", (e) => {
  state.table.fase = e.target.value;
  renderTable();
});
document.querySelector("#statusFilter").addEventListener("change", (e) => {
  state.table.status = e.target.value;
  renderTable();
});
document.querySelector("#instituttFilter").addEventListener("change", (e) => {
  state.table.institutt = e.target.value;
  renderTable();
});
document.querySelector("#portefoljeFilter").addEventListener("change", (e) => {
  state.table.portefolje = e.target.value;
  renderTable();
});
document.querySelector("#alderFilter").addEventListener("change", (e) => {
  state.table.alder = e.target.value;
  renderTable();
});
document.querySelector("#courseSearch").addEventListener("input", (e) => {
  state.table.search = e.target.value.trim().toLowerCase();
  renderTable();
});

document
  .querySelector("#closeInsight")
  .addEventListener("click", clearSelection);

/* Click anywhere outside a bubble, a table row, or the detail card itself
   clears the current selection (clicking another bubble/row just re-selects,
   handled by their own listeners before this one runs). */
document.addEventListener("click", (e) => {
  if (!state.selectedSource) return;
  if (
    e.target.closest(".bubble") ||
    e.target.closest("tr[data-code]") ||
    e.target.closest(".insight-card")
  )
    return;
  clearSelection();
});

document.querySelector("#resetFilters").addEventListener("click", () => {
  state.period = "3y";
  state.area = "Alle";
  state.table = {
    startYear: 2025,
    fase: "Alle",
    status: "Aktiv",
    institutt: "Alle",
    portefolje: "Alle",
    alder: "Alle",
    search: "",
    sortKey: null,
    sortDir: "asc",
  };
  state.toggles = { size: false, regression: true, age: false };
  document
    .querySelectorAll(".period-pill")
    .forEach((b) => b.classList.toggle("active", b.dataset.period === "3y"));
  document.querySelector("#areaFilter").value = "Alle";
  document.querySelector("#startYearFilter").value = "2025";
  document.querySelector("#faseFilter").value = "Alle";
  document.querySelector("#statusFilter").value = "Aktiv";
  document.querySelector("#instituttFilter").value = "Alle";
  document.querySelector("#portefoljeFilter").value = "Alle";
  document.querySelector("#alderFilter").value = "Alle";
  document.querySelector("#courseSearch").value = "";
  document.querySelector("#toggleSize").classList.remove("active");
  document.querySelector("#toggleSize").setAttribute("aria-pressed", "false");
  document.querySelector("#toggleRegression").classList.add("active");
  document
    .querySelector("#toggleRegression")
    .setAttribute("aria-pressed", "true");
  document.querySelector("#toggleAge").classList.remove("active");
  document.querySelector("#toggleAge").setAttribute("aria-pressed", "false");
  updateSortHeaders();
  clearSelection();
  renderAll();
});

renderAll();
