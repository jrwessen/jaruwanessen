/* ─────────────────────────────────────────────────────────────────────────
   Pelican University – porteføljecase
   Data: window.PELICAN_RESULTS (data/results.js), produced by scripts/analyze.py.
   This file only draws. All classes, signals and verdicts are computed in Python.
   Language: t(no, en) from i18n.js for UI text, PX.tr() from pelican-i18n.js
   for text that comes from the data. Class and course names stay Norwegian.

   Period buttons:
     Siste 12 måneder → totals for Høst 2025 + Vår 2026, change measured 2024/25 → 2025/26
     Siste 2 år       → totals for the last 4 semesters,  change measured 2023/24 → 2025/26
     Siste 3 år       → totals for all 6 semesters,       change measured 2023/24 → 2025/26
   ───────────────────────────────────────────────────────────────────────── */

const R = window.PELICAN_RESULTS;
const tr = (s) => (window.PX ? window.PX.tr(s) : s);
const sem = (s) => (window.PX ? window.PX.sem(s) : s);

/* analyze.py still writes the top class as "Handle nå". The site shows it as
   "Prioritert", so it is renamed once here instead of in every render call. */
const OLD_TOP = "Handle nå";
const TOP = "Prioritert";
(function renameTopClass(node) {
  if (!node || typeof node !== "object") return;
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (v === OLD_TOP) node[k] = TOP;
    else if (typeof v === "object") renameTopClass(v);
    if (k === OLD_TOP) {
      node[TOP] = node[k];
      delete node[k];
    }
  }
})(R);

const CLASS_ORDER = [TOP, "Følg med", "Stabil", "God utvikling", "Skalér"];
/* CSS modifier per class: .km--handle … .km--ikke (see styles.css, "Statusmerker") */
const CLASS_KEY = {
  [TOP]: "handle", "Følg med": "folg", Stabil: "stabil", "God utvikling": "god", Skalér: "skaler",
  "For lite datagrunnlag": "ikke", Inaktiv: "ikke",
};
const km = (cls) => `km--${CLASS_KEY[cls] || "ikke"}`;
const NOT_JUDGED = ["For lite datagrunnlag", "Inaktiv"];
const SVG_NS = "http://www.w3.org/2000/svg";

const PERIODS = {
  "12m": { no: "Siste 12 måneder", en: "Last 12 months", periods: [5, 6], horizon: "1y" },
  "2y": { no: "Siste 2 år", en: "Last 2 years", periods: [3, 4, 5, 6], horizon: "2y" },
  "3y": { no: "Siste 3 år", en: "Last 3 years", periods: [1, 2, 3, 4, 5, 6], horizon: "2y" },
};
const periodLabel = (key = state.period) => t(PERIODS[key].no, PERIODS[key].en);

/* ── Helpers ────────────────────────────────────────────────────────────── */
const $ = (sel) => document.querySelector(sel);
const fmt = (min, max) => new Intl.NumberFormat(LOCALE(), { minimumFractionDigits: min, maximumFractionDigits: max });
const nf0 = { format: (v) => fmt(0, 0).format(v) };
const nf1 = { format: (v) => fmt(1, 1).format(v) };
const nf2 = { format: (v) => fmt(2, 2).format(v) };

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function isNum(v) {
  return typeof v === "number" && !Number.isNaN(v);
}
function sign(v) {
  return v > 0 ? "+" : v < 0 ? "−" : "±";
}
function fmtSigned(v, unit = "%", digits = 0) {
  if (!isNum(v)) return "–";
  const f = digits ? nf1 : nf0;
  return `${sign(v)}${f.format(Math.abs(v))}${unit === "pp" ? " pp" : " %"}`;
}
function fmtNok(v, compact = true) {
  if (!isNum(v)) return "–";
  const s = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (compact && a >= 1e6) return t(`${s}${nf1.format(a / 1e6)} mill. kr`, `NOK ${s}${nf1.format(a / 1e6)}M`);
  if (compact && a >= 1e4) return t(`${s}${nf0.format(Math.round(a / 1000))}k kr`, `NOK ${s}${nf0.format(Math.round(a / 1000))}k`);
  return t(`${s}${nf0.format(a)} kr`, `NOK ${s}${nf0.format(a)}`);
}
function svgEl(name, attrs = {}, text) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (text !== undefined) el.textContent = text;
  return el;
}
function clearSvg(svg) {
  svg.querySelectorAll(":scope > :not(title):not(desc)").forEach((n) => n.remove());
}
function niceStep(max) {
  const raw = max / 6;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw);
}
function judged(c) {
  return !NOT_JUDGED.includes(c.matrix_class);
}
function goodness(change, direction, threshold) {
  if (!isNum(change) || Math.abs(change) < threshold) return 0;
  return Math.sign(change) === direction ? 1 : -1;
}
function arrowSpan(change, direction, threshold, unit, digits = 0) {
  const g = goodness(change, direction, threshold);
  const cls = g > 0 ? "chg-good" : g < 0 ? "chg-bad" : "chg-flat";
  const glyph = !isNum(change) ? "" : change > 0 ? "▲" : change < 0 ? "▼" : "▬";
  return `<span class="${cls}">${glyph} ${fmtSigned(change, unit, digits)}</span>`;
}
function pillHtml(c) {
  return `<span class="km-pill ${km(c.matrix_class)}">${esc(judged(c) ? c.matrix_class : t("Ikke vurdert", "Not assessed"))}</span>`;
}
const emner = (n) => (n === 1 ? t("emne", "course") : t("emner", "courses"));

/* ── State and data access ──────────────────────────────────────────────── */
const RULES = R ? R.meta.rules : {};
const seqByCode = R ? Object.fromEntries(R.q3_sequences.courses.map((s) => [s.course_code, s.events])) : {};

const DEFAULT_TABLE = { cls: "Alle", portefolje: "Alle", institutt: "Alle", search: "", sortKey: null, sortDir: "asc" };
const state = {
  view: "prioritet",
  period: "3y",
  area: "Alle",
  selected: null,
  patterns: false,
  heatSort: { key: null, dir: "desc" },
  segment: "type",
  marketGroup: "6411",
  qualityExample: "TEK2611",
  table: { ...DEFAULT_TABLE },
};

const P = () => PERIODS[state.period];
const horizon = () => R.horizons[P().horizon];
/* Courses for the current period's comparison, with window totals added */
function allCourses(periodKey = state.period) {
  const per = PERIODS[periodKey];
  return R.horizons[per.horizon].courses.map((c) => {
    const cp = R.course_periods[c.course_code];
    const sum = (k) => (cp ? per.periods.reduce((tot, p) => tot + cp[k][p - 1], 0) : 0);
    return {
      ...c,
      win_students: sum("students_enrolled"),
      win_completed: sum("students_completed"),
      win_dropped: sum("students_dropped"),
      win_revenue: sum("revenue_nok"),
      win_contribution: sum("contribution_nok"),
    };
  });
}
function courses() {
  return allCourses().filter((c) => state.area === "Alle" || c.fagomrade === state.area);
}
function course(code) {
  return allCourses().find((c) => c.course_code === code);
}
function periodText() {
  const per = R.meta.periods;
  const lab = (i) => sem(per.find((x) => x.period_index === i).semester_label);
  const ps = P().periods;
  return `${lab(ps[0])} – ${lab(ps[ps.length - 1])}`;
}
function areaBadge() {
  return state.area === "Alle" ? "" : `<span class="area-badge">${esc(tr(state.area))}</span>`;
}

/* ── KPI cards ──────────────────────────────────────────────────────────── */
function renderKpis() {
  const cs = courses();
  const sum = (k) => cs.reduce((s, c) => s + (c[k] || 0), 0);
  const enrolled = sum("win_students");
  const act = cs.filter((c) => c.matrix_class === TOP).length;
  const watch = cs.filter((c) => c.matrix_class === "Følg med").length;
  const pl = periodLabel().toLowerCase();

  $("#kpiContribution").textContent = fmtNok(sum("win_contribution"));
  $("#kpiContributionNote").textContent = t(`Inntekt minus driftskostnad · ${pl}`, `Revenue minus operating cost · ${pl}`);
  $("#kpiStudents").textContent = nf0.format(sum("win_completed"));
  $("#kpiStudentsNote").textContent = t(`Av ${nf0.format(enrolled)} påmeldte · ${pl}`, `Of ${nf0.format(enrolled)} enrolled · ${pl}`);
  $("#kpiDropout").textContent = enrolled ? `${nf1.format((sum("win_dropped") / enrolled) * 100)} %` : "–";
  $("#kpiDropoutNote").textContent = t(`${nf0.format(sum("win_dropped"))} sluttet før eksamen`, `${nf0.format(sum("win_dropped"))} left before the exam`);
  $("#kpiAttention").textContent = nf0.format(act + watch);
  $("#kpiAttentionNote").textContent = t(`${act} ${TOP.toLowerCase()} · ${watch} følg med`, `${act} ${TOP} · ${watch} Følg med`);

  $("#windowLabel").textContent = `${periodLabel()}: ${periodText()}`;
  const since = P().horizon === "1y" ? t("året før", "the year before") : t("første studieår", "the first academic year");
  $("#periodExplain").textContent =
    t(`Tall summeres for ${periodText()}. Endring måles ${horizon().label} (siste studieår mot ${since}).`,
      `Figures are summed for ${periodText()}. Change is measured ${horizon().label} (latest academic year vs ${since}).`) +
    (state.area === "Alle" ? "" : t(` Viser fagområde ${state.area}.`, ` Showing subject area ${tr(state.area)}.`));
  $("#filtereBtn").classList.toggle("has-filter", state.area !== "Alle");
  $("#filtereBtn").textContent = state.area === "Alle" ? t("Filtere", "Filters") : `${t("Filtere", "Filters")} · ${tr(state.area)}`;
}

/* ── Tabs ───────────────────────────────────────────────────────────────── */
function setView(view) {
  state.view = view;
  document.querySelectorAll(".view-tab").forEach((tab) => {
    const on = tab.dataset.view === view;
    tab.classList.toggle("active", on);
    tab.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".view-panel").forEach((p) => (p.hidden = p.id !== `view-${view}`));
  renderView();
}
function renderView() {
  if (state.view === "prioritet") { renderMatrix(); if (state.selected) renderDetail(); else renderOverview(); }
  if (state.view === "endringer") { renderHeatmap(); renderPatternCard(); }
  if (state.view === "frafall") { renderRetention(); renderWeekChart(); renderDropoutCard(); }
  if (state.view === "marked") { renderMarketSelect(); renderMarketChart(); renderMarketCard(); }
}
function renderAll() {
  renderKpis();
  renderView();
  renderTable();
}

/* ── Q6: matrix ─────────────────────────────────────────────────────────── */
function renderLegend() {
  const el = $("#classLegend");
  el.className = "km-legend";
  el.innerHTML = CLASS_ORDER.slice().reverse()
    .map((c) => `<span class="km-legend-item ${km(c)}"><i class="km-dot" aria-hidden="true"></i>${c}</span>`).join("");
}

function renderMatrix() {
  const svg = $("#portfolioChart");
  clearSvg(svg);
  $("#matrixSubtitle").textContent = t(
    `Netto signaler (${horizon().label}) × studenter ${periodLabel().toLowerCase()}`,
    `Net signals (${horizon().label}) × students, ${periodLabel().toLowerCase()}`);
  const W = 760, H = 450;
  const pad = { l: 64, r: 24, t: 34, b: 56 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const rows = courses().filter(judged);
  if (!rows.length) return;
  const xMin = -9, xMax = 9;
  const maxY = Math.max(...rows.map((c) => c.win_students));
  const step = niceStep(maxY * 1.08);
  const yMax = Math.ceil((maxY * 1.08) / step) * step;
  const x = (v) => pad.l + ((v - xMin) / (xMax - xMin)) * pw;
  const y = (v) => pad.t + (1 - v / yMax) * ph;
  const maxRev = Math.max(...rows.map((c) => c.win_revenue), 1);
  const r = (rev) => 5 + Math.sqrt(rev / maxRev) * 15;

  svg.appendChild(svgEl("rect", { x: pad.l, y: pad.t, width: x(0) - pad.l, height: ph, class: "zone-bad" }));
  svg.appendChild(svgEl("rect", { x: x(0), y: pad.t, width: pad.l + pw - x(0), height: ph, class: "zone-good" }));
  for (let v = xMin; v <= xMax; v += 3) {
    svg.appendChild(svgEl("line", { x1: x(v), y1: pad.t, x2: x(v), y2: pad.t + ph, class: v === 0 ? "grid-zero" : "grid" }));
    svg.appendChild(svgEl("text", { x: x(v), y: pad.t + ph + 18, "text-anchor": "middle", class: "axis-text" }, v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "0"));
  }
  for (let v = 0; v <= yMax; v += step) {
    svg.appendChild(svgEl("line", { x1: pad.l, y1: y(v), x2: pad.l + pw, y2: y(v), class: "grid" }));
    svg.appendChild(svgEl("text", { x: pad.l - 10, y: y(v) + 4, "text-anchor": "end", class: "axis-text" }, nf0.format(v)));
  }
  const sorted = rows.map((c) => c.win_students).sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  svg.appendChild(svgEl("line", { x1: pad.l, y1: y(med), x2: pad.l + pw, y2: y(med), class: "median-line" }));
  svg.appendChild(svgEl("text", { x: pad.l + pw - 4, y: y(med) - 5, "text-anchor": "end", class: "median-label" }, t(`Median ${nf0.format(med)} studenter`, `Median ${nf0.format(med)} students`)));
  svg.appendChild(svgEl("text", { x: pad.l + pw / 2, y: H - 10, "text-anchor": "middle", class: "axis-title" }, t("Netto signaler: antall bedre minus antall svakere (av 9)", "Net signals: number better minus number weaker (of 9)")));
  svg.appendChild(svgEl("text", { x: 16, y: pad.t + ph / 2, transform: `rotate(-90 16 ${pad.t + ph / 2})`, "text-anchor": "middle", class: "axis-title" }, t(`Studenter, ${periodLabel().toLowerCase()}`, `Students, ${periodLabel().toLowerCase()}`)));
  [[pad.l + 8, "start", t("SVEKKES", "WEAKENING")], [pad.l + pw - 8, "end", t("STYRKES", "STRENGTHENING")]]
    .forEach(([cx, a, txt]) => svg.appendChild(svgEl("text", { x: cx, y: pad.t - 12, "text-anchor": a, class: "quad-label" }, txt)));

  // nudge bubbles that share an x value and overlap
  const placed = [], pos = {};
  const order = rows.slice().sort((a, b) => b.win_revenue - a.win_revenue);
  order.forEach((c) => {
    let dx = 0;
    for (const o of [0, 0.32, -0.32, 0.6, -0.6]) {
      const px = x(c.net_score + o), py = y(c.win_students);
      dx = o;
      if (!placed.some((p) => Math.hypot(p.x - px, p.y - py) < p.r + r(c.win_revenue) - 4)) break;
    }
    const p = { x: x(c.net_score + dx), y: y(c.win_students), r: r(c.win_revenue) };
    placed.push(p);
    pos[c.course_code] = p;
  });

  order.forEach((c) => {
    const p = pos[c.course_code];
    const sel = state.selected;
    const circle = svgEl("circle", {
      cx: p.x, cy: p.y, r: p.r,
      class: `bubble km-bubble ${km(c.matrix_class)}${sel && sel !== c.course_code ? " dimmed" : ""}${sel === c.course_code ? " selected" : ""}`,
      tabindex: 0, role: "button",
      "aria-label": `${c.course_name}: ${c.matrix_class}, ${t("netto", "net")} ${c.net_score}, ${c.win_students} ${t("studenter", "students")}`,
    });
    const showTip = () => {
      const tip = $("#chartTooltip");
      tip.innerHTML = `<strong>${esc(c.course_name)}</strong>${esc(c.matrix_class)} · ${t("netto", "net")} ${c.net_score > 0 ? "+" : ""}${c.net_score} · ${nf0.format(c.win_students)} ${t("studenter", "students")}`;
      tip.hidden = false;
      const box = svg.getBoundingClientRect();
      const lx = (p.x / W) * box.width, ly = (p.y / H) * box.height;
      tip.style.left = `${Math.min(Math.max(4, lx + 14), box.width - 190)}px`;
      tip.style.top = `${Math.max(4, ly - 30)}px`;
    };
    const hideTip = () => ($("#chartTooltip").hidden = true);
    circle.addEventListener("mouseenter", showTip);
    circle.addEventListener("focus", showTip);
    circle.addEventListener("mouseleave", hideTip);
    circle.addEventListener("blur", hideTip);
    circle.addEventListener("click", (e) => { e.stopPropagation(); selectCourse(c.course_code); });
    circle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCourse(c.course_code); }
    });
    svg.appendChild(circle);
  });

  // labels: top priority, big scalers, the biggest courses and the selected one
  const big = sorted[Math.floor(sorted.length * 0.85)];
  const boxes = [];
  const wantLabel = (c) => c.course_code === state.selected || c.matrix_class === TOP ||
    (c.matrix_class === "Skalér" && c.win_students >= med) || c.win_students >= big;
  order.filter(wantLabel).sort((a, b) => b.win_students - a.win_students).forEach((c) => {
    const p = pos[c.course_code];
    const right = p.x < pad.l + pw * 0.72;
    const tx = right ? p.x + p.r + 5 : p.x - p.r - 5;
    let ty = p.y + 4;
    const w = c.course_name.length * 5.6, h = 12;
    const bx = () => (right ? tx : tx - w);
    for (let i = 0; i < 6; i++) {
      if (!boxes.some((b) => bx() < b.x + b.w && bx() + w > b.x && ty - h < b.y && ty > b.y - b.h)) break;
      ty += 12;
    }
    boxes.push({ x: bx(), y: ty, w, h });
    const dim = state.selected && state.selected !== c.course_code;
    svg.appendChild(svgEl("text", { x: tx, y: ty, "text-anchor": right ? "start" : "end", class: `bubble-label km-bubble-label${dim ? " dimmed" : ""}` }, c.course_name));
  });

  svg.onclick = () => { if (state.selected) clearSelection(); };

  const nj = courses().filter((c) => !judged(c));
  $("#notJudgedNote").innerHTML = nj.length
    ? `<i class="dash-swatch" aria-hidden="true"></i> ${t("Ikke vurdert", "Not assessed")} (${nj.length}): ` +
      nj.map((c) => `${esc(c.course_code)} ${esc(c.course_name)} – ${esc(tr(c.data_note || c.matrix_class).toLowerCase())}`).join(" · ")
    : "";
}

function shortReason(c) {
  if (c.decline_type === "Markedsdrevet – taper andel")
    return t(`Taper andel: ${fmtSigned(c.chg_students)} studenter, marked ${fmtSigned(c.market_growth_pct)}`,
      `Losing share: ${fmtSigned(c.chg_students)} students, market ${fmtSigned(c.market_growth_pct)}`);
  if (c.decline_type === "Kvalitetsdrevet") return t(`Tilfredsheten falt først (${c.survey_onset})`, `Satisfaction fell first (${sem(c.survey_onset)})`);
  if (c.revision_verdict) return tr(c.revision_verdict);
  if (c.signals_bad >= c.signals_good && c.bad_metrics) return t(`Svakere på ${c.bad_metrics.toLowerCase()}`, `Weaker on ${tr(c.bad_metrics).toLowerCase()}`);
  if (c.good_metrics) return t(`Bedre på ${c.good_metrics.toLowerCase()}`, `Better on ${tr(c.good_metrics).toLowerCase()}`);
  return t("Ingen tydelige endringer", "No clear changes");
}
function overviewList(list) {
  if (!list.length) return `<p class="muted-sm">${t("Ingen emner i denne klassen.", "No courses in this class.")}</p>`;
  return `<ul class="pick-list">${list.map((c) => `<li><button type="button" data-code="${c.course_code}">
      <i class="km-dot ${km(c.matrix_class)}" aria-hidden="true"></i>
      <span class="pl-name">${esc(c.course_name)}</span>
      <span class="pl-num">${nf0.format(c.win_students)}</span>
      <span class="pl-why">${esc(shortReason(c))}</span></button></li>`).join("")}</ul>`;
}
function renderOverview() {
  const cs = courses();
  const act = cs.filter((c) => c.matrix_class === TOP).sort((a, b) => b.win_students - a.win_students);
  const watch = cs.filter((c) => c.matrix_class === "Følg med").sort((a, b) => b.win_students - a.win_students);
  const scale = cs.filter((c) => c.matrix_class === "Skalér").sort((a, b) => b.win_students - a.win_students);
  const market = cs.filter((c) => c.decline_type === "Markedsdrevet – taper andel");
  const quality = cs.filter((c) => c.decline_type === "Kvalitetsdrevet");
  const lost = market.reduce((s, c) => s + (c.students_baseline - c.students_latest), 0);
  const parts = [];
  if (market.length) parts.push(t(
    `${market.length} ${emner(market.length)} taper andel i et voksende marked (${nf0.format(lost)} færre studenter)`,
    `${market.length} ${emner(market.length)} losing share in a growing market (${nf0.format(lost)} fewer students)`));
  if (quality.length) parts.push(t(
    `${quality.length} ${emner(quality.length)} der kvaliteten falt før studenttallet`,
    `${quality.length} ${emner(quality.length)} where quality fell before enrolment`));
  const n = act.length + watch.length;
  $("#insightOverview").hidden = false;
  $("#insightContent").hidden = true;
  $("#insightOverview").innerHTML = `
    <p class="kicker-sm">${t("Start her", "Start here")} ${areaBadge()}</p>
    <h4 class="ov-title">${n} ${emner(n)} ${t("krever oppfølging", "need follow-up")}</h4>
    <p class="ov-text">${parts.length ? `${parts.join(t(", og ", ", and "))}.` : t("Ingen tydelige nedgangsmønstre i utvalget.", "No clear decline patterns in this selection.")}</p>
    ${overviewList([...act, ...watch].slice(0, 7))}
    <p class="kicker-sm ov-gap">${t("Sats videre", "Invest further")}</p>
    ${overviewList(scale.slice(0, 4))}
    <p class="ov-foot">${t("Klikk en boble eller et emne for detaljer.", "Click a bubble or a course for details.")}</p>`;
  $("#insightOverview").querySelectorAll("button[data-code]").forEach((b) =>
    b.addEventListener("click", () => selectCourse(b.dataset.code)));
}

function metricRow(label, value, change) {
  return `<div class="dm-row"><span>${label}</span><strong>${value}${change ? ` <em>${change}</em>` : ""}</strong></div>`;
}
function selectCourse(code) {
  if (!course(code)) return;
  state.selected = code;
  if (state.view !== "prioritet") setView("prioritet");
  else { renderMatrix(); renderDetail(); }
}
function renderDetail() {
  const c = course(state.selected);
  if (!c) return clearSelection();
  $("#insightOverview").hidden = true;
  $("#insightContent").hidden = false;
  const pill = $("#detailClass");
  pill.textContent = judged(c) ? c.matrix_class : t("Ikke vurdert", "Not assessed");
  pill.className = `km-pill ${km(c.matrix_class)}`;
  $("#detailPortfolio").textContent = tr(c.portefolje);
  $("#detailName").textContent = c.course_name;
  $("#detailCode").textContent = `${c.course_code} · ${tr(c.institutt)} · ${nf1.format(c.studiepoeng)} ${t("sp", "ECTS")}`;
  $("#detailVerdict").textContent = tr(c.verdict);
  const thr = RULES.relative_threshold * 100, pp = RULES.rate_threshold_pp;
  const pl = periodLabel().toLowerCase();
  $("#detailMetrics").innerHTML = [
    metricRow(t(`Studenter, ${pl}`, `Students, ${pl}`), nf0.format(c.win_students), ""),
    metricRow(t(`Endring studenter (${horizon().label})`, `Change in students (${horizon().label})`), "", arrowSpan(c.chg_students, 1, thr, "%")),
    metricRow(t("Studenttilfredshet", "Student satisfaction"), isNum(c.student_survey_latest) ? `${nf2.format(c.student_survey_latest)} / 5` : "–", arrowSpan(c.chg_student_survey, 1, thr, "%", 1)),
    metricRow(t("Frafall", "Dropout"), isNum(c.dropout_rate_latest) ? `${nf1.format(c.dropout_rate_latest)} %` : "–", arrowSpan(c.chg_dropout_rate, -1, pp, "pp", 1)),
    metricRow(t("Bestått", "Pass rate"), isNum(c.pass_rate_latest) ? `${nf1.format(c.pass_rate_latest)} %` : "–", arrowSpan(c.chg_pass_rate, 1, pp, "pp", 1)),
    metricRow(t("Kostnad per student", "Cost per student"), fmtNok(c.cost_per_student_latest_nok, false), arrowSpan(c.chg_cost_per_student, -1, thr, "%")),
    metricRow(t("Markedet for faget", "Market for the subject"), fmtSigned(c.market_growth_pct), ""),
    metricRow(t(`Dekningsbidrag, ${pl}`, `Contribution margin, ${pl}`), fmtNok(c.win_contribution), ""),
  ].join('<div class="dm-sep"></div>');
  const events = seqByCode[c.course_code] || [];
  const chips = [c.cost_quality_pattern, c.revision_verdict, c.exam_change ? "Eksamensform endret" : ""]
    .filter((v) => v && v !== "Uendret").map((v) => `<span class="chip">${esc(tr(v))}</span>`).join("");
  $("#detailTimeline").innerHTML = `
    ${chips ? `<div class="chip-row">${chips}</div>` : ""}
    <p class="kicker-sm">${t("Hva skjedde først", "What happened first")}</p>
    ${events.length ? timelineHtml(events) : `<p class="muted-sm">${judged(c) ? t("Ingen varige endringer over terskel.", "No lasting changes above the threshold.") : esc(tr(c.data_note || c.matrix_class))}</p>`}`;
}
function timelineHtml(events) {
  const good = ["Studentundersøkelse opp", "Studenter opp (mot året før)", "Revisjonsbølge"];
  return `<ol class="timeline-mini">${events.map((e) => {
    const unit = e.unit === "poeng" ? t(" poeng", " points") : e.unit === "pp" ? " pp" : e.unit === "saker" ? t(" saker", " tickets") : " %";
    const v = e.unit === "saker" ? `${e.value_at_onset}${unit}` : `${sign(e.value_at_onset)}${nf1.format(Math.abs(e.value_at_onset))}${unit}`;
    return `<li class="${good.includes(e.metric) ? "tl-good" : "tl-bad"}"><span class="tl-when">${esc(sem(e.onset_label))}</span><span class="tl-what">${esc(tr(e.metric))}</span><span class="tl-val">${v}</span></li>`;
  }).join("")}</ol>`;
}
function clearSelection() {
  state.selected = null;
  if (state.view === "prioritet") { renderMatrix(); renderOverview(); }
}

/* ── Q3: heatmap + patterns ─────────────────────────────────────────────── */
const SHORT = {
  students: ["Studenter", "Students"],
  pass_rate: ["Bestått", "Pass rate"],
  dropout_rate: ["Frafall", "Dropout"],
  student_survey: ["Student&shy;undersøkelse", "Student survey"],
  course_leader: ["Emne&shy;ansvarlig", "Course leader"],
  editorial: ["Redaksjon", "Editorial"],
  cost_per_student: ["Kostnad/ student", "Cost/ student"],
  revision_cost: ["Revisjon", "Revision"],
  market_relative: ["Mot marked", "Vs market"],
};
function heatSortHeader(key, label, left = false) {
  const s = state.heatSort;
  const aria = s.key === key ? (s.dir === "desc" ? "descending" : "ascending") : "none";
  return `<th scope="col" class="sortable${left ? " th-left" : ""}" data-hkey="${key}" tabindex="0" role="button" aria-sort="${aria}">${label}<span class="sort-indicator" aria-hidden="true"></span></th>`;
}
function renderHeatmap() {
  $("#heatSubtitle").textContent = t(`Endring ${horizon().label} · grønt = bedre, rødt = svakere`, `Change ${horizon().label} · green = better, red = weaker`);
  const metrics = R.meta.metrics;
  const cells = {};
  horizon().heatmap.forEach((h) => ((cells[h.course_code] ||= {})[h.metric] = h));

  /* Default order: assessed courses first, biggest first. A clicked column
     sorts by that column; empty cells always go last. */
  const s = state.heatSort;
  const value = (c) => {
    if (s.key === "emne") return `${c.course_code} ${c.course_name}`;
    if (s.key === "stud") return c.win_students;
    const h = cells[c.course_code] && cells[c.course_code][s.key];
    return judged(c) && h && isNum(h.change) ? h.change : null;
  };
  const rows = courses().sort((a, b) => {
    if (!s.key) return (judged(b) - judged(a)) || b.win_students - a.win_students;
    const va = value(a), vb = value(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    const cmp = typeof va === "string" ? va.localeCompare(vb, "nb") : va - vb;
    return s.dir === "desc" ? -cmp : cmp;
  });

  const head = `<thead><tr>${heatSortHeader("emne", t("Emne", "Course"), true)}${heatSortHeader("stud", t("Stud.", "Stud."))}${metrics
    .map((m) => heatSortHeader(m.key, t(...SHORT[m.key]))).join("")}</tr></thead>`;
  const body = rows.map((c) => {
    const pat = state.patterns
      ? c.decline_type === "Markedsdrevet – taper andel" ? "pat-market" : c.decline_type === "Kvalitetsdrevet" ? "pat-quality" : ""
      : "";
    const badge = pat ? `<b class="pat-badge ${pat}">${pat === "pat-market" ? "1" : "2"}</b>` : "";
    const tds = metrics.map((m) => {
      if (!judged(c)) return `<td class="hc hc-na">–</td>`;
      const h = cells[c.course_code][m.key];
      const unit = h.unit === "pp" ? " pp" : " %";
      const val = isNum(h.change) ? `${sign(h.change)}${(h.unit === "pp" ? nf1 : nf0).format(Math.abs(h.change))}${unit}` : "–";
      const lbl = tr(m.label);
      if (h.goodness === 0) return `<td class="hc hc-flat" title="${esc(lbl)}: ${val} (${t("under terskel", "below threshold")})">·</td>`;
      return `<td class="hc ${h.goodness > 0 ? "good" : "bad"}-${h.magnitude}" title="${esc(lbl)}: ${val}">${val}</td>`;
    }).join("");
    return `<tr class="${pat} ${judged(c) ? "" : "row-nj"}" data-code="${c.course_code}" tabindex="0">
      <td class="cell-left hc-name">${badge}<strong>${esc(c.course_code)}</strong> ${esc(c.course_name)}${judged(c) ? "" : ` <em>${esc(tr(c.data_note || c.matrix_class).toLowerCase())}</em>`}</td>
      <td>${nf0.format(c.win_students)}</td>${tds}</tr>`;
  }).join("");
  $("#heatTable").innerHTML = head + `<tbody>${body}</tbody>`;
  $("#heatTable").querySelectorAll("th[data-hkey]").forEach((th) => {
    const go = () => handleHeatSort(th.dataset.hkey);
    th.addEventListener("click", go);
    th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  $("#heatTable").querySelectorAll("tr[data-code]").forEach((tr) => {
    tr.addEventListener("click", () => selectCourse(tr.dataset.code));
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") selectCourse(tr.dataset.code); });
  });
}
/* Click: sort descending (biggest increase first; course name A–Å),
   click again: ascending, third click: back to the default order. */
function handleHeatSort(key) {
  const s = state.heatSort;
  const first = key === "emne" ? "asc" : "desc";
  if (s.key !== key) state.heatSort = { key, dir: first };
  else if (s.dir === first) state.heatSort = { key, dir: first === "asc" ? "desc" : "asc" };
  else state.heatSort = { key: null, dir: "desc" };
  renderHeatmap();
  const th = $(`#heatTable th[data-hkey="${key}"]`);
  if (th) th.focus({ preventScroll: true });
}
function renderPatternCard() {
  const cs = courses();
  const market = cs.filter((c) => c.decline_type === "Markedsdrevet – taper andel").sort((a, b) => b.win_students - a.win_students);
  const quality = cs.filter((c) => c.decline_type === "Kvalitetsdrevet");
  if (quality.length && !quality.some((c) => c.course_code === state.qualityExample)) state.qualityExample = quality[0].course_code;
  const ew = R.q3_sequences.early_warning;
  const followed = Math.round((ew.share_followed_by_enrolment_drop / 100) * ew.courses_with_survey_drop);
  const none = `<p class="muted-sm">${t("Ingen emner i dette utvalget.", "No courses in this selection.")}</p>`;
  $("#patternCard").innerHTML = `
    <h4 class="ov-title">${t("To typer nedgang", "Two kinds of decline")} ${areaBadge()}</h4>
    <p class="ov-text">${t("Trykk «Fremhev mønstre» for å se dem i tabellen. Klikk en kolonne for å sortere.", "Press “Highlight patterns” to see them in the table. Click a column to sort.")}</p>
    <div class="pattern">
      <p class="pattern-head"><b class="pat-badge pat-market">1</b>${t("Markedet vokser, emnet taper andel", "The market grows, the course loses share")}</p>
      <p class="muted-sm">${t("Studenttilfredsheten holder seg. Problemet er synlighet eller konkurranse, ikke kvalitet.", "Student satisfaction holds. The problem is visibility or competition, not quality.")}</p>
      ${market.length ? `<ul class="mini-list">${market.map((c) => `<li><span>${esc(c.course_name)}</span><span class="chg-bad">${fmtSigned(c.chg_students)}</span><span class="muted-sm">${t("marked", "market")} ${fmtSigned(c.market_growth_pct)}</span></li>`).join("")}</ul>` : none}
    </div>
    <div class="pattern">
      <p class="pattern-head"><b class="pat-badge pat-quality">2</b>${t("Kvaliteten faller først", "Quality falls first")}</p>
      <p class="muted-sm">${t(
        `I hele porteføljen: i ${followed} av ${ew.courses_with_survey_drop} emner der studenttilfredsheten falt, fulgte studenttallet etter. Blant emner uten fall i tilfredshet gjaldt det ${nf1.format(ew.share_with_enrolment_drop_anyway)} %.`,
        `Across the portfolio: in ${followed} of ${ew.courses_with_survey_drop} courses where student satisfaction fell, enrolment followed. Among courses without a drop in satisfaction, it was ${nf1.format(ew.share_with_enrolment_drop_anyway)} %.`)}</p>
      ${quality.length ? `<div class="seg-row" role="group" aria-label="${t("Velg eksempel", "Choose example")}">${quality.map((c) => `<button type="button" class="toggle-pill${c.course_code === state.qualityExample ? " active" : ""}" data-ex="${c.course_code}">${esc(c.course_name)}</button>`).join("")}</div>
      ${timelineHtml(seqByCode[state.qualityExample] || [])}` : none}
    </div>
    <p class="ov-foot">${t("Rekkefølge er ikke bevis for årsak, men et tidlig varsel ledelsen kan handle på.", "Order is not proof of cause, but an early warning management can act on.")}</p>`;
  $("#patternCard").querySelectorAll("button[data-ex]").forEach((b) =>
    b.addEventListener("click", () => { state.qualityExample = b.dataset.ex; renderPatternCard(); }));
}

/* ── Q1: retention ──────────────────────────────────────────────────────── */
const SEGMENTS = {
  type: ["Alle", "Enkeltemne", "Studieprogram"],
  returning: ["Alle", "Ny kunde", "Tilbakevendende kunde"],
  age: ["20–29", "30–39", "40–49", "50+"],
};
const SEG_COLORS = ["#226b56", "#c35a31", "#c99d48", "#5b7f9e"];
const q1 = () => (state.area === "Alle" ? R.q1_dropout : R.q1_dropout.by_area[state.area]);

function renderRetention() {
  const svg = $("#retentionChart");
  clearSvg(svg);
  const W = 760, H = 300, pad = { l: 52, r: 170, t: 18, b: 40 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const curves = SEGMENTS[state.segment].map((s) => q1().curves.find((c) => c.segment === s)).filter((c) => c && c.n);
  const yMin = Math.floor(Math.min(...curves.flatMap((c) => c.active_pct_by_week)) / 2) * 2 - 2;
  const x = (w) => pad.l + (w / 20) * pw;
  const y = (v) => pad.t + (1 - (v - yMin) / (100 - yMin)) * ph;
  svg.appendChild(svgEl("rect", { x: x(0), y: pad.t, width: x(6) - x(0), height: ph, class: "zone-early" }));
  svg.appendChild(svgEl("text", { x: x(3), y: pad.t + 14, "text-anchor": "middle", class: "zone-label" },
    t(`Uke 1–6: ${nf0.format(q1().share_of_dropouts_weeks_1_6)} % av frafallet`, `Weeks 1–6: ${nf0.format(q1().share_of_dropouts_weeks_1_6)} % of dropouts`)));
  svg.appendChild(svgEl("line", { x1: x(2), y1: pad.t + 20, x2: x(2), y2: pad.t + ph, class: "median-line" }));
  svg.appendChild(svgEl("text", { x: x(2) + 4, y: pad.t + ph - 6, class: "median-label" }, t("Angrefrist", "Withdrawal period")));
  for (let v = yMin; v <= 100; v += 2) {
    svg.appendChild(svgEl("line", { x1: pad.l, y1: y(v), x2: pad.l + pw, y2: y(v), class: "grid" }));
    svg.appendChild(svgEl("text", { x: pad.l - 8, y: y(v) + 4, "text-anchor": "end", class: "axis-text" }, `${v} %`));
  }
  for (let w = 0; w <= 20; w += 2) svg.appendChild(svgEl("text", { x: x(w), y: pad.t + ph + 18, "text-anchor": "middle", class: "axis-text" }, w));
  svg.appendChild(svgEl("text", { x: pad.l + pw / 2, y: H - 4, "text-anchor": "middle", class: "axis-title" },
    t("Uke etter semesterstart (eksamen etter uke 20)", "Week after semester start (exam after week 20)")));
  const ends = [];
  curves.forEach((c, i) => {
    const color = c.segment === "Alle" ? "#8a9490" : SEG_COLORS[i % SEG_COLORS.length];
    const d = c.active_pct_by_week.map((v, w) => `${w ? "L" : "M"}${x(w).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    svg.appendChild(svgEl("path", { d, fill: "none", stroke: color, "stroke-width": c.segment === "Alle" ? 1.6 : 2.4, "stroke-dasharray": c.segment === "Alle" ? "5 4" : "none" }));
    const last = c.active_pct_by_week[20];
    svg.appendChild(svgEl("circle", { cx: x(20), cy: y(last), r: 3.5, fill: color }));
    ends.push({ y: y(last), text: `${tr(c.segment)} · ${nf1.format(c.dropout_rate)} % ${t("slutter", "drop out")}`, color });
  });
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
  ends.forEach((e) => svg.appendChild(svgEl("text", { x: x(20) + 8, y: e.y + 4, class: "end-label", fill: e.color }, e.text)));
}
function renderWeekChart() {
  const svg = $("#weekChart");
  clearSvg(svg);
  const W = 760, H = 170, pad = { l: 52, r: 170, t: 40, b: 30 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const data = q1().dropouts_by_week;
  const max = Math.max(...data.map((d) => d.dropouts), 1);
  const bw = pw / 20;
  svg.appendChild(svgEl("text", { x: pad.l, y: 14, class: "axis-title" }, t("Antall som slutter per uke", "Number who drop out per week")));
  data.forEach((d) => {
    const h = (d.dropouts / max) * ph;
    const bx = pad.l + d.week * bw - bw * 0.8;
    svg.appendChild(svgEl("rect", { x: bx, y: pad.t + ph - h, width: bw * 0.6, height: h, rx: 2, class: d.week <= 6 ? "bar-early" : "bar-late" }));
    if (d.week <= 6) svg.appendChild(svgEl("text", { x: bx + bw * 0.3, y: pad.t + ph - h - 4, "text-anchor": "middle", class: "axis-text" }, nf0.format(d.dropouts)));
    if (d.week % 2 === 0 || d.week === 1) svg.appendChild(svgEl("text", { x: bx + bw * 0.3, y: pad.t + ph + 16, "text-anchor": "middle", class: "axis-text" }, d.week));
  });
  svg.appendChild(svgEl("line", { x1: pad.l, y1: pad.t + ph, x2: pad.l + pw, y2: pad.t + ph, class: "grid-zero" }));
}
function renderDropoutCard() {
  const q = q1();
  const fact = (big, text, tone = "") => `<div class="fact"><strong class="${tone}">${big}</strong><span>${text}</span></div>`;
  $("#dropoutCard").innerHTML = `
    <h4 class="ov-title">${t("Frafallet skjer tidlig", "Dropout happens early")} ${areaBadge()}</h4>
    <p class="ov-text">${t(
      `${nf1.format(q.overall_dropout_rate)} % av påmeldingene slutter før eksamen (alle tre studieår).`,
      `${nf1.format(q.overall_dropout_rate)} % of enrolments drop out before the exam (all three academic years).`)}</p>
    <div class="fact-grid">
      ${fact(`${nf0.format(q.share_of_dropouts_weeks_1_6)} %`, t("av frafallet skjer i uke 1–6", "of dropouts happen in weeks 1–6"))}
      ${fact(`${nf0.format(q.share_of_dropouts_weeks_1_2_angrerett)} %`, t(`slutter innen angrefristen – ${fmtNok(q.refunded_revenue_nok)} tilbakebetalt`, `leave within the withdrawal period – ${fmtNok(q.refunded_revenue_nok)} refunded`))}
      ${fact(fmtSigned(q.lifts.programme_vs_single_course_pct), t("frafall når emnet er del av et studieprogram", "dropout when the course is part of a study programme"), "chg-good")}
      ${fact(fmtSigned(q.lifts.returning_vs_new_pct), t("frafall for studenter som har tatt et emne før", "dropout for students who have taken a course before"), "chg-good")}
    </div>
    <p class="kicker-sm ov-gap">${t("Hva betyr det?", "What does it mean?")}</p>
    <p class="muted-sm">${t(
      "Oppfølging de første seks ukene treffer flest. Studenter som kjøper sitt andre emne slutter sjeldnere, så kryssalg virker også mot frafall.",
      "Follow-up in the first six weeks reaches the most students. Students who buy their second course drop out less often, so cross-selling also works against dropout.")}</p>`;
}

/* ── Market (real DBH data) ─────────────────────────────────────────────── */
function marketGroups() {
  const codes = new Set(courses().map((c) => c.nus_lvl4_code));
  return R.market.filter((g) => codes.has(g.nus_lvl4_code)).sort((a, b) => b.courses.length - a.courses.length);
}
function marketYears(group) {
  const s = group.series.filter((p) => p.period_index >= 1 && p.period_index <= 6);
  const years = [[1, 2, "2023/24"], [3, 4, "2024/25"], [5, 6, "2025/26"]];
  const sum = (key, a, b) => s.filter((p) => p.period_index === a || p.period_index === b).reduce((tot, p) => tot + (p[key] || 0), 0);
  const series = [
    { key: "pelican_students", label: t("Pelican (emner i fagfeltet)", "Pelican (courses in the field)"), color: "#226b56", width: 3 },
    { key: "national_all", label: t("Nasjonalt marked", "National market"), color: "#4f5d56", width: 2 },
    { key: "oslomet_all", label: "OsloMet", color: "#c35a31", width: 2, dash: "5 4" },
  ].map((ser) => {
    const raw = years.map(([a, b]) => sum(ser.key, a, b));
    return { ...ser, raw, idx: raw[0] ? raw.map((v) => (v / raw[0]) * 100) : null };
  }).filter((ser) => ser.idx);
  return { labels: years.map((y) => y[2]), series };
}
function renderMarketSelect() {
  const groups = marketGroups();
  if (!groups.some((g) => g.nus_lvl4_code === state.marketGroup) && groups.length) state.marketGroup = groups[0].nus_lvl4_code;
  const sel = $("#marketGroup");
  sel.innerHTML = groups.map((g) => {
    const n = courses().filter((c) => c.nus_lvl4_code === g.nus_lvl4_code).length;
    return `<option value="${g.nus_lvl4_code}">${g.nus_lvl4_code} ${esc(g.nus_lvl4_name)} (${n} ${emner(n)})</option>`;
  }).join("");
  sel.value = state.marketGroup;
}
function renderMarketChart() {
  const svg = $("#marketChart");
  clearSvg(svg);
  const group = R.market.find((g) => g.nus_lvl4_code === state.marketGroup);
  if (!group) return;
  const { labels, series } = marketYears(group);
  const W = 760, H = 320, pad = { l: 52, r: 210, t: 20, b: 40 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const all = series.flatMap((s) => s.idx);
  const lo = Math.floor(Math.min(90, ...all) / 10) * 10, hi = Math.ceil(Math.max(110, ...all) / 10) * 10;
  const ystep = hi - lo > 100 ? 20 : 10;
  const x = (i) => pad.l + (i / (labels.length - 1)) * pw;
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * ph;
  for (let v = lo; v <= hi; v += ystep) {
    svg.appendChild(svgEl("line", { x1: pad.l, y1: y(v), x2: pad.l + pw, y2: y(v), class: v === 100 ? "grid-zero" : "grid" }));
    svg.appendChild(svgEl("text", { x: pad.l - 8, y: y(v) + 4, "text-anchor": "end", class: "axis-text" }, v));
  }
  labels.forEach((l, i) => svg.appendChild(svgEl("text", { x: x(i), y: pad.t + ph + 20, "text-anchor": "middle", class: "axis-text" }, l)));
  const ends = [];
  series.forEach((s) => {
    svg.appendChild(svgEl("path", { d: s.idx.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" "), fill: "none", stroke: s.color, "stroke-width": s.width, "stroke-dasharray": s.dash || "none" }));
    s.idx.forEach((v, i) => svg.appendChild(svgEl("circle", { cx: x(i), cy: y(v), r: i === s.idx.length - 1 ? 4.5 : 3, fill: s.color })));
    ends.push({ y: y(s.idx[s.idx.length - 1]), text: `${s.label} ${nf0.format(s.idx[s.idx.length - 1])}`, color: s.color });
  });
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
  ends.forEach((e) => svg.appendChild(svgEl("text", { x: pad.l + pw + 10, y: e.y + 4, class: "end-label", fill: e.color }, e.text)));
}
function renderMarketCard() {
  const group = R.market.find((g) => g.nus_lvl4_code === state.marketGroup);
  if (!group) { $("#marketCard").innerHTML = ""; return; }
  const { series } = marketYears(group);
  const get = (k) => series.find((s) => s.key === k);
  const pel = get("pelican_students"), nat = get("national_all"), osl = get("oslomet_all");
  const g = (s) => (s ? s.idx[s.idx.length - 1] - 100 : null);
  const list = R.horizons["2y"].courses.filter((c) => group.courses.includes(c.course_code)).sort((a, b) => b.students_latest - a.students_latest);
  const slower = g(pel) < g(nat);
  $("#marketCard").innerHTML = `
    <p class="kicker-sm">${esc(group.nus_lvl4_code)} ${esc(group.nus_lvl4_name)}</p>
    <h4 class="ov-title">${slower ? t("Pelican vokser saktere enn markedet", "Pelican grows slower than the market") : t("Pelican holder følge med markedet", "Pelican keeps pace with the market")}</h4>
    <p class="ov-text">${t(
      `Markedet vokste ${fmtSigned(g(nat))} fra 2023/24 til 2025/26. Pelicans emner i samme fagfelt endret seg ${fmtSigned(g(pel))}${osl ? `, OsloMet ${fmtSigned(g(osl))}` : ""}.`,
      `The market grew ${fmtSigned(g(nat))} from 2023/24 to 2025/26. Pelican's courses in the same field changed ${fmtSigned(g(pel))}${osl ? `, OsloMet ${fmtSigned(g(osl))}` : ""}.`)}</p>
    <ul class="mini-list">${list.map((c) => `<li><span>${esc(c.course_name)}</span>${arrowSpan(c.chg_students, 1, 5, "%")}</li>`).join("")}</ul>
    <p class="ov-foot">${t(
      "Markedet vises alltid for hele perioden 2023/24–2025/26. DBH teller studenter på studieprogram, Pelican teller emnepåmeldinger. Derfor sammenlignes vekst, ikke nivå.",
      "The market is always shown for the full period 2023/24–2025/26. DBH counts students in study programmes, Pelican counts course enrolments. That is why growth is compared, not level.")}</p>`;
}

/* ── Table ──────────────────────────────────────────────────────────────── */
const SORT = {
  klasse: [(c) => (judged(c) ? CLASS_ORDER.indexOf(c.matrix_class) : 9), "number"],
  emne: [(c) => `${c.course_code} ${c.course_name}`, "string"],
  students: [(c) => c.win_students, "number"],
  chgStudents: [(c) => c.chg_students ?? -999, "number"],
  net: [(c) => c.net_score ?? -99, "number"],
  survey: [(c) => c.student_survey_latest ?? 0, "number"],
  dropout: [(c) => c.dropout_rate_latest ?? 0, "number"],
  cost: [(c) => c.cost_per_student_latest_nok ?? 0, "number"],
  contribution: [(c) => c.win_contribution ?? 0, "number"],
  portefolje: [(c) => tr(c.portefolje), "string"],
  nuskode: [(c) => Number(c.nus_code), "number"],
};
/* Option values stay Norwegian (they match the data); only the label changes. */
function fillSelect(id, values, label = (v) => v) {
  const el = $(id);
  const keep = el.value || "Alle";
  el.innerHTML = `<option value="Alle">${t("Alle", "All")}</option>` + values.map((v) => `<option value="${esc(v)}">${esc(label(v))}</option>`).join("");
  el.value = keep;
}
function fillSelects() {
  fillSelect("#classFilter", [...CLASS_ORDER, "For lite datagrunnlag", "Inaktiv"]);
  fillSelect("#portefoljeFilter", [...new Set(R.courses.map((c) => c.portefolje))], tr);
  fillSelect("#instituttFilter", [...new Set(R.courses.map((c) => c.institutt))], tr);
  fillSelect("#areaFilter", ["Ledelse", "Teknologi", "Helse", "Design"], tr);
  $("#areaFilter").options[0].textContent = t("Alle fagområder", "All subject areas");
}
function tableRows() {
  const tb = state.table;
  const rows = courses().filter((c) =>
    (tb.cls === "Alle" || c.matrix_class === tb.cls) &&
    (tb.portefolje === "Alle" || c.portefolje === tb.portefolje) &&
    (tb.institutt === "Alle" || c.institutt === tb.institutt) &&
    (!tb.search || `${c.course_code} ${c.course_name}`.toLowerCase().includes(tb.search)));
  if (!tb.sortKey) return rows.sort((a, b) => SORT.klasse[0](a) - SORT.klasse[0](b) || b.win_students - a.win_students);
  const [get, type] = SORT[tb.sortKey];
  return rows.sort((a, b) => {
    const cmp = type === "number" ? get(a) - get(b) : String(get(a)).localeCompare(String(get(b)), "nb");
    return tb.sortDir === "desc" ? -cmp : cmp;
  });
}
function renderTable() {
  const rows = tableRows();
  $("#resultCount").textContent = t(
    `Viser ${rows.length} av ${courses().length} emner · ${periodLabel().toLowerCase()} · endring ${horizon().label}`,
    `Showing ${rows.length} of ${courses().length} courses · ${periodLabel().toLowerCase()} · change ${horizon().label}`);
  if (!rows.length) {
    $("#courseTable").innerHTML = `<tr class="empty-row"><td colspan="11">${t("Ingen emner matcher filtrene.", "No courses match the filters.")}</td></tr>`;
    return;
  }
  const maxS = Math.max(...rows.map((c) => c.win_students), 1);
  const thr = RULES.relative_threshold * 100;
  $("#courseTable").innerHTML = rows.map((c) => `<tr data-code="${c.course_code}" tabindex="0" aria-label="${t("Vis detaljer for", "Show details for")} ${esc(c.course_name)}">
      <td class="cell-left">${pillHtml(c)}</td>
      <td class="cell-left"><strong>${esc(c.course_code)}</strong> ${esc(c.course_name)}</td>
      <td><div class="bar-cell"><span class="bar-track"><span class="bar-fill bar-fill--green" style="width:${(c.win_students / maxS) * 100}%"></span></span><span class="bar-value">${nf0.format(c.win_students)}</span></div></td>
      <td>${isNum(c.chg_students) && judged(c) ? arrowSpan(c.chg_students, 1, thr, "%") : "–"}</td>
      <td>${isNum(c.net_score) ? `${c.net_score > 0 ? "+" : c.net_score < 0 ? "−" : ""}${Math.abs(c.net_score)}` : "–"}</td>
      <td>${isNum(c.student_survey_latest) ? nf2.format(c.student_survey_latest) : "–"}</td>
      <td>${isNum(c.dropout_rate_latest) ? `${nf1.format(c.dropout_rate_latest)} %` : "–"}</td>
      <td>${fmtNok(c.cost_per_student_latest_nok, false)}</td>
      <td>${fmtNok(c.win_contribution)}</td>
      <td class="cell-left">${esc(tr(c.portefolje))}</td>
      <td>${esc(c.nus_code)}</td></tr>`).join("");
  $("#courseTable").querySelectorAll("tr[data-code]").forEach((tr) => {
    const go = () => {
      selectCourse(tr.dataset.code);
      $(".dashboard-shell").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    };
    tr.addEventListener("click", go);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  });
}
function updateSortHeaders() {
  document.querySelectorAll("#courseTable ~ thead th.sortable, .table-card th.sortable").forEach((th) => {
    th.setAttribute("aria-sort", th.dataset.key === state.table.sortKey ? (state.table.sortDir === "desc" ? "descending" : "ascending") : "none");
  });
}
function handleSort(key) {
  if (state.table.sortKey === key) state.table.sortDir = state.table.sortDir === "asc" ? "desc" : "asc";
  else { state.table.sortKey = key; state.table.sortDir = SORT[key][1] === "number" && key !== "klasse" ? "desc" : "asc"; }
  updateSortHeaders();
  renderTable();
}

/* ── Preview in the "Utvalgt arbeid" card: the same matrix, drawn small ── */
function renderPreview() {
  const svg = $("#previewChart");
  if (!svg) return;
  clearSvg(svg);
  const W = 640, H = 340, pad = { l: 28, r: 20, t: 26, b: 24 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const rows = allCourses("3y").filter(judged);
  const maxY = Math.max(...rows.map((c) => c.win_students)) * 1.1;
  const maxRev = Math.max(...rows.map((c) => c.win_revenue), 1);
  const x = (v) => pad.l + ((v + 9) / 18) * pw;
  const y = (v) => pad.t + (1 - v / maxY) * ph;
  svg.appendChild(svgEl("rect", { x: pad.l, y: pad.t, width: pw / 2, height: ph, class: "zone-bad" }));
  svg.appendChild(svgEl("rect", { x: x(0), y: pad.t, width: pw / 2, height: ph, class: "zone-good" }));
  for (let v = -9; v <= 9; v += 3) svg.appendChild(svgEl("line", { x1: x(v), y1: pad.t, x2: x(v), y2: pad.t + ph, class: v === 0 ? "grid-zero" : "grid" }));
  [[pad.l + 6, "start", t("SVEKKES", "WEAKENING")], [pad.l + pw - 6, "end", t("STYRKES", "STRENGTHENING")]]
    .forEach(([cx, a, txt]) => svg.appendChild(svgEl("text", { x: cx, y: pad.t - 9, "text-anchor": a, class: "quad-label" }, txt)));
  rows.sort((a, b) => b.win_revenue - a.win_revenue).forEach((c) =>
    svg.appendChild(svgEl("circle", { cx: x(c.net_score), cy: y(c.win_students), r: 5 + Math.sqrt(c.win_revenue / maxRev) * 14, class: `km-bubble ${km(c.matrix_class)}`, opacity: 0.92 })));
}

/* ── Wiring ─────────────────────────────────────────────────────────────── */
function setPeriodButtons() {
  document.querySelectorAll(".period-pill").forEach((b) => b.classList.toggle("active", b.dataset.period === state.period));
}
function init() {
  if (!R || !R.horizons) {
    const shell = $(".dashboard-shell");
    if (shell) shell.innerHTML = `<p class="load-error">${t("Fant ikke data. Sjekk at <code>data/results.js</code> ligger ved siden av index.html.", "Data not found. Check that <code>data/results.js</code> sits next to index.html.")}</p>`;
    return;
  }
  renderLegend();
  fillSelects();
  setPeriodButtons();
  renderKpis();
  setView("prioritet");
  renderTable();
  renderPreview();

  document.addEventListener("langchange", () => {
    fillSelects();
    renderLegend();
    renderAll();
    renderPreview();
  });

  document.querySelectorAll(".view-tab").forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
  document.querySelectorAll(".period-pill").forEach((b) => b.addEventListener("click", () => {
    state.period = b.dataset.period;
    setPeriodButtons();
    renderAll();
  }));
  const btn = $("#filtereBtn"), panel = $("#filterePanel");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  });
  $("#areaFilter").addEventListener("change", (e) => {
    state.area = e.target.value;
    if (state.selected && !courses().some((c) => c.course_code === state.selected)) state.selected = null;
    renderAll();
  });
  $("#closeInsight").addEventListener("click", clearSelection);
  $("#togglePatterns").addEventListener("click", function () {
    state.patterns = !state.patterns;
    this.classList.toggle("active", state.patterns);
    this.setAttribute("aria-pressed", String(state.patterns));
    renderHeatmap();
  });
  document.querySelectorAll("#segmentToggles .toggle-pill").forEach((b) => b.addEventListener("click", () => {
    state.segment = b.dataset.seg;
    document.querySelectorAll("#segmentToggles .toggle-pill").forEach((x) => x.classList.toggle("active", x === b));
    renderRetention();
  }));
  $("#marketGroup").addEventListener("change", (e) => { state.marketGroup = e.target.value; renderMarketChart(); renderMarketCard(); });
  $("#classFilter").addEventListener("change", (e) => { state.table.cls = e.target.value; renderTable(); });
  $("#portefoljeFilter").addEventListener("change", (e) => { state.table.portefolje = e.target.value; renderTable(); });
  $("#instituttFilter").addEventListener("change", (e) => { state.table.institutt = e.target.value; renderTable(); });
  $("#courseSearch").addEventListener("input", (e) => { state.table.search = e.target.value.trim().toLowerCase(); renderTable(); });
  document.querySelectorAll(".table-card th.sortable").forEach((th) => {
    th.addEventListener("click", () => handleSort(th.dataset.key));
    th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort(th.dataset.key); } });
  });
  $("#resetFilters").addEventListener("click", () => {
    state.table = { ...DEFAULT_TABLE };
    ["#classFilter", "#portefoljeFilter", "#instituttFilter", "#areaFilter"].forEach((id) => ($(id).value = "Alle"));
    $("#courseSearch").value = "";
    state.period = "3y";
    state.area = "Alle";
    state.selected = null;
    state.patterns = false;
    state.heatSort = { key: null, dir: "desc" };
    $("#togglePatterns").classList.remove("active");
    $("#togglePatterns").setAttribute("aria-pressed", "false");
    state.segment = "type";
    document.querySelectorAll("#segmentToggles .toggle-pill").forEach((x) => x.classList.toggle("active", x.dataset.seg === "type"));
    state.marketGroup = "6411";
    setPeriodButtons();
    updateSortHeaders();
    renderKpis();
    setView("prioritet");
    renderTable();
  });

  /* "Åpne live-demoen" / preview overlay: scroll to the dashboard */
  document.querySelectorAll("[data-scroll-case]").forEach((el) => el.addEventListener("click", (e) => {
    e.preventDefault();
    $("#case").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }));
}

init();
