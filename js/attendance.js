(function initAttendance() {
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.includes("attendance")) {
    console.log("not an attendance page, exiting. Path was:", currentPath);
    return;
  }
  try {
    console.log("attendance script loaded"); //for debug

    //==================
    //wait for dom content(ai)
    //faced a bug where new html was loaded and data was not present yet
    //so this function waits for elements to appear
    function waitForElements() {
      return new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
          //check if tabs exist
          const tabs = document.querySelectorAll(".nav-tabs .nav-link");
          if (tabs.length > 0) return resolve({ status: "success" });

          //check for specific error alert
          const errorAlert = document.querySelector(".m-alert.alert-danger");
          if (errorAlert && errorAlert.innerText.includes("No Record")) {
            return resolve({ status: "error" });
          }

          //give up after 3s
          if (attempts++ >= 30) return resolve({ status: "timeout" });
          setTimeout(check, 100);
        };
        check();
      });
    }

    //==================
    //data scraping logic(ai)
    //flex has a dropdown to select semester, so we need to extract that info
    const extractSemesterData = () => {
      //get form info for semester dropdown
      const form =
        document.querySelector('form[action*="StudentAttendance"]') ||
        document.querySelector("form");
      if (!form) return null;

      const select = form.querySelector("select");
      if (!select) return null;
      return {
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input[type="hidden"]')).map(
          (i) => ({ name: i.name, value: i.value }),
        ),
        options: Array.from(select.options).map((o) => ({
          value: o.value,
          text: o.text.trim(),
          selected: o.selected,
        })),
        selectName: select.name,
      };
    };

    const scrapeAttendance = () => {
      const courses = [];
      const tabs = document.querySelectorAll(".nav-tabs .nav-link");

      for (const tab of tabs) {
        const courseCode = tab.innerText.trim();
        const courseName = tab.getAttribute("title") || courseCode;
        const targetId = tab.getAttribute("href");

        if (!targetId || targetId === "#") return;

        const pane = document.getElementById(targetId.substring(1));
        if (!pane) return;

        //parse attendance percentage
        let attendancePct = 0;
        const progBar = pane.querySelector(".progress-bar");
        if (progBar)
          attendancePct = parseFloat(progBar.innerText.replace("%", "")) || 0;

        //parse history table
        const rows = pane.querySelectorAll("table tbody tr");
        const history = [];
        let stats = { P: 0, A: 0, L: 0 };

        for (const row of rows) {
          const cols = row.querySelectorAll("td");
          if (cols.length < 2) return;

          const date = cols[1]?.innerText.trim() || "-";
          const lastCol = cols[cols.length - 1];
          const statusText = lastCol ? lastCol.innerText.trim() : "-";
          const s = statusText.toUpperCase();

          //stats
          if (s.includes("P")) stats.P++;
          else if (s.includes("A")) stats.A++;
          else if (s.includes("L")) stats.L++;

          history.push({ date, status: statusText });
        }

        courses.push({
          id: courseCode.replace(/[^a-zA-Z0-9]/g, ""),
          code: courseCode,
          name: courseName,
          attendance: attendancePct,
          stats: stats,
          history: history,
        });
      }
      return { courses };
    };

    //==================
    //html generators
    const buildSemesterForm = (data) => {
      if (!data) return "";
      const opts = data.options
        .map(
          (o) =>
            `<option value="${o.value}" ${o.selected ? "selected" : ""}>${o.text}</option>`,
        )
        .join("");
      const inps = data.inputs
        .map((i) => `<input type="hidden" name="${i.name}" value="${i.value}">`)
        .join("");
      return `<div class="dash-card semester-card"><form action="${data.action}" method="${data.method}">${inps}<label>Academic Session</label><select name="${data.selectName}" class="sem-select" onchange="this.form.submit()">${opts}</select></form></div>`;
    };

    //==================
    //main execution flow
    waitForElements()
      .then((result) => {
        const semesterData = extractSemesterData();
        let mainContent = "";
        let modalContent = "";

        //handle states
        if (result.status === "error") {
          mainContent = `<div class="empty-card"><h3>No records found.</h3></div>`;
        } else if (result.status === "timeout") {
          mainContent = `<div class="empty-card"><h3>Loading Timeout</h3></div>`;
        } else {
          const { courses } = scrapeAttendance();

          if (courses.length > 0) {
            //grid cards
            mainContent =
              `<div class="att-grid">` +
              courses
                .map((c) => {
                  const isSafe = c.attendance >= 80;
                  const color = isSafe ? "#38A169" : "#E53E3E";

                  return `
                        <div class="dash-card att-card">
                            <div class="att-header">
                                <div class="code">${c.code}</div>
                                <div class="percent" style="color:${color}">${c.attendance}%</div>
                            </div>
                            <div class="name" title="${c.name}">${c.name}</div>
                            <div class="att-bar">
                                <div class="att-fill" style="width:${c.attendance}%; background:${color}"></div>
                            </div>
                            <div class="att-stats">
                                <div class="modern-badge att-pill success">P: ${c.stats.P}</div>
                                <div class="modern-badge att-pill danger">A: ${c.stats.A}</div>
                                <div class="modern-badge att-pill warning">L: ${c.stats.L}</div>
                            </div>
                            <button class="modern-btn w-full" data-course-id="${c.id}">View History</button>
                        </div>`;
                })
                .join("") +
              `</div>`;

            modalContent = `
                        <div id="att-modal-overlay" class="modern-modal-overlay"></div>
                        ${courses
                          .map(
                            (c) => `
                            <div id="modal-${c.id}" class="modern-modal">
                                <div class="modern-modal-header">
                                    <h3>${c.code} History</h3>
                                    <button class="modern-close-btn" data-close="true">×</button>
                                </div>
                                <div class="modern-modal-body">
                                    <table class="modern-table">
                                        <thead><tr><th>Date</th><th>Status</th></tr></thead>
                                        <tbody>
                                            ${c.history
                                              .map(
                                                (row) => `
                                                <tr>
                                                    <td>${row.date}</td>
                                                    <td>
                                                        <span class="modern-badge ${row.status.includes("P") ? "success" : row.status.includes("A") ? "danger" : "warning"}">
                                                            ${row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            `,
                                              )
                                              .join("")}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `,
                          )
                          .join("")}
                    `;
          } else {
            mainContent = `<div class="empty-state"><h3>No Data</h3></div>`;
          }
        }

        const finalHTML = `${buildSemesterForm(semesterData)}${mainContent}${modalContent}`;
        window.FlexUtils.renderInternalPage(finalHTML, "Attendance Overview");

        //==================
        // event binding

        //open modal
        document.querySelectorAll(".modern-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = e.target
              .closest("button")
              .getAttribute("data-course-id");
            if (!id) return;
            const modal = document.getElementById(`modal-${id}`);
            const overlay = document.getElementById("att-modal-overlay");
            if (modal && overlay) {
              overlay.classList.add("active");
              modal.classList.add("active");
            }
          });
        });

        //close modal
        const closeModal = () => {
          document
            .getElementById("att-modal-overlay")
            ?.classList.remove("active");
          document
            .querySelectorAll(".modern-modal")
            .forEach((m) => m.classList.remove("active"));
        };

        document
          .querySelectorAll(".modern-close-btn")
          .forEach((btn) => btn.addEventListener("click", closeModal));

        const overlay = document.getElementById("att-modal-overlay");
        if (overlay) overlay.addEventListener("click", closeModal);
      })
      .catch((e) => console.error(e));
  } catch (e) {
    console.error("Attendance Page Error: ", e);
    document.body.classList.remove("modern-active");
  }
})();
