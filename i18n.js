/* ─────────────────────────────────────────────────────────────────────────
   i18n.js – NO/EN switch shared by every page.

   How to translate static HTML: write the Norwegian text as normal and put
   the English version in a data-en attribute on the same element:
       <p data-en="Hello">Hei</p>
   data-en may contain inline HTML (<em>, <br>, <strong>). Attributes are
   translated the same way: data-en-placeholder, data-en-aria-label,
   data-en-title, data-en-content (for <meta>).

   In JavaScript, use t("norsk", "english") for any text that is drawn at
   runtime, and listen for the "langchange" event to re-render.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  const KEY = "je-lang";
  const ATTRS = ["placeholder", "aria-label", "title", "content", "alt"];

  function stored() {
    try {
      const v = localStorage.getItem(KEY);
      return v === "en" || v === "no" ? v : null;
    } catch (e) {
      return null;
    }
  }

  window.LANG = stored() || "no";
  window.t = (no, en) => (window.LANG === "en" ? en : no);
  window.LOCALE = () => (window.LANG === "en" ? "en-GB" : "nb-NO");

  function apply() {
    const en = window.LANG === "en";
    document.documentElement.lang = en ? "en" : "nb";
    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset.no === undefined) el.dataset.no = el.innerHTML;
      el.innerHTML = en ? el.dataset.en : el.dataset.no;
    });
    ATTRS.forEach((a) => {
      const enKey = `data-en-${a}`;
      document.querySelectorAll(`[${enKey}]`).forEach((el) => {
        const noKey = `data-no-${a}`;
        if (!el.hasAttribute(noKey)) el.setAttribute(noKey, el.getAttribute(a) || "");
        el.setAttribute(a, en ? el.getAttribute(enKey) : el.getAttribute(noKey));
      });
    });
    document.querySelectorAll("[data-lang]").forEach((b) => {
      const on = b.dataset.lang === window.LANG;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.dispatchEvent(new CustomEvent("langchange", { detail: window.LANG }));
  }

  window.setLang = (lang) => {
    window.LANG = lang === "en" ? "en" : "no";
    try {
      localStorage.setItem(KEY, window.LANG);
    } catch (e) {
      /* private mode – the switch still works for this visit */
    }
    apply();
  };

  function wire() {
    document.querySelectorAll("[data-lang]").forEach((b) =>
      b.addEventListener("click", () => window.setLang(b.dataset.lang)),
    );
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
