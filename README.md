# FLEX+ (Flex NUCES Student Redesign)

**FLEX+** is a browser extension that modernizes the **Flex Student Portal** for FAST NUCES University. It transforms the legacy, table-heavy interface into a responsive, card-based dashboard with advanced analytics and theming capabilities.

**How it works:** FLEX+ operates as a **"Parasitic UI"**. It suppresses the original interface, scrapes the data as it loads, and renders a modern dashboard in its place. (Note: It may take 1-2 seconds to inject the UI upon page load).

<img src="screenshots/home.gif" alt="Home" width="70%">

## ⚡ Installation

First, clone this repository or download the ZIP and extract it to a folder (e.g., `FlexPlus`).

### Chrome / Edge / Brave

1.  **Open Extensions:** Go to `chrome://extensions/`.
2.  **Enable Developer Mode:** Toggle the switch in the top-right corner.
3.  **Load:** Click **"Load unpacked"** and select the folder containing `manifest.json`.
4.  **Run:** Visit the [Flex Student Portal](https://flexstudent.nu.edu.pk/) and log in. The new UI activates automatically.

### Firefox

1.  **Open Debugging:** Go to `about:debugging#/runtime/this-firefox`.
2.  **Load:** Click **"Load Temporary Add-on…"** and select `manifest.json` in the folder. Temporary add-ons are removed when Firefox restarts.
3.  **Allow the site:** Firefox lets you choose which sites an extension may run on. Click the Extensions (puzzle-piece) button in the toolbar, click the ⚙ next to FLEX+, and choose **"Always allow on flexstudent.nu.edu.pk"** (or enable it under `about:addons` → FLEX+ → **Permissions**).
4.  **Run:** Visit the [Flex Student Portal](https://flexstudent.nu.edu.pk/) and log in.

> **FLEX+ only works after you click its icon?** That means the site isn't set to "Always allow" — see step 3.

The login page is intentionally left as the portal's original page, so its Cloudflare check works normally. FLEX+ takes over once you're signed in.

---

## ✨ Features

FLEX+ goes beyond a simple visual overhaul by adding data-driven tools that the original portal lacks.

### 🎨 Theming Engine
* **5-State Toggle:** Cycle through **Light, Dark, Midnight, Forest,** and **Sunset** modes.
* **Persistence:** Your preference is saved locally and applies instantly on every page load.
* **Follows your system:** Until you pick a theme, FLEX+ uses Dark or Light to match your operating system's setting.

---

### 🎓 Transcript Power-Tools (Priority Feature)
* **GPA Planner / Simulator:** Enter hypothetical grades for current courses to see how they impact your final CGPA. Your picks are remembered across reloads (stored only in your browser); **Reset** puts a semester back to its actual grades.
* **Prerequisite Checker:** Visualizes course dependencies (e.g., visual warnings if you haven't passed a prerequisite).
* **Smart GPA:** Auto-calculates SGPA excluding "Withdrawn" or "Non-Credit" courses for better accuracy.

<img src="screenshots/transcript.gif" alt="Transcript" width="70%">

---

### 📊 Fee Analytics (Priority Feature)
Instead of a confusing ledger, get a comprehensive financial health check.
* **Lifetime Spend:** Calculates the exact total of fees paid since admission.
* **Course Audit:** Counts total courses registered vs. passed.
* **Repeat Cost Calculator:** Automatically detects repeated courses and estimates the "extra" money spent on retakes (e.g., "Rs. 19,500 extra spent on repeats").

<img src="screenshots/fee-details.gif" alt="Fee" width="70%">

---

### 📂 Other Modernized Modules
We have also redesigned the core daily drivers:
* **Attendance:** Clean visualization of absents vs. allowed leaves.
* **Challan Generation:** Simplified one-click challan printing.
* **Course Registration:** A clutter-free interface for selecting courses.

<div style="display: flex; gap: 10px;">
  <img src="screenshots/attendance.gif" alt="Attendance" width="32%">
  <img src="screenshots/registration.gif" alt="Registration" width="32%">
  <img src="screenshots/challan.gif" alt="Challan" width="32%">
</div>

---

## ⚙️ How It Works

FLEX+ operates as a **"Parasitic UI"** to stay compatible with the university's legacy system.

1.  **Scrape:** The extension reads text, links, and data attributes from the original page.
2.  **Render:** A new container (`#modern-root`) is appended to the `<body>` where the clean UI is drawn.
3.  **Hide:** A `modern-active` class on `<body>` hides the original page with CSS. It is never removed from the DOM, so the site's own ASP.NET and jQuery scripts keep working — buttons in the new UI simply click their hidden originals.

### The "AJAX Bridge"
For pages like **Fee Details** that load data asynchronously:
* **MutationObservers:** FLEX+ watches the page for changes. When the original site's AJAX completes, our observer detects the new data and triggers a UI rebuild.
* **Automated Triggers:** For semester breakdowns, the extension programmatically "clicks" the hidden buttons of the legacy site in the background, waits for the data to populate, and then scrapes it into a modern Modal.
