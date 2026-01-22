(function initMarks() {
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.includes("studentmarks")) {
    console.log("not a studentmarks page, exiting. Path was:", currentPath);
    return;
  }
  
  try {
    console.log("Marks script loaded"); //for debug

    //==================
    // logic & helpers
    const extractSemesterData = () => {
      //semester dropdown info
      const form =
        document.querySelector('form[action*="StudentMarks"]') ||
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

    const calculateCategoryStats = (categoryName, items) => {
      //normalize data
      //normalizing means calculating each item's contribution to the final grade based on its weight
      const processedItems = items.map((item) => {
        const ratio = item.rawTotal > 0 ? item.weight / item.rawTotal : 0;
        return {
          ...item,
          contribution: item.rawObt * ratio,
          minContrib: (item.min || 0) * ratio,
          maxContrib: (item.max || 0) * ratio,
          percentage:
            item.rawTotal > 0 ? (item.rawObt / item.rawTotal) * 100 : 0,
          isDropped: false,
        };
      });

      //determine best-n limit
      //for quizzes/assignments counting best 3, for labs best 10, else all
      let limit = Infinity;
      const nameLower = categoryName.toLowerCase();
      if (nameLower.includes("quiz") || nameLower.includes("assignment")) {
        limit = 3;
      } else if (nameLower.includes("lab")) {
        limit = 10;
      }

      //sort best to worst
      const sortedIndices = processedItems
        .map((item, index) => ({ index, pct: item.percentage }))
        .sort((a, b) => b.pct - a.pct)
        .map((x) => x.index);

      const includedIndices = new Set(sortedIndices.slice(0, limit));

      let totalWeight = 0;
      let totalObtained = 0;
      let totalClassMin = 0;
      let totalClassMax = 0;

      //sum valid items only
      const finalItems = processedItems.map((item, index) => {
        if (includedIndices.has(index)) {
          totalWeight += item.weight;
          totalObtained += item.contribution;
          totalClassMin += item.minContrib;
          totalClassMax += item.maxContrib;
          return { ...item, isDropped: false };
        } else {
          return { ...item, isDropped: true };
        }
      });

      return {
        items: finalItems,
        total: {
          weight: parseFloat(totalWeight.toFixed(2)),
          obtained: parseFloat(totalObtained.toFixed(2)),
          classMin: parseFloat(totalClassMin.toFixed(2)),
          classMax: parseFloat(totalClassMax.toFixed(2)),
        },
      };
    };

    //==================
    //dom scraping
    const scrapeData = () => {
      const errorAlert = document.querySelector(".alert-danger");
      if (errorAlert && errorAlert.innerText.includes("No Record"))
        return { error: "No records found." };

      const courses = [];
      const tabs = document.querySelectorAll(".nav-tabs .nav-link");

      if (tabs.length === 0) return { error: null, courses: [] };

      tabs.forEach((tab) => {
        const courseCode = tab.innerText.trim();
        const targetId = tab.getAttribute("href");
        if (!targetId || targetId === "#") return;

        const pane = document.getElementById(targetId.substring(1));
        if (!pane) return;

        const titleEl = pane.querySelector("h5");
        const fullTitle = titleEl ? titleEl.innerText.trim() : courseCode;

        const categories = [];
        let courseTotalWeight = 0;
        let courseTotalObtained = 0;
        let courseTotalMin = 0;
        let courseTotalMax = 0;

        const cards = pane.querySelectorAll(".card");

        cards.forEach((card) => {
          //extract category name
          const btn = card.querySelector(".card-header button");
          let categoryName = btn ? btn.innerText.trim() : "Other";
          if (categoryName.includes("-"))
            categoryName = categoryName.split("-").pop().trim();
          if (categoryName.includes("Grand Total")) return;

          const rows = card.querySelectorAll(".calculationrow");
          const rawItems = [];

          //extract row data
          rows.forEach((row) => {
            const getNum = (sel) =>
              parseFloat(row.querySelector(sel)?.innerText.trim()) || 0;
            const getText = (sel) =>
              row.querySelector(sel)?.innerText.trim() || "-";
            const name =
              row.querySelector("td:first-child")?.innerText.trim() || "#";
            const weight = getNum(".weightage");
            const rawObt = getNum(".ObtMarks");
            const rawTotal = getNum(".GrandTotal");
            const obtText = getText(".ObtMarks");
            const avg = getNum(".AverageMarks");
            const min = getNum(".MinMarks");
            const max = getNum(".MaxMarks");

            //status check
            let status = "neutral";
            if (rawTotal > 0) {
              const pct = (rawObt / rawTotal) * 100;
              status = pct >= 80 ? "good" : pct < 50 ? "bad" : "warn";
            }
            rawItems.push({
              name,
              weight,
              rawTotal,
              rawObt,
              obtText,
              avg,
              min,
              max,
              status,
            });
          });

          if (rawItems.length > 0) {
            const stats = calculateCategoryStats(categoryName, rawItems);
            categories.push({
              name: categoryName,
              assessments: stats.items,
              total: stats.total,
            });
            courseTotalWeight += stats.total.weight;
            courseTotalObtained += stats.total.obtained;
            courseTotalMin += stats.total.classMin;
            courseTotalMax += stats.total.classMax;
          }
        });

        //finalize course obj
        courses.push({
          id: courseCode.replace(/[^a-zA-Z0-9]/g, ""),
          code: courseCode,
          title: fullTitle,
          categories: categories,
          grandTotal: {
            weight: Math.ceil(courseTotalWeight),
            obtained: Math.ceil(courseTotalObtained),
            classMin: parseFloat(courseTotalMin.toFixed(2)),
            classMax: parseFloat(courseTotalMax.toFixed(2)),
          },
        });
      });

      return { error: null, courses };
    };

    const semesterData = extractSemesterData();
    const { error, courses } = scrapeData();

    //==================
    //html generators
    const buildSemesterForm = () => {
      if (!semesterData) return "";
      const options = semesterData.options
        .map(
          (o) =>
            `<option value="${o.value}" ${o.selected ? "selected" : ""}>${o.text}</option>`,
        )
        .join("");
      const inputs = semesterData.inputs
        .map((i) => `<input type="hidden" name="${i.name}" value="${i.value}">`)
        .join("");
      return `<div class="semester-card"><form action="${semesterData.action}" method="${semesterData.method}">${inputs}<label>Academic Session</label><select name="${semesterData.selectName}" class="sem-select" onchange="this.form.submit()">${options}</select></form></div>`;
    };

    const buildCourseTabs = () => {
      if (error || courses.length === 0) return "";
      const btns = courses
        .map(
          (c, i) =>
            `<button class="course-tab-btn ${i === 0 ? "active" : ""}" data-id="${c.id}">${c.code}</button>`,
        )
        .join("");
      return `<div class="course-tabs-container">${btns}</div>`;
    };

    const buildCourseContent = () => {
      if (error) return `<div class="empty-state"><h3>${error}</h3></div>`;
      if (courses.length === 0)
        return `<div class="empty-state"><h3>No Data</h3></div>`;

      //static threshold
      const gradeThresholds = [
        { val: 50, l: "D" },
        { val: 54, l: "D+" },
        { val: 58, l: "C-" },
        { val: 62, l: "C" },
        { val: 66, l: "C+" },
        { val: 70, l: "B-" },
        { val: 74, l: "B" },
        { val: 78, l: "B+" },
        { val: 82, l: "A-" },
        { val: 86, l: "A" },
        { val: 90, l: "A+" },
      ];

      return courses
        .map((c, idx) => {
          const totalObtained = c.grandTotal.obtained;
          const totalWeight = c.grandTotal.weight;
          const classMin = c.grandTotal.classMin;
          const classMax = c.grandTotal.classMax;

          //clamping for visual timeline
          const userPct = Math.min(Math.max(totalObtained, 0), 100);
          const maxPct = Math.min(Math.max(totalWeight, 0), 100);
          const clsMinPct = Math.min(Math.max(classMin, 0), 100);
          const clsMaxPct = Math.min(Math.max(classMax, 0), 100);
          const userStatus = totalObtained < 50 ? "fail" : "pass";

          const gradeMarkersHTML = gradeThresholds
            .map(
              (g) =>
                `<div class="grade-threshold" style="left: ${g.val}%">
                        <div class="grade-dashed-line"></div>
                        <span class="grade-text-val">${g.l}[${g.val}]</span>
                     </div>`,
            )
            .join("");

          return `
                <div class="course-pane ${idx === 0 ? "active" : ""}" id="pane-${c.id}">
                    <div class="course-card">
                        <div class="course-header">
                            <h3 class="course-title">${c.title}</h3>
                            <div class="course-summary">
                                <div class="sum-item"><span class="lbl">Total Weight</span><span class="val">${c.grandTotal.weight}</span></div>
                                <div class="sum-item"><span class="lbl">Obtained</span><span class="val ${c.grandTotal.obtained < 50 ? "fail" : "pass"}">${c.grandTotal.obtained}</span></div>
                            </div>
                        </div>

                        <div class="timeline-container">
                            <div class="timeline-header">
                                <span class="t-label-start">0</span>
                                <span class="t-label-end">100</span>
                            </div>
                            <div class="timeline-track-wrapper">
                                <div class="timeline-track"></div>
                                ${gradeMarkersHTML}
                                <div class="timeline-fill-max" style="width: ${maxPct}%"></div>
                                <div class="timeline-range-class" style="left: ${clsMinPct}%; width: ${clsMaxPct - clsMinPct}%"></div>

                                <div class="timeline-marker marker-cls-min" style="left: ${clsMinPct}%">
                                    <div class="marker-dot dot-min"></div>
                                    <div class="marker-label label-card card-min">Min<br><b>${classMin}</b></div>
                                </div>

                                <div class="timeline-marker marker-cls-max" style="left: ${clsMaxPct}%">
                                    <div class="marker-dot dot-max"></div>
                                    <div class="marker-label label-card card-max">Max<br><b>${classMax}</b></div>
                                </div>

                                <div class="timeline-marker marker-user" style="left: ${userPct}%">
                                    <div class="marker-dot ${userStatus}"></div>
                                    <div class="marker-label label-card card-user">You<br><b>${totalObtained}</b></div>
                                </div>

                                <div class="timeline-marker marker-max" style="left: ${maxPct}%">
                                    <div class="marker-line"></div>
                                </div>
                            </div>
                        </div>

                        ${
                          c.categories.length > 0
                            ? `
                            <div class="categories-list">
                                ${c.categories
                                  .map(
                                    (cat, i) => `
                                    <div class="category-group ${i === 0 ? "" : "collapsed"}">
                                        <div class="category-header">
                                            <div style="display:flex; align-items:center; gap:12px;">
                                                <span class="cat-title">${cat.name}</span>
                                            </div>
                                            <div class="cat-score">
                                                <span>${cat.total.obtained.toFixed(2)}</span> / ${cat.total.weight}
                                            </div>
                                        </div>
                                        <div class="category-body">
                                            <div class="table-responsive">
                                                <table class="modern-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Item</th>
                                                            <th class="text-center">Weight</th>
                                                            <th class="text-center">Total</th>
                                                            <th class="text-center">Obt</th>
                                                            <th class="text-center stat">Avg</th>
                                                            <th class="text-center stat">Min</th>
                                                            <th class="text-center stat">Max</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${cat.assessments
                                                          .map(
                                                            (a) => `
                                                            <tr class="${a.isDropped ? "row-dropped" : ""}">
                                                                <td>
                                                                    <span class="status-dot ${a.isDropped ? "neutral" : a.status}"></span> 
                                                                    ${a.name}
                                                                    ${a.isDropped ? '<span class="dropped-badge">Dropped</span>' : ""}
                                                                </td>
                                                                <td class="text-center">${a.weight}</td>
                                                                <td class="text-center">${a.rawTotal}</td>
                                                                <td class="text-center"><span class="obt-badge ${a.isDropped ? "neutral" : a.status}">${a.obtText}</span></td>
                                                                <td class="text-center stat">${a.avg}</td>
                                                                <td class="text-center stat">${a.min}</td>
                                                                <td class="text-center stat">${a.max}</td>
                                                            </tr>
                                                        `,
                                                          )
                                                          .join("")}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                `,
                                  )
                                  .join("")}
                            </div>
                        `
                            : `<div style="padding:20px; text-align:center; color:#999;">No marks uploaded yet.</div>`
                        }
                    </div>
                </div>
            `;
        })
        .join("");
    };

    //==================
    //render & events
    const finalHTML = `${buildSemesterForm()}${buildCourseTabs()}<div class="courses-wrapper">${buildCourseContent()}</div>`;
    window.FlexUtils.renderInternalPage(finalHTML, "Marks & Grades");

    //tab switching logic
    const tabsContainer = document.querySelector(".course-tabs-container");
    if (tabsContainer) {
      tabsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".course-tab-btn");
        if (!btn) return;
        const targetId = btn.getAttribute("data-id");
        document
          .querySelectorAll(".course-tab-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        document
          .querySelectorAll(".course-pane")
          .forEach((p) => p.classList.remove("active"));
        document.getElementById(`pane-${targetId}`)?.classList.add("active");
      });
    }

    //collapse logic
    const wrapper = document.querySelector(".courses-wrapper");
    if (wrapper) {
      wrapper.addEventListener("click", (e) => {
        const header = e.target.closest(".category-header");
        if (!header) return;
        const group = header.closest(".category-group");
        if (group) group.classList.toggle("collapsed");
      });
    }
  } catch (e) {
    console.error("Marks Page Error: ", e);
    document.body.classList.remove("modern-active");
  }
})();
