# Notes for the AMO reviewer

*(Paste the section below into the "Notes to reviewer" field on the AMO
submission form. This file is not part of the extension package.)*

---

## What this add-on does

FLEX+ restyles exactly one website — `flexstudent.nu.edu.pk`, the FAST-NUCES
university student portal — into a modern, responsive interface. It has no
function on any other site.

The technique is deliberate and consistent across every module:

1. A content script reads the legacy page's DOM (the portal is an old ASP.NET /
   Metronic app).
2. It builds a replacement UI and appends it to `<body>` as `#modern-root`.
3. It adds `modern-active` to `<body>`, which hides the original markup with
   CSS — **the original DOM is never removed**, because the site's own ASP.NET
   and jQuery code depends on it.

Interactive controls in the new UI are proxies: they programmatically click
the original (now hidden) control, so form posts remain the site's own. The one
exception is the semester dropdown on the attendance and marks pages, which is
re-rendered as a `<form>` copying the original's `action`, `method`, hidden
inputs and select `name`, and submitted on change. No form action, endpoint, or
payload is changed by this add-on.

## Data handling: none

- No backend, no analytics, no telemetry, no third-party services.
- The add-on sends nothing to any server. The single `fetch()` call in the
  codebase (`js/transcript.js`) reads `json/degree_prereqs.json`, a static file
  bundled in this package, via `chrome.runtime.getURL`. The only other requests
  are the portal's own (the user's profile photo, a semester switch, the
  logout link), made exactly as the original pages make them.
- No remote code. Everything executed ships inside the package.
- The only persisted values are in the portal origin's `localStorage`, and
  neither is ever transmitted:
  - `flex-theme` (e.g. `"dark"`) — the user's chosen colour theme.
  - `flex-sim-grades` (e.g. `{"Fall 2025": {"CS2001": "A"}}`) — hypothetical
    grades the user picked in the transcript's GPA calculator
    (`js/transcript.js`), kept so they survive a reload. Only picks that differ
    from the real grade are stored; a Reset button clears a semester.
- Declared in the manifest as
  `browser_specific_settings.gecko.data_collection_permissions.required: ["none"]`.

## About the `innerHTML` warning

`addons-linter` reports exactly one `UNSAFE_VAR_ASSIGNMENT` warning (and no
errors): `js/utils.js`, inside `parseHTML`. That is deliberate. Each module
composes its replacement UI as an HTML string, and **every** string-to-DOM
insertion in the add-on goes through that one function via
`FlexUtils.setHTML(el, html)` / `FlexUtils.appendHTML(el, html)`. There is no
other `innerHTML` assignment, `insertAdjacentHTML`, `outerHTML` or
`document.write` in the package:

```
grep -nE 'innerHTML\s*=|insertAdjacentHTML|outerHTML|document\.write' js/*.js
# -> only js/utils.js (tpl.innerHTML = html)
```

The string is parsed into a `<template>` element, whose content is inert, and
then moved into place. What makes the strings safe is described below:

**Every value interpolated into those strings is escaped.**
`js/utils.js` exports `FlexUtils.escapeHTML`, and it is applied at 120
interpolation sites across all ten modules. You can verify quickly:

```
grep -o '\${esc(' js/*.js | wc -l      # 120
grep -n 'esc(' js/*.js | grep -v '\${esc('   # only the 1 escape-at-source site
```

Note also that scraped values are read via `.innerText` / `.textContent`, which
return parsed text, never live markup — so the input to these templates cannot
contain elements to begin with. The escaping defends the remaining case: portal
text that merely *looks* like markup (a course title containing `<` or `"`).

Deliberately **not** escaped, and safe:

- `mainContentHTML` and `pageTitle` passed into `FlexUtils.renderInternalPage`
  — markup the extension generated itself, not scraped input. Every title is a
  string literal except the transcript's, which embeds the CGPA through `esc()`
  at the call site (`js/transcript.js`).
- `FlexUtils.ICONS` — a fixed set of inline SVG string literals defined in
  `js/utils.js`; nothing scraped is ever added to it.
- Numeric values, and DOM ids derived through `replace(/[^a-zA-Z0-9]/g, "")`
  or a numeric regex match.

## The login page

FLEX+ does not run on the login page. No content script matches `/Login*`
(the catch-all entry excludes it explicitly), so the user signs in on the
portal's original page and the add-on never touches credentials.

## No build step

The source in this package is the source we wrote — no bundler, no minifier, no
transpiler, no dependencies. What you read is what runs.

## Testing it

The portal requires a FAST-NUCES student login, which we cannot provide. If you
need to see the UI without an account, the add-on's behaviour is fully
determined by the DOM structures documented in `CLAUDE.md` in the public
repository, and we are happy to supply sanitised sample pages on request.

## Disclaimer

FLEX+ is independent and unofficial. It is not affiliated with, endorsed by, or
sponsored by FAST-NUCES.
