# jaruwanessen.com

Personal BI portfolio for Jaruwan Essén. It is a static site (HTML, CSS and JS, no build step) hosted on GitHub Pages, and the whole site switches between Norwegian and English.

## Repo layout

```
/                        ← repo root = website root (GitHub Pages serves from here)
├── index.html           Front page: hero, selected work, Pelican case, process, method, tools, about
├── emneportefolje.html  First version of the case (old Power BI prototype, own page)
├── about.html           About me
├── styles.css           All styles
├── i18n.js              NO/EN switch shared by every page
├── pelican-i18n.js      English versions of the text analyze.py writes (verdicts, metrics …)
├── script.js            Pelican dashboard on index.html
├── old-case.js          Dashboard on emneportefolje.html (fictional data generated in the browser)
├── data/
│   └── results.js       ← Pelican results the dashboard reads (window.PELICAN_RESULTS = …)
├── profilepicture.jpg
├── resume.pdf
├── CNAME
└── pelican/             ← raw data + Python (not loaded by the site, kept for the "public rebuild")
    ├── DATA_DICTIONARY.md
    ├── data/            dim_course.csv, dim_semester.csv, fact_course_semester.csv,
    │                    fact_enrollment.csv, market_nus.csv, course_summary.csv, results.json
    └── scripts/         generate_data.py, build_market.py, analyze.py
```

The `pelican/` folder is **not** included in this download. Copy your existing `pelican` folder (the one with `data/` and `scripts/`) into the repo root as shown above.

## Updating the Pelican results

The site only reads `data/results.js`. After you rerun the analysis:

```bash
cd pelican
python scripts/analyze.py            # writes pelican/data/results.json
cd ..
python -c "import pathlib; j=pathlib.Path('pelican/data/results.json').read_text(encoding='utf-8'); pathlib.Path('data/results.js').write_text('window.PELICAN_RESULTS = '+j+';\n', encoding='utf-8')"
```

The class "Handle nå" from analyze.py is shown as **Prioritert** on the site. `script.js` renames it when the data loads, so the Python code stays unchanged.

## Translations

- **Static text:** write the Norwegian version as normal and put the English version in `data-en` on the same element, for example `<p data-en="Hello">Hei</p>`. Attributes work the same way: `data-en-placeholder`, `data-en-aria-label`, `data-en-title`, `data-en-content`.
- **Text drawn by JS:** use `t("norsk", "english")`. Pages re-render on the `langchange` event.
- **Text from analyze.py:** `pelican-i18n.js` translates it with word lists and regex rules.
  - If you add a new sentence template in Python, add a rule to `VERDICT_RULES`.
  - Anything without a rule stays in Norwegian, so nothing breaks.
- **What stays Norwegian on purpose:** class names (Prioritert, Følg med, Stabil, God utvikling, Skalér), course names and NUS names.
- **Remembered choice:** the selected language is stored in `localStorage` (`je-lang`).

## Running locally

```bash
python -m http.server 8000   # then open http://localhost:8000
```
