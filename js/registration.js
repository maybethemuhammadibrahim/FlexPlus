(function initRegistration() {
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.includes("courseregistration")) {
    console.log("not a registration page, exiting. Path was:", currentPath);
    return;
  }

  try {
    console.log("registration script loaded");//only for debug

    const getVal = (selector, index = 0) => {
      const el = document.querySelectorAll(selector)[index];
      return el ? el.innerText.split(":").pop().trim() : "-";
    };

    const data = {
      roll: getVal("#instructionTab p", 0),
      name: getVal("#instructionTab p", 1),
      program: getVal("#instructionTab p", 2),
      batch: getVal("#instructionTab p", 3),
      section: getVal("#instructionTab p", 4),

      limit: document.getElementById("crslimit")?.innerText.trim() || "0",
      regCourses:
        document.getElementById("alreadyreg")?.innerText.trim() || "0",
      regCredits: getVal("#instructionTab p", 7),
      semester: getVal("#instructionTab p", 8),

      warnings: getVal("#instructionTab p", 10),
      earned: getVal("#instructionTab p", 11),
      attempted: getVal("#instructionTab p", 12),
      cgpa: getVal("#instructionTab p", 13),
    };

    const overviewCard = `
            <div class="info-overview-card">
        <div class="overview-grid">
        <div class="dash-card">
            <div class="section-header">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2.5"/></svg>
                <span class="dash-label">Profile</span>
            </div>
            <div class="section-body">
                <div class="dash-value primary-text">${data.name}</div>
                <div class="metadata-row">
                    <span class="meta-tag sub-text">${data.roll}</span>
                    <span class="meta-tag sub-text">${data.program}</span>
                </div>
                <div class="metadata-row secondary">
                    <span>${data.section}</span> • <span>${data.batch}</span>
                </div>
            </div>
        </div>

        <div class="dash-card">
            <div class="section-header">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke-width="2.5"/></svg>
                <span class="dash-label">Registration Status</span>
            </div>
            <div class="section-body">
                <div class="dash-value highlight">
                    <span class="current">${
                      data.regCourses
                    }</span><span class="separator">/</span><span class="total">${
                      data.limit
                    }</span>
                    <span class="unit">Courses</span>
                </div>
                <div class="metadata-row">
                    <span class="lbl">Credits:</span> <span class="val">${
                      data.regCredits
                    }</span>
                </div>
                <div class="metadata-row">
                    <span class="lbl">Term:</span> <span class="val">${
                      data.semester
                    }</span>
                </div>
            </div>
        </div>

        <div class="dash-card">
            <div class="section-header">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke-width="2.5"/></svg>
                <span class="dash-label">Academic Standing</span>
            </div>
            <div class="section-body">
                <div class="dash-value highlight gpa-value">${
                  data.cgpa
                } <span class="unit">CGPA</span></div>
                <div class="metadata-row">
                    <span class="lbl">Earned:</span> <span class="val">${
                      data.earned
                    } Cr.</span>
                </div>
                <div class="metadata-row ${
                  parseInt(data.warnings) > 0 ? "danger-text" : ""
                }">
                    <span class="lbl">Warnings:</span> <span class="val">${
                      data.warnings
                    }</span>
                </div>
            </div>
        </div>
    </div>
</div>
        `;

    const finalHTML = `
            <div class="dashboard-wrapper registration-view">
              <div class="dash-card alert-card">
                    <div class="alert-content">
                        <div class="alert-icon">⚠️</div>
                        <div class="alert-text">For reliable registration, please use the original Flex portal. This page is known to change and may contain issues.</div>
                    </div>
                </div>      
                ${overviewCard}

                <div class="registration-main-card">
                    <div class="course-tabs-container">
                        <button class="course-tab-btn active" data-tab="available">Available Courses</button>
                        <button class="course-tab-btn" data-tab="enrolled">Registered Courses</button>
                    </div>
                    <div class="registration-content">
                        <div id="tab-available" class="reg-pane active"><div class="table-modern-wrapper" id="available-table-target"></div></div>
                        <div id="tab-enrolled" class="reg-pane"><div class="table-modern-wrapper" id="enrolled-table-target"></div></div>
                    </div>
                </div>

                <div class="reg-action-pill">
                    <div class="pill-info">
                        <span class="lbl">Selected:</span>
                        <span id="custom-pill-count">0</span>
                        <span class="divider">/</span>
                        <span>${data.limit}</span>
                    </div>
                    <button id="customSubmit" class="pill-btn">Confirm Registration</button>
                </div>
            </div>
        `;

    window.FlexUtils.renderInternalPage(finalHTML, "Registration");

    const finalTableCleanup = (table) => {
      if (!table) return;
      table.classList.remove(
        "table-responsive",
        "m-table",
        "m-table--head-bg-info",
        "m-table--border-info",
      );
      table.removeAttribute("style");
      table
        .querySelectorAll("[style]")
        .forEach((el) => el.removeAttribute("style"));
      table.style.width = "100%";
    };

    const origAvailable = document.getElementById("mainCourses");
    const origEnrolled = document.querySelector("#improveCoursesTab table");

    if (origAvailable) {
      document
        .getElementById("available-table-target")
        .appendChild(origAvailable);
      finalTableCleanup(origAvailable);
    }
    if (origEnrolled) {
      document
        .getElementById("enrolled-table-target")
        .appendChild(origEnrolled);
      finalTableCleanup(origEnrolled);
    }

    const tabs = document.querySelectorAll(".course-tab-btn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        document
          .querySelectorAll(".reg-pane")
          .forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        document
          .getElementById(`tab-${tab.dataset.tab}`)
          .classList.add("active");
      });
    });

    document.getElementById("customSubmit").addEventListener("click", () => {
      document.getElementById("confirmBtnItem")?.click();
    });

    const originalCounter = document.getElementById("selecrslimit");
    if (originalCounter) {
      const sync = () =>
        (document.getElementById("custom-pill-count").innerText =
          originalCounter.innerText.split("+")[0] || "0");
      new MutationObserver(sync).observe(originalCounter, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      sync();
    }
  } catch (e) {
    console.error("Registration UI Error: ", e);
    document.body.classList.remove("modern-active");
  }
})();
