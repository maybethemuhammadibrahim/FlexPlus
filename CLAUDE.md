# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FLEX+ is a Manifest V3 Chrome extension that replaces the UI of the FAST NUCES student portal (`flexstudent.nu.edu.pk`). There is no build system, no package.json, no bundler, no tests, and no dependencies — the files in this repo are loaded directly by Chrome.

## Development workflow

- Load: `chrome://extensions/` → Developer mode → **Load unpacked** → select this directory.
- Iterate: edit a file, hit **Reload** on the extension card, then hard-reload the portal page. Content scripts are not hot-reloaded.
- Debug: every module logs its own `"<page> script loaded"` line and wraps its body in try/catch that logs to the page console; open DevTools on the portal page, not on the extension.
- Testing requires a live authenticated session on the real portal — the DOM being scraped only exists there. There is no fixture/mock harness.
- Bump `manifest.json` `version` when shipping a behavioral change.

## Architecture: "parasitic UI"

Each portal page has one content script that runs at `document_end`, scrapes the legacy ASP.NET DOM, and renders a replacement UI into a new `#modern-root` element appended to `<body>`. Adding `modern-active` to `<body>` hides the legacy `.m-grid` (`display:none`) while leaving it in the DOM, so the site's own ASP.NET/jQuery scripts keep working.

**The legacy DOM must never be removed.** Postbacks, validation, and AJAX all depend on it. Interactive controls in the new UI are *proxies*: they call the original page's globals or synthetically `.click()` the hidden original element. Examples:

- `js/registration.js:190` — custom submit button clicks `#confirmBtnItem`; a `MutationObserver` on `#selecrslimit` keeps the new course counter in sync.
- `js/challan.js` — calls `window.ftn_PrintChallanForm` / `window.fn_StdFeeDetail`, falls back to clicking the original button, and drives the legacy Bootstrap modal via `window.$`.
- `js/attendance.js`, `js/marks.js` — the semester dropdown is re-rendered as a real `<form>` copying the original `action`, `method`, hidden inputs, and select name, so the postback is genuine.
- `js/feedback.js` — see the form-owner note below; the questions page mirrors answers onto the original radios/textareas and clicks the legacy `#submit`.
- `js/fee_details.js` — the "AJAX bridge": clicks hidden `#BtnhideshowInternal<i>` buttons, then polls (100ms, ~50 attempts) for `#lbSGPA_<i>` to populate `#rowStdDetail_<i>` before scraping it into a modal.

### Form owners (the `<form>`-in-`<table>` trap)

On `/Student/CourseFeedback` the markup is `<form action="/Student/FeedBackQuestions"></form>` followed by `<tr>`s whose cells hold `<button name="GiveFeedback" value="...">`. The HTML parser closes a `<form>` opened in table context immediately, so **the form is empty and the buttons are not its descendants** — they are bound to it only through the parser's *form owner pointer*. Verified in a browser: the original button's `.form` is the form, a `cloneNode(true)` copy's `.form` is `null`.

So copying a legacy cell's `innerHTML` into `#modern-root` produces a button that looks right and silently does nothing. Any legacy submit control must be **proxy-clicked in place**, never cloned. Check `el.form` before assuming a copied control still submits.

### Manifest wiring

`manifest.json` registers one content-script entry per portal URL pattern. Patterns are the *whole* story: a page with no matching entry gets no script at all (the home catch-all excludes `/Student/*`), which is why the feedback entry has to list both `/Student/CourseFeedback*` and its POST target `/Student/FeedBackQuestions*`. Each entry loads `css/main.css` + a page-specific stylesheet and `js/utils.js` + a page-specific script. The catch-all `*://flexstudent.nu.edu.pk/*` entry (home) uses `exclude_matches` to avoid double-injecting on `/Student/*`, `/ConsolidatedFeeReport/*`, and `/Login*`. **Adding a new page means editing three places: a new manifest entry, `js/<page>.js`, `css/<page>.css`.**

### Module contract

Every `js/<page>.js` is an IIFE that:
1. Guards on `window.location.pathname` and returns early if it doesn't match (defense against the catch-all manifest pattern).
2. Wraps everything in try/catch; on error, logs and calls `document.body.classList.remove("modern-active")` to fall back to the original portal rather than leaving a blank page.
3. Builds one HTML string and calls `window.FlexUtils.renderInternalPage(html, pageTitle)`.

That catch-and-fall-back is for *unexpected* errors only. "Flex has no data for this session" is a normal state and must render an explicit empty-state card — if a scrape helper returns a partial shape on that path, the module throws, the fallback fires, and the user silently gets the raw portal back instead of FLEX+.

### `js/utils.js` (shared, loaded first everywhere)

- `FlexUtils.renderInternalPage(html, title)` — builds the sidebar + mobile topbar + `<main>`, replaces any existing `#modern-root`, sets `modern-active`, and wires theme/mobile-menu listeners.
- `FlexUtils.scrapeSidebar()` — reads `.m-menu__link` elements and sorts them into named buckets by link text (`home`, `attendance`, `marks`, …, `others`). Unrecognized links go to `others` and are rendered *disabled* with a "disable the extension to visit these pages" warning.
- `FlexUtils.ICONS` — inline SVG strings; use these instead of adding icon files.
- Theme engine: 5 themes cycled by `toggleTheme()`, stored in `localStorage` under `flex-theme`, applied as `body.<theme>-mode` (light is the bare `:root` default, no class).
- `cleanText` / `safeText(selector, parent)` — null-safe scraping helpers that return `"-"`.

Injected HTML is built with template literals, so **inline `onclick` never works** (extension CSP). Always `addEventListener` after the render call, or use delegation on `document.body`.

## Feedback module (`js/feedback.js`)

One IIFE serving two pages, chosen by pathname:

- **`/Student/CourseFeedback`** — course table; each row's action is our own button that proxy-clicks the matching original `button[name="GiveFeedback"]` (see the form-owner note).
- **`/Student/FeedBackQuestions`** — the actual questionnaire. Questions are scraped from `.m-list-timeline__item`: an item holding `input[type=radio]` is a scale question (`radios[N]`, value `questionId*optionId`), one holding `textarea[name="FB_Text"]` is an optional comment. The UI never builds its own form — clicking an option sets `.checked` on the original radio, typing mirrors into the original textarea, and submitting clicks the legacy `#submit`, so `FB_text_offer` and the `FB_text_Question_Id` / `FB_Text` pairs keep the order the server expects.
- **Quick Fill** applies one scale answer to every question (or only the unanswered ones). It matches options by *label*, falling back to index, so a differently ordered scale still lines up.
- Every radio is `required` and the legacy form is `display:none`, so an unanswered question would make Chrome block the submit with no visible message. The module gates on completeness itself, flags the missing cards, and scrolls to the first one.

## Timing

Portal pages populate content after `document_end`, so each module handles readiness differently — match the existing pattern for the page you're touching rather than inventing a new one:

- Poll for a selector with a capped retry (`attendance.js` 30×100ms, `transcript.js` 40×100ms, `feedback.js` 200ms re-call).
- `MutationObserver` on `.m-portlet__body` re-running the module until it returns true (`fee_details.js`).
- Straight scrape at load (`home.js`, `study_plan.js`, `registration.js`).

Poll loops must resolve a status (`success` / `error` / `timeout`) and render an explicit empty/timeout card — never hang.

## CSS

- `css/main.css` (~1600 lines) owns the theme variables and every shared primitive: `.dash-card`, `.modern-btn`, `.modern-table`, `.modern-badge` (+ `.success` / `.warning` / `.danger`), `.modern-modal` / `.modal-overlay` (toggled with the `active` class), `.empty-card`. It has a numbered table of contents at the top — keep new rules in the right section.
- All five themes are defined as CSS custom properties on `:root` and `body.<theme>-mode`. **Never hardcode a color in CSS or in a JS template string** — use `var(--bg-card)`, `var(--text-muted)`, `var(--danger-text)`, etc., or the new rule will break in four of the five themes.
- Layout is a `grid-template-columns: 260px minmax(0,1fr)` on `#modern-root`, collapsing to a fixed off-canvas sidebar + `.mobile-topbar` at the mobile breakpoint.
- `css/transcript.css` is listed in the manifest *and* re-injected at runtime via `chrome.runtime.getURL` in `transcript.js:15`.

## Transcript module (`js/transcript.js`, ~1100 lines)

The most complex module. It holds the grading domain model — `GRADE_POINTS` (A+ 4.0 … F 0.0) and `GRADE_CUTOFFS` (percentage thresholds) — plus:

- **GPA simulator**: per-semester grade `<select>`s recompute SGPA and a simulated CGPA live. A three-way toggle (`GRADE_DISPLAY_MODES`: Grades / Points / Weightage) re-labels the same options.
- **Prerequisite visualizer**: lazily fetches `json/degree_prereqs.json` via `chrome.runtime.getURL`. That file is keyed by degree (`CS`, …) then course code, with `prereqs_immediate`, `postreqs_immediate`, `full_prereq_chain`, `full_unlock_tree`, and a `visual_tree` of `{code, type: chain|branch|leaf, children[]}` that `renderTreeRecursive` walks. It is generated data — edit it as data, not by hand-patching one course.
- **CGPA/SGPA graph** is hand-rolled inline SVG (`generateGraphHTML`), no charting library.

Grading rules live in `marks.js` too (weight normalization, best-of-N drop logic for quizzes/assignments); keep the two consistent if grade semantics change.

## Conventions

- Vanilla ES6+, no framework, no imports — everything shared goes through the `window.FlexUtils` global.
- Scraping selectors target the portal's Metronic theme classes (`.m-portlet__body`, `.m-menu__link`, `.m-topbar__username`, `.nav-tabs .nav-link`) and ASP.NET control ids (`#lbSGPA_0`, `#rowStdDetail_0`, `#crslimit`). These are brittle by nature — always use optional chaining and a `"-"`/`0` fallback.
