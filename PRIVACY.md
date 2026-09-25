# Privacy Policy — FLEX+

**Last updated:** 25 September 2026

## Summary

FLEX+ does not collect, transmit, sell or share any personal data. The only
things it saves are two preferences, kept in your own browser.

The extension has no backend, no analytics, no telemetry and no third-party
services. It sends nothing to any server of its own or anyone else's — the only
requests the redesigned pages make are the portal's own (loading your profile
photo, switching semester, and so on), exactly as the original pages do.

## What the extension does

FLEX+ runs only on `flexstudent.nu.edu.pk`, the FAST-NUCES student portal. On
each portal page it reads the information the page is already displaying to you
— attendance, marks, transcript, fees, course registration, course feedback —
and re-draws that same information in a redesigned interface.

All of this happens locally in your browser, in the page you already have open.
The data is never copied anywhere else.

## What is stored

Two values, in your own browser's `localStorage`:

| Key | Example value | Purpose |
|-----|---------------|---------|
| `flex-theme` | `"dark"` | Remembers which of the five colour themes you picked |
| `flex-sim-grades` | `{"Fall 2025": {"CS2001": "A"}}` | Remembers the hypothetical grades you picked in the transcript's GPA calculator, so they survive a reload |

That is the complete list. `flex-sim-grades` holds only grades you chose
yourself in the calculator, and only where they differ from your actual grade;
the calculator's **Reset** button removes a semester's entry. Neither value ever
leaves your browser, and you can clear both at any time by clearing site data
for the portal.

## Network activity

FLEX+ makes exactly one `fetch()` call, and it reads a file bundled inside the
extension itself (`json/degree_prereqs.json`, the course prerequisite map used
by the transcript planner). No request is ever made to an external server.

No remote code is loaded or executed. All JavaScript and CSS ships inside the
extension package.

## The login page

FLEX+ does not run on the portal's login page at all. You sign in on the
portal's original page, and FLEX+ never sees your username or password.

## Permissions

| Permission | Why |
|------------|-----|
| `flexstudent.nu.edu.pk` host access | The only way to restyle the portal is to read and redraw its pages. This is the extension's entire function. |

FLEX+ requests no other permissions, and no access to any other website.

## Contact

Questions or concerns: open an issue at the project's repository.

## Disclaimer

FLEX+ is an independent, unofficial project. It is not affiliated with, endorsed
by, or sponsored by FAST-NUCES or the operators of the Flex student portal.
