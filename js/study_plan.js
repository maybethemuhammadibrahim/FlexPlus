(function initStudyPlan() {
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.includes("studyplan")) {
    console.log("not a studyplan page, exiting. Path was:", currentPath);
    return;
  }
  
  try {
    console.log("study plan script loaded"); //only for debug

    const slugify = (value, index) =>
      `${value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "semester"}-${index}`;

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
          id: slugify(semTitle, semesters.length),
          title: semTitle,
          session: semSession || "",
          courses: courses,
        });
      }
    });

    const gridContent = semesters
      .map(
        (sem) => `
            <div class="dash-card semester-card" data-semester-id="${sem.id}">
          <div class="semester-header toggle-trigger" data-semester-id="${sem.id}" role="button" tabindex="0">
                    <div class="header-content">
                        <div class="sem-title-group">
                            <h3 class="dash-card-title no-border mb-0">${sem.title}</h3>
                            <span class="meta-tag session-tag">${sem.session.replace(/[()]/g, "")}</span>
                        </div>
                        <div class="sem-subtitle">${sem.courses.length} Courses</div>
                        <div class="sem-course-pills">
                            ${sem.courses
                              .map(
                                (c) => `<span class="course-id-pill">${c.code}</span>`,
                              )
                              .join("")}
                        </div>
                        <div class="sem-open-hint">Open details</div>
                    </div>
          </div>
            </div>
        `,
      )
      .join("");

    const modalContent = semesters
      .map(
        (sem) => `
            <div id="modal-${sem.id}" class="modern-modal">
                <div class="modern-modal-header">
                    <h3 class="modern-modal-title">${sem.title}</h3>
                    <button class="modern-close-btn" data-close="true" aria-label="Close modal">×</button>
                </div>
                <div class="modern-modal-body">
                    <div class="semester-modal-summary">
                        <span class="meta-tag session-tag">${sem.session.replace(/[()]/g, "")}</span>
                        <span class="sem-subtitle">${sem.courses.length} Courses</span>
                    </div>
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
            <div id="studyplan-modal-overlay" class="modern-modal-overlay"></div>
            ${modalContent}
        `;

    window.FlexUtils.renderInternalPage(finalHTML, "Study Plan");

    const openModal = (id) => {
      const modal = document.getElementById(`modal-${id}`);
      const overlay = document.getElementById("studyplan-modal-overlay");
      if (!modal || !overlay) return;
      overlay.classList.add("active");
      modal.classList.add("active");
    };

    const closeModal = () => {
      document.getElementById("studyplan-modal-overlay")?.classList.remove("active");
      document.querySelectorAll(".modern-modal").forEach((m) => m.classList.remove("active"));
    };

    const triggers = document.querySelectorAll(".toggle-trigger");

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", function () {
        const id = this.getAttribute("data-semester-id");
        if (!id) return;
        openModal(id);
      });
    });

    document.querySelectorAll(".modern-close-btn").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    document.getElementById("studyplan-modal-overlay")?.addEventListener("click", closeModal);
  } catch (e) {
    console.error("StudyPlan Module Error:", e);
    document.body.classList.remove("modern-active");
  }
})();
