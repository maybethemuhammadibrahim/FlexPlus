(function initStudyPlan() {
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.includes("studyplan")) {
    console.log("not a studyplan page, exiting. Path was:", currentPath);
    return;
  }
  
  try {
    console.log("study plan script loaded"); //only for debug

    const semesters = [];
    const semesterBlocks = document.querySelectorAll(
      ".m-section__content .row .col-md-6",
    );

    semesterBlocks.forEach((block) => {
      const headerText =
        block.querySelector("h4")?.innerText.trim() || "Unknown Semester";
      const [semTitle, semSession] = headerText
        .split("\n")
        .map((s) => s.trim());

      const courses = [];
      block.querySelectorAll("table tbody tr").forEach((row) => {
        const cells = row.cells;
        if (cells.length < 4) return;
        courses.push({
          code: cells[0].innerText.trim(),
          name: cells[1].innerText.trim(),
          credits: cells[2].innerText.trim(),
          type: cells[3].innerText.trim(),
        });
      });

      if (courses.length > 0) {
        semesters.push({
          title: semTitle,
          session: semSession || "",
          courses: courses,
        });
      }
    });

    const gridContent = semesters
      .map(
        (sem) => `
            <div class="dash-card semester-card">
                <div class="semester-header toggle-trigger">
                    <div class="header-content">
                        <div class="sem-title-group">
                            <h3 class="dash-card-title no-border mb-0">${sem.title}</h3>
                            <span class="meta-tag session-tag">${sem.session.replace(/[()]/g, "")}</span>
                        </div>
                        <div class="sem-subtitle">${sem.courses.length} Courses</div>
                    </div>
                    <div class="chevron-icon">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                </div>
                
                <div class="course-list-wrapper">
                    <div class="course-list">
                        ${sem.courses
                          .map(
                            (c) => `
                            <div class="sp-course-item">
                                <div class="sp-icon-box">${c.code.substring(0, 2)}</div>
                                <div class="sp-details">
                                    <div class="sp-name">${c.name}</div>
                                    <div class="sp-sub">
                                        <span class="code-pill">${c.code}</span>
                                        <span class="type-pill ${c.type.toLowerCase()}">${c.type}</span>
                                    </div>
                                </div>
                                <div class="sp-credits">${c.credits} Cr</div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        `,
      )
      .join("");

    const finalHTML = `
            <div class="dashboard-wrapper studyplan-view">
                <div class="dash-grid studyplan-grid">
                    ${gridContent || '<div class="empty-card">No study plan data found.</div>'}
                </div>
            </div>
        `;

    window.FlexUtils.renderInternalPage(finalHTML, "Study Plan");

    const triggers = document.querySelectorAll(".toggle-trigger");

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", function () {
        const card = this.closest(".semester-card");
        const isOpen = card.classList.toggle("is-open");
      });
    });
  } catch (e) {
    console.error("StudyPlan Module Error:", e);
    document.body.classList.remove("modern-active");
  }
})();
