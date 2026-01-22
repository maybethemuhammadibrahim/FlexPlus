(function initHome() {
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.includes("home") && window.location.pathname !== "/") {
    console.log("not a home page, exiting. Path was:", currentPath);
    return;
  }
  
  try {
    console.log("home script loaded"); //only for debug

    const infoMap = {};
    for (const p of document.querySelectorAll(".m-portlet__body p")) {
      const label = p
        .querySelector("span.m--font-boldest")
        ?.innerText.replace(":", "")
        .trim();
      const value = p
        .querySelector("span:not(.m--font-boldest)")
        ?.innerText.trim();
      if (label && value) infoMap[label] = value;
    }

    const groups = {
      profile: ["Roll No", "Degree", "Section", "Batch", "Campus"],
      personal: ["CNIC", "DOB", "Gender", "Mobile", "Email", "Address"],
      schedule: [
        "Registration",
        "Classes",
        "Withdraw Request",
        "Online Feedback #1",
        "Online Feedback #2",
        "Retake Request",
      ],
    };

    function getVal(k) {
      if (infoMap[k]) {
        return infoMap[k];
      } else {
        return "-";
      }
    }
    let name = infoMap["Name"];

    if (!name) {
      name = "Student";
    }

    const profileHTML = `
            <div class="dash-header-card">
                <div class="dash-avatar">
                    <img src="/Login/GetImage" alt="${name}" 
                         onerror="this.parentElement.innerHTML='<span>${name.charAt(0)}</span>'">
                </div>
                <div class="dash-identity">
                    <h2 class="student-name">${name}</h2>
                    <div class="student-meta">
                        ${groups.profile
                          .map(
                            (k) => `
                            <span class="meta-tag">
                                <span class="lbl">${k}:</span> ${getVal(k)}
                            </span>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        `;

    const personalHTML = `
            <div class="dash-card">
                <div class="dash-card-title">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    Personal Details
                </div>
                <div class="dash-grid-2">
                    ${groups.personal
                      .map(
                        (k) => `
                        <div class="dash-item">
                            <div class="dash-label">${k}</div>
                            <div class="dash-value">${getVal(k)}</div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;

    const scheduleHTML = `
            <div class="dash-card">
                <div class="dash-card-title">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Academic Deadlines
                </div>
                <div class="timeline-list">
                    ${groups.schedule
                      .map(
                        (k) => `
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <div class="timeline-title">${k}</div>
                                <div class="timeline-date">${getVal(k)}</div>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;

    const finalHTML = `
            <div class="dashboard-wrapper">
                ${profileHTML}
                <div class="dashboard-columns">
                    <div class="col-main">${personalHTML}</div>
                    <div class="col-side">${scheduleHTML}</div>
                </div>
            </div>
        `;

    window.FlexUtils.renderInternalPage(finalHTML, "Student Dashboard");
  } catch (e) {
    console.error("Home Module Error:", e);
    document.body.classList.remove("modern-active");
  }
})();
