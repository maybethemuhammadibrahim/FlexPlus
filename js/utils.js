// --- Global Scope Setup ---
window.FlexUtils = {};

//helper functions
//clean text(ai)
window.FlexUtils.cleanText = (text) =>
  text ? text.trim().replace(/\s+/g, " ") : "-";
window.FlexUtils.safeText = (selector, parent = document) =>
  window.FlexUtils.cleanText(parent.querySelector(selector)?.innerText || "-");

//icon, used svgs(ai)
window.FlexUtils.ICONS = {
  home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`,
  book: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
  clock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  list: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
  edit: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  power: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`,
  chevron: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  folder: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  dollar: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  plan: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
  // Theme Icons
  moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  cloud: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
  leaf: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>`,
  sunset: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 0 0-10 0"></path><line x1="12" y1="9" x2="12" y2="2"></line><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line><line x1="1" y1="18" x2="3" y2="18"></line><line x1="21" y1="18" x2="23" y2="18"></line><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line><line x1="23" y1="22" x2="1" y2="22"></line><polyline points="16 5 12 9 8 5"></polyline></svg>`,
  // Mobile Icons
  menu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
};

//themes
const THEMES = ["light", "dark", "midnight", "forest", "sunset"];
const THEME_ICONS = {
  light: "sun",
  dark: "moon",
  midnight: "cloud",
  forest: "leaf",
  sunset: "sunset",
};

//loads saved theme by user during last visit or defaults to light
window.FlexUtils.initTheme = function () {
  const saved = localStorage.getItem("flex-theme") || "light";

  for (const t of THEMES) {
    document.body.classList.remove(t + "-mode");
  }

  if (saved !== "light") {
    document.body.classList.add(saved + "-mode");
  }
};

function updateThemeIcons(theme) {
  const iconKey = THEME_ICONS[theme] || "sun";
  const svg = window.FlexUtils.ICONS[iconKey];

  const deskBtn = document.getElementById("theme-toggle-btn");
  if (deskBtn) deskBtn.innerHTML = svg;

  const mobBtn = document.getElementById("theme-toggle-mobile");
  if (mobBtn) mobBtn.innerHTML = svg;
}

//theme logic
window.FlexUtils.toggleTheme = function () {
  let currentTheme = "light";

  for (const t of THEMES) {
    if (document.body.classList.contains(t + "-mode")) currentTheme = t;
  }

  let index = THEMES.indexOf(currentTheme);
  let nextIndex = (index + 1) % THEMES.length;
  let nextTheme = THEMES[nextIndex];

  for (const t of THEMES) {
    document.body.classList.remove(t + "-mode");
  }

  if (nextTheme !== "light") document.body.classList.add(nextTheme + "-mode");

  localStorage.setItem("flex-theme", nextTheme);
  updateThemeIcons(nextTheme);
};

//initialize theme on page load
window.FlexUtils.initTheme();

//scrapes sidebar and sorts(into buckets)
window.FlexUtils.scrapeSidebar = function () {
  if (!document.querySelector(".m-menu__link")) {
    return { buckets: {}, userImg: "", userName: "Student" };
  }

  const rawLinks = Array.from(document.querySelectorAll(".m-menu__link"));
  //this goes to the class="m-menu__link" elements and get the links/urls of home, transcript,attendance, etc]

  const buckets = {
    home: null,
    attendance: null,
    marks: null,
    transcript: null,
    course_reg: null,
    course_feedback: null,
    fee_challan: null,
    fee_details: null,
    study_plan: null,
    others: [],
    logout: null,
  };

  for (const el of rawLinks) {
    const text = el.innerText.trim();
    const href = el.href;
    const isActive = el.parentElement.classList.contains(
      "m-menu__item--active",
    );
    const linkObj = { text, href, isActive };
    const t = text.toLowerCase();

    if (t.includes("home"))
      buckets.home = { ...linkObj, href: "https://flexstudent.nu.edu.pk/" };
    else if (t.includes("attendance")) buckets.attendance = linkObj;
    else if (t.includes("marks") && !t.includes("plo")) buckets.marks = linkObj;
    else if (t.includes("transcript")) buckets.transcript = linkObj;
    else if (t.includes("registration")) buckets.course_reg = linkObj;
    else if (t.includes("feedback")) buckets.course_feedback = linkObj;
    else if (t.includes("challan")) buckets.fee_challan = linkObj;
    else if (
      t.includes("fee report") ||
      t.includes("ledger") ||
      t.includes("fee details") ||
      href.includes("ConsolidatedFeeReport")
    )
      buckets.fee_details = linkObj;
    else if (t.includes("study plan")) buckets.study_plan = linkObj;
    else if (t.includes("logout")) buckets.logout = linkObj;
    else if (text && !["StudentPloRpt"].some((x) => href.includes(x)))
      buckets.others.push(linkObj);
  }

  const userImg = document.querySelector(".m-topbar__userpic img")?.src || "";
  const userName =
    window.FlexUtils.safeText(".m-topbar__username") || "Student";

  return { buckets, userImg, userName };
};

//main render page
window.FlexUtils.renderInternalPage = function (mainContentHTML, pageTitle) {
  try {
    const { buckets, userImg, userName } = window.FlexUtils.scrapeSidebar();
    const ICONS = window.FlexUtils.ICONS;

    let currentTheme = "light";
    for (const t of THEMES) {
      if (document.body.classList.contains(t + "-mode")) currentTheme = t;
    }
    const currentIconKey = THEME_ICONS[currentTheme];

    const buildLink = (link, icon, labelOverride) =>
      link
        ? `<a href="${link.href}" class="nav-link ${link.isActive ? "active" : ""}">
                <div class="nav-icon">${icon || ""}</div>${labelOverride || link.text}
            </a>`
        : "";

    //this dropdown is used for desktop sidebar, not the mobile header
    const buildDropdown = (title, icon, items) => {
      const hasActive = items.some((i) => i?.isActive);
      return `<details class="nav-group" ${hasActive ? "open" : ""}>
                    <summary class="nav-link dropdown-summary">
                        <div style="display:flex; align-items:center;">
                            <div class="nav-icon">${icon}</div>${title}
                        </div>
                        <div class="arrow-icon">${ICONS.chevron}</div>
                    </summary>
                    <div class="dropdown-content">
                        ${items.map((l) => (l ? `<a href="${l.href}" class="nav-link sub-link ${l.isActive ? "active" : ""}">${l.text}</a>` : "")).join("")}
                    </div>
                </details>`;
    };

    //mobile header HTML
    const mobileHeaderHTML = `
            <div class="mobile-topbar">
                <div class="brand mobile-brand">FLEX<span>+</span></div>
                <div class="mobile-actions">
                    <button id="theme-toggle-mobile" class="theme-toggle-btn icon-btn">
                        ${ICONS[currentIconKey]}
                    </button>
                    <button id="mobile-menu-btn" class="icon-btn">
                        ${ICONS.menu}
                    </button>
                </div>
            </div>
            <div id="mobile-overlay" class="mobile-overlay"></div>
        `;

    //sidebar HTML
    const sidebarHTML = `
            <aside class="modern-sidebar" id="main-sidebar">
                <div class="brand-row">
                    <div class="brand">FLEX<span>+</span></div>
                    <div class="sidebar-actions">
                        <button id="theme-toggle-btn" class="theme-toggle-btn desk-only">
                            ${ICONS[currentIconKey]}
                        </button>
                        <button id="sidebar-close-btn" class="icon-btn mobile-only">
                            ${ICONS.close}
                        </button>
                    </div>
                </div>
                
                <div class="nav-scroll">
                    ${buildLink(buckets.home, ICONS.home, "Home")}
                    ${buildLink(buckets.attendance, ICONS.clock, "Attendance")}
                    ${buildLink(buckets.marks, ICONS.edit, "Marks")}
                    ${buildLink(buckets.transcript, ICONS.book, "Transcript")}
                    ${buildDropdown("Course", ICONS.list, [buckets.course_reg, buckets.course_feedback])}
                    ${buildDropdown("Fees", ICONS.dollar, [buckets.fee_challan, buckets.fee_details])}
                    ${buildLink(buckets.study_plan, ICONS.plan, "Study Plan")}
                    <div class="nav-divider"></div>
                    <details class="nav-group others-group">
                        <summary class="nav-link dropdown-summary">
                            <div style="display:flex; align-items:center;"><div class="nav-icon">${ICONS.folder}</div>Others</div>
                            <div class="arrow-icon">${ICONS.chevron}</div>
                        </summary>
                        <div class="dropdown-content">
                            <div class="sidebar-warning">Please disable the extension to visit these pages.</div>
                            ${buckets.others.map((l) => `<div class="nav-link sub-link disabled-link">${l.text}</div>`).join("")}
                        </div>
                    </details>
                    <div style="margin-top:auto;"></div>
                    ${buildLink(buckets.logout, ICONS.power)}
                </div>
                
                <div class="user-footer">
                    <img src="${userImg}" class="user-img" id="sidebar-user-img">
                    <div class="user-name">${userName}</div>
                </div>
            </aside>
        `;

    const root = document.createElement("div");
    root.id = "modern-root";
    root.innerHTML = `${mobileHeaderHTML}${sidebarHTML}<main class="modern-main"><div class="header-row"><h1 class="page-title">${pageTitle}</h1></div>${mainContentHTML}</main>`;

    const oldRoot = document.getElementById("modern-root");
    if (oldRoot) oldRoot.remove();
    document.body.appendChild(root);

    document.body.classList.add("modern-active");

    //Event listeners for theme toggles, onClick does not work in extension injected HTML
    document
      .getElementById("theme-toggle-btn")
      ?.addEventListener("click", window.FlexUtils.toggleTheme);
    document
      .getElementById("theme-toggle-mobile")
      ?.addEventListener("click", window.FlexUtils.toggleTheme);

    //mobile menu toggle logic
    const sidebar = document.getElementById("main-sidebar");
    const overlay = document.getElementById("mobile-overlay");
    const menuBtn = document.getElementById("mobile-menu-btn");
    const closeBtn = document.getElementById("sidebar-close-btn");

    const toggleMenu = () => {
      sidebar.classList.toggle("mobile-open");
      overlay.classList.toggle("active");
    };

    menuBtn?.addEventListener("click", toggleMenu);
    closeBtn?.addEventListener("click", toggleMenu);
    overlay?.addEventListener("click", toggleMenu);
  } catch (e) {
    console.error("Error Occured in renderInternalPage utils.js", e);
  }
};

