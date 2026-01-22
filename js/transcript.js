(function initTranscript() {
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.includes("transcript")) {
    console.log("not a transcript page, exiting. Path was:", currentPath);
    return;
  }
  

  try {
    console.log("transcript script loaded");

    //============
    //inject css
    const link = document.createElement("link");
    link.href = chrome.runtime.getURL("css/transcript.css");
    link.type = "text/css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    
    let passedCourses = new Set(); 
    let fullPrereqData = null; 
    let selectedDegree = null; 

    
    function waitForContent() {
      return new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
          if (document.querySelectorAll(".col-md-6").length > 0)
            return resolve(true);
          if (attempts++ >= 40) return resolve(false);
          setTimeout(check, 100);
        };
        check();
      });
    }

    //============
    //helper functions
    const GRADE_POINTS = {
      "A+": 4.0,
      A: 4.0,
      "A-": 3.67,
      "B+": 3.33,
      B: 3.0,
      "B-": 2.67,
      "C+": 2.33,
      C: 2.0,
      "C-": 1.67,
      "D+": 1.33,
      D: 1.0,
      F: 0.0,
    };

    const getGradeOptions = (g) =>
      Object.keys(GRADE_POINTS)
        .map(
          (k) =>
            `<option value="${GRADE_POINTS[k]}" ${
              k === g ? "selected" : ""
            }>${k}</option>`,
        )
        .join("") + `<option value="-1">--</option>`;

    const calculateSGPA = (modalBody) => {
      let pts = 0,
        crs = 0;
      modalBody.querySelectorAll("tbody tr").forEach((row) => {
        const c = parseFloat(row.querySelector(".td-credit")?.innerText);
        const v = parseFloat(row.querySelector(".calc-select")?.value);
        if (v >= 0 && !isNaN(c)) {
          pts += c * v;
          crs += c;
        }
      });
      return crs > 0 ? (pts / crs).toFixed(2) : "0.00";
    };

    //============
    //scraper function
    const scrapeTranscript = () => {
      const semesters = [];
      passedCourses.clear();

      document
        .querySelectorAll(".m-portlet__body .col-md-6")
        .forEach((container, index) => {
          const semObj = {
            id: index,
            title: "Unknown",
            sgpa: "0.00",
            cgpa: "0.00",
            crEarned: "0",
            crAtt: "0",
            courses: [],
          };
          semObj.title =
            container.querySelector("h5")?.innerText.trim() || semObj.title;

          const stats = container.querySelector(".pull-right")?.innerText;
          if (stats) {
            semObj.sgpa =
              stats.match(/SGPA\s*:\s*([0-9.]+)/i)?.[1] || semObj.sgpa;
            semObj.cgpa =
              stats.match(/CGPA\s*:\s*([0-9.]+)/i)?.[1] || semObj.cgpa;
            semObj.crAtt =
              stats.match(/Cr\.? ?Att\s*:\s*([0-9]+)/i)?.[1] || semObj.crAtt;
            semObj.crEarned =
              stats.match(/Cr\.? ?Ernd\s*:\s*([0-9]+)/i)?.[1] ||
              semObj.crEarned;
          }

          container.querySelectorAll("table tbody tr").forEach((row) => {
            const cols = row.querySelectorAll("td");
            if (cols.length >= 6) {
              const code = cols[0]?.innerText.trim();
              const grade = cols[4]?.innerText.trim();

              const course = {
                code: code,
                name: cols[1]?.innerText.trim(),
                credits: cols[3]?.innerText.trim(),
                grade: grade,
                points: cols[5]?.innerText.trim(),
                type: cols[6]?.innerText.trim(),
              };

              semObj.courses.push(course);

              //track passed courses (Grades that are not F, W, I)
              if (!["F", "W", "I"].includes(grade) && code) {
                passedCourses.add(code);
              }
            }
          });
          if (semObj.title) semesters.push(semObj);
        });
      return semesters;
    };

    //============
    //prerequisite system
    const initPrereqSystem = async () => {
      const container = document.getElementById("prereq-content-area");

      // 1. Fetch JSON if not loaded
      if (!fullPrereqData) {
        container.innerHTML = `<div class="loading-spinner" style="padding:20px; text-align:center; color:var(--text-muted);">Loading Course Data...</div>`;
        try {
          const url = chrome.runtime.getURL("json/degree_prereqs.json");
          const res = await fetch(url);
          fullPrereqData = await res.json();
        } catch (e) {
          console.error(e);
          container.innerHTML = `<div class="error-msg" style="color:var(--danger-text); text-align:center;">Failed to load Prereq Data. Please check extension files.</div>`;
          return;
        }
      }

      //request loaded, render UI
      renderPrereqUI();
    };

    const renderPrereqUI = () => {
      const container = document.getElementById("prereq-content-area");
      const degrees = Object.keys(fullPrereqData);

      //if no degree selected, pick first ie CS
      if (!selectedDegree) selectedDegree = degrees[0];

      const html = `
                <div class="prereq-controls">
                    <div class="control-group">
                        <label>Degree Program</label>
                        <select id="degree-select" class="modern-select">
                            ${degrees
                              .map(
                                (d) =>
                                  `<option value="${d}" ${
                                    d === selectedDegree ? "selected" : ""
                                  }>${d}</option>`,
                              )
                              .join("")}
                        </select>
                    </div>
                    <div class="control-group" style="flex:1;">
                        <label>Search Course (Code or Name)</label>
                        <input type="text" id="course-search" class="modern-input" placeholder="e.g. CS1002 or Programming...">
                        <div id="search-results" class="search-dropdown"></div>
                    </div>
                </div>
                <div id="chain-visualizer" class="chain-container">
                    <div class="empty-chain-state">
                        Select a course above to visualize its prerequisites and what it unlocks.
                    </div>
                </div>
            `;
      container.innerHTML = html;

      document
        .getElementById("degree-select")
        .addEventListener("change", (e) => {
          selectedDegree = e.target.value;
          //clearssearch box when degree changes
          document.getElementById("course-search").value = "";
          document.getElementById("chain-visualizer").innerHTML =
            '<div class="empty-chain-state">Select a course to visualize.</div>';
        });

      const searchInput = document.getElementById("course-search");
      searchInput.addEventListener("input", (e) =>
        handleSearch(e.target.value),
      );
    };

    const handleSearch = (query) => {
      const resultsBox = document.getElementById("search-results");
      if (query.length < 2) {
        resultsBox.style.display = "none";
        return;
      }

      const degreeData = fullPrereqData[selectedDegree];
      const matches = Object.keys(degreeData)
        .filter((code) => {
          const c = degreeData[code];
          return (
            code.toLowerCase().includes(query.toLowerCase()) ||
            (c.name && c.name.toLowerCase().includes(query.toLowerCase()))
          );
        })
        .slice(0, 5);

      if (matches.length > 0) {
        resultsBox.innerHTML = matches
          .map(
            (code) => `
                    <div class="search-item" data-code="${code}">
                        <b>${code}</b> - ${degreeData[code].name}
                    </div>
                `,
          )
          .join("");
        resultsBox.style.display = "block";

        //event listeners for items
        resultsBox.querySelectorAll(".search-item").forEach((item) => {
          item.addEventListener("click", () => {
            const code = item.dataset.code;
            const name = degreeData[code].name;
            document.getElementById("course-search").value =
              `${code} - ${name}`;
            resultsBox.style.display = "none";
            visualizeChain(code);
          });
        });
      } else {
        resultsBox.style.display = "none";
      }
    };

    const renderTreeRecursive = (node, degreeData, isRoot = false) => {
      if (!node) return "";

      const code = node.code;
      const isMissing = node.missing === true;

      //fallback for missing course data
      const courseData = isMissing
        ? { name: "External/Unknown" }
        : degreeData[code] || { name: "Unknown" };

      const name = courseData.name;
      const isPassed = passedCourses.has(code);

      //render current node
      const nodeHTML = `
        <div class="tf-node ${isPassed ? "passed" : ""} ${
          isMissing ? "missing" : ""
        } ${isRoot ? "current-target" : ""}" 
             title="${name}">
            <div class="node-code">${code}</div>
            <div class="node-name">${name}</div>
        </div>
    `;

      //render children recursively
      let childrenHTML = "";

      //check if has children
      if (node.children && node.children.length > 0) {
        const renderedChildren = node.children
          .map((child) => renderTreeRecursive(child, degreeData, false))
          .join("");

        //if > 1 child use branch/horizontal
        //if 1 child use chain/vertical
        const layoutType = node.children.length > 1 ? "branch" : "chain";

        childrenHTML = `
            <div class="tf-children ${layoutType}">
                ${renderedChildren}
            </div>
        `;
      }

      return `
        <div class="tf-wrapper">
            ${nodeHTML}
            ${childrenHTML}
        </div>
    `;
    };

    const visualizeChain = (targetCode) => {
      const visualizer = document.getElementById("chain-visualizer");
      const degreeData = fullPrereqData[selectedDegree];
      const targetCourse = degreeData[targetCode];

      if (!targetCourse) {
        visualizer.innerHTML = `<div class="empty-chain-state">Data not found for ${targetCode}</div>`;
        return;
      }

      //build the visualization in 3 steps:
      //build the history chain (Prereqs leading to target)
      //build the future tree (Postreqs unlocked by target)
      //merge them

      // We render this as a vertical stack (chain) that leads DOWN to the target.
      const preChain = targetCourse.full_prereq_chain || [];

      //top to bottom approach
      let historyHTML = "";
      if (preChain.length > 0) {
        //we wrap the history in a specific container to style the connector lines
        const historyNodes = preChain
          .map((cCode) => {
            const cData = degreeData[cCode] || {};
            const isPassed = passedCourses.has(cCode);
            return `
                    <div class="tf-wrapper">
                        <div class="tf-node ${
                          isPassed ? "passed" : ""
                        }" style="transform:scale(0.9); opacity:0.8;">
                            <div class="node-code">${cCode}</div>
                            <div class="node-name">${cData.name || ""}</div>
                        </div>
                        <div class="tf-children chain">
                `;
            //we leave the divs open========= we will close them at the end.
            //this nests them: Node1 -> Children -> Node2 -> Children.
          })
          .join("");

        //close the opened divs
        const closingTags = "</div></div>".repeat(preChain.length);

        historyHTML = historyNodes + "{TREE_PLACEHOLDER}" + closingTags;
      } else {
        //no history? just put the tree placeholder
        historyHTML = "{TREE_PLACEHOLDER}";
      }

      //future tree (postreqs)
      let treeData = targetCourse.visual_tree;

      //fallback same as before
      if (!treeData) {
        const postreqs = targetCourse.postreqs_immediate || [];
        treeData = {
          code: targetCode,
          children: postreqs.map((p) => ({ code: p, children: [] })), // Simple 1-level fallback
        };
      }

      // Render the tree starting from the target course
      //we pass 'true' to mark this as the root (Target Course)
      const futureTreeHTML = renderTreeRecursive(treeData, degreeData, true);

      //merge both parts
      const finalHTML = historyHTML.replace(
        "{TREE_PLACEHOLDER}",
        futureTreeHTML,
      );

      visualizer.innerHTML = `
            <div class="tree-diagram-container">
                <div class="tf-wrapper">
                    ${finalHTML}
                </div>
            </div>
        `;
    };

    //AI GENERATED
    const generateGraphHTML = (semesters) => {
      const valid = semesters
        .map((s, i) => ({ ...s, i: i + 1, v: parseFloat(s.sgpa) || 0 }))
        .filter((s) => s.v > 0);
      if (valid.length < 2) return "";

      const vals = valid.map((s) => s.v),
        min = Math.min(...vals),
        max = Math.max(...vals);
      let yMin = 0,
        yMax = 4.0;
      if (max - min <= 1.5) {
        yMin = Math.max(0, min - 0.2);
        yMax = Math.min(4.0, max + 0.2);
      }

      const w = 800,
        h = 250,
        pt = 30,
        pb = 40,
        pl = 50,
        pr = 30;
      const cw = w - pl - pr,
        ch = h - pt - pb,
        yr = yMax - yMin;
      const getX = (i) => pl + i * (cw / (valid.length - 1));
      const getY = (v) => h - pb - ((v - yMin) / (yr || 1)) * ch;

      const pts = valid.map((s, i) => ({
        x: getX(i),
        y: getY(s.v),
        v: s.v.toFixed(2),
        l: s.i,
      }));
      const dLine = pts
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
        .join(" ");
      const dFill = `${dLine} L ${pts[pts.length - 1].x},${h - pb} L ${
        pts[0].x
      },${h - pb} Z`;

      let grid = "";
      for (let i = 0; i <= 5; i++) {
        const v = yMin + i * (yr / 5),
          y = getY(v);
        grid += `<line x1="${pl}" y1="${y}" x2="${
          w - pr
        }" y2="${y}" class="grid-line" stroke-opacity="0.1"/><text x="${
          pl - 10
        }" y="${y + 4}" class="axis-text" text-anchor="end">${v.toFixed(
          1,
        )}</text>`;
      }

      return `
            <div class="dash-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 class="chart-title">Performance Trend</h3>
                    <span style="font-size:13px; color:var(--text-light);">Start: <b>${
                      pts[0].v
                    }</b> &rarr; Current: <b>${pts[pts.length - 1].v}</b></span>
                </div>
                <div class="chart-container">
                    <svg viewBox="0 0 ${w} ${h}" class="chart-svg">
                        ${grid}
                        <path d="${dFill}" class="chart-area"/><path d="${dLine}" class="chart-line" fill="none" stroke-width="3"/>
                        ${pts
                          .map(
                            (p) =>
                              `<g class="chart-point-group"><circle cx="${
                                p.x
                              }" cy="${
                                p.y
                              }" r="6" class="chart-dot"/><rect x="${
                                p.x - 22
                              }" y="${
                                p.y - 38
                              }" width="44" height="24" rx="4" class="tooltip-box"/><text x="${
                                p.x
                              }" y="${
                                p.y - 22
                              }" text-anchor="middle" class="tooltip-text">${
                                p.v
                              }</text><text x="${p.x}" y="${
                                h - 15
                              }" text-anchor="middle" class="axis-text" style="font-weight:bold;">${
                                p.l
                              }</text></g>`,
                          )
                          .join("")}
                    </svg>
                </div>
            </div>`;
    };

    const renderHTML = (semesters) => {
      if (!semesters.length) return `<div class="empty-state">No Data</div>`;
      const getGradeColor = (g) =>
        g.includes("A")
          ? "grade-A"
          : g.includes("B")
            ? "grade-B"
            : g.includes("C")
              ? "grade-C"
              : g.includes("D")
                ? "grade-D"
                : g.includes("S")
                  ? "grade-A" // Use grade-A style for Satisfactory
                  : g.includes("I")
                    ? "grade-B" // Use grade-B style for Incomplete
                    : "grade-F";

      const graphHTML = generateGraphHTML(semesters);

      const toolsHTML = `
                <div class="tools-col">
                    <div class="tool-card" id="btn-open-prereq">
                        <div class="tool-icon-box">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div class="tool-info">
                            <h4>Prereq Check</h4>
                            <p>Visualize course chains.</p>
                        </div>
                    </div>
                    <div class="tool-card" id="btn-open-planner">
                        <div class="tool-icon-box">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        </div>
                        <div class="tool-info">
                            <h4>GPA Planner</h4>
                            <p>Simulate future semesters.</p>
                        </div>
                    </div>
                </div>
            `;

      const topSection = `
                <div class="top-split">
                    <div class="graph-col">${graphHTML}</div>
                    ${toolsHTML}
                </div>
            `;

      // Semester Cards
      const cardsHTML =
        `<div class="transcript-grid">` +
        semesters
          .map(
            (sem) => `
                <div class="dash-card sem-card">
                    <div class="sem-header">
                        <div class="sem-top-row"><h3 class="sem-title">${sem.title}</h3><div class="modern-badge neutral"><span>SGPA:</span> ${sem.sgpa}</div></div>
                        <div class="sem-stats"><div class="stat-item">Credits: <b>${sem.crEarned}</b> / ${sem.crAtt}</div><div class="stat-item">CGPA: <b>${sem.cgpa}</b></div></div>
                    </div>
                    <button class="modern-btn" style="border:none; border-top:1px solid var(--border-color); width:100%; border-radius:0;" data-id="${sem.id}">View Details / Calculate <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></button>
                </div>`,
          )
          .join("") +
        `</div>`;

      //semester popup modals + calculator simulation mode
      const modalsHTML = semesters
        .map(
          (sem) => `
                <div id="modal-${sem.id}" class="modern-modal">
                    <div class="modern-modal-header">
                        <div class="modal-title-group">
                            <h3>${sem.title}</h3>
                            <div class="sim-score-box" id="sim-box-${
                              sem.id
                            }" style="display:none;"><span>Simulated:</span><b id="sim-val-${
                              sem.id
                            }">${sem.sgpa}</b></div>
                            <span class="real-score" id="real-score-${
                              sem.id
                            }">Actual SGPA: <b>${sem.sgpa}</b></span>
                        </div>
                        <div class="modal-actions">
                            <button class="modern-btn small calc-toggle-btn" data-id="${
                              sem.id
                            }"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="18" x2="16" y2="18"/><line x1="8" y1="18" x2="8" y2="18"/><line x1="12" y1="18" x2="12" y2="18"/></svg> Calculator</button>
                            <button class="modern-close-btn" data-close="true">×</button>
                        </div>
                    </div>
                    <div class="modern-modal-body" id="modal-body-${sem.id}">
                        <table class="modern-table">
                            <thead><tr><th>Course</th><th class="text-center">Cr</th><th class="text-center">Grade</th></tr></thead>
                            <tbody>${sem.courses
                              .map(
                                (c) =>
                                  `<tr><td><div style="font-weight:600;">${
                                    c.name
                                  }</div><div style="font-size:11px; color:var(--text-light);">${
                                    c.code
                                  }</div></td><td class="text-center td-credit">${
                                    c.credits
                                  }</td><td class="text-center td-grade"><span class="modern-badge grade-pill static-grade ${getGradeColor(
                                    c.grade,
                                  )}">${
                                    c.grade
                                  }</span><div class="calc-view" style="display:none;"><select class="calc-select">${getGradeOptions(
                                    c.grade,
                                  )}</select></div></td></tr>`,
                              )
                              .join("")}</tbody>
                        </table>
                    </div>
                </div>`,
        )
        .join("");

      const toolModalsHTML = `
                <div id="modal-prereq" class="modern-modal" style="max-width: 850px; width:95%;">
                    <div class="modern-modal-header"><h3>Prerequisite Chain</h3><button class="modern-close-btn" data-close="true">×</button></div>
                    <div class="modern-modal-body" id="prereq-content-area" style="padding:24px;">
                        </div>
                </div>
                <div id="modal-planner" class="modern-modal">
                    <div class="modern-modal-header"><h3>Target GPA Planner</h3><button class="modern-close-btn" data-close="true">×</button></div>
                    <div class="modern-modal-body">
                    </div>
                </div>
                <div id="trans-modal-overlay" class="modern-modal-overlay"></div>
            `;

      return topSection + cardsHTML + modalsHTML + toolModalsHTML;
    };

    //planner system for GPA targets
    const initPlannerSystem = (semesters) => {
      const container = document.querySelector(
        "#modal-planner .modern-modal-body",
      );

      if (!semesters || semesters.length === 0) {
        container.innerHTML = `<div class="empty-state">No transcript data available to plan.</div>`;
        return;
      }

      const completedSemData = semesters.filter((sem) => {
        const hasOngoingGrade = sem.courses.some((c) => c.grade === "I");
        const hasScore = parseFloat(sem.sgpa) > 0;
        return hasScore && !hasOngoingGrade;
      });

      const latestSem = semesters[semesters.length - 1];
      const currentCGPA = parseFloat(latestSem.cgpa) || 0;
      const currentCredits = parseInt(latestSem.crEarned) || 0;

      //idk the logic behind max semesters but ok
      //showing 8 sems for UI, but allowing planning up to 12 sems(like I think max 6 years are allowed)
      const semestersCompleted = completedSemData.length;
      const standardDegreeSems = 8;
      const maxSemesters = 12;

      const remainingForUI = Math.max(
        0,
        standardDegreeSems - semestersCompleted,
      );
      const internalRemaining = Math.max(0, maxSemesters - semestersCompleted);

      container.innerHTML = `
        
            <div class="planner-stats">
                <div>
                    <span>Current CGPA</span>
                    <b class="text-accent">${currentCGPA.toFixed(2)}</b>
                </div>
                <div>
                    <span>Completed</span>
                    <b>${semestersCompleted} <small>/ ${standardDegreeSems}</small></b>
                </div>
                <div>
                    <span>Remaining</span>
                    <b>${remainingForUI}</b>
                </div>
            </div>

            <div class="prereq-controls" style="margin-bottom:20px;">
                <div class="control-group" style="flex:1;">
                    <label>Target CGPA</label>
                    <input type="number" id="target-cgpa" class="modern-input" step="0.01" min="0" max="4.0" value="${(currentCGPA + 0.1 > 4.0 ? 4.0 : currentCGPA + 0.1).toFixed(2)}">
                </div>
                <div class="control-group" style="flex:1;">
                    <label>Achieve in (Semesters)</label>
                    <select id="target-duration" class="modern-select">
                        ${Array.from(
                          { length: internalRemaining },
                          (_, i) => i + 1,
                        )
                          .map(
                            (n) =>
                              `<option value="${n}" ${n === remainingForUI ? "selected" : ""}>${n} Semester${n > 1 ? "s" : ""}</option>`,
                          )
                          .join("")}
                    </select>
                </div>
            </div>

            <button id="btn-calc-plan" class="modern-btn" style="margin-bottom:20px;">
                Calculate Plan
            </button>

            <div id="planner-result" style="display:none; animation: fadeIn 0.3s ease;">
                <div id="planner-text" style="margin-bottom:20px; padding:15px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; color:var(--text-main); line-height:1.5;"></div>
                <div id="planner-graph-container"></div>
            </div>
       
    `;

      //binding
      document.getElementById("btn-calc-plan").addEventListener("click", () => {
        const target = parseFloat(document.getElementById("target-cgpa").value);
        const duration = parseInt(
          document.getElementById("target-duration").value,
        );
        const avgCr = 16;

        if (isNaN(target) || target > 4.0 || target < 0) {
          alert("Please enter a valid CGPA (0.0 - 4.0)");
          return;
        }

        const futureCredits = duration * avgCr;
        const totalCredits = currentCredits + futureCredits;
        const currentPoints = currentCGPA * currentCredits;
        const targetPoints = target * totalCredits;

        const requiredPoints = targetPoints - currentPoints;
        const requiredSGPA = requiredPoints / futureCredits;

        const resultBox = document.getElementById("planner-result");
        const textBox = document.getElementById("planner-text");
        const graphBox = document.getElementById("planner-graph-container");

        resultBox.style.display = "block";
        let html = "";
        let impossible = false;

        if (requiredSGPA > 4.0) {
          impossible = true;
          html = `
                <div style="color:var(--danger-text); font-weight:bold;">Goal Unreachable</div>
                To reach <b>${target.toFixed(2)}</b>, you would need an average SGPA of <b style="font-size:18px;">${requiredSGPA.toFixed(2)}</b> over the next ${duration} semester(s). 
                <br><span style="font-size:12px; opacity:0.8;">(Maximum possible is 4.00)</span>
            `;
        } else if (requiredSGPA <= currentCGPA && target <= currentCGPA) {
          html = `
                <div style="color:var(--success-text); font-weight:bold;">Goal Already Met</div>
                Your current CGPA is already <b>${currentCGPA}</b>. You just need to maintain your current performance.
            `;
        } else {
          html = `
                <div style="color:var(--accent-blue); font-weight:bold; margin-bottom:5px;">Strategy</div>
                To reach a CGPA of <b>${target.toFixed(2)}</b>, you need an average SGPA of <b style="color:var(--accent-blue); font-size:18px;">${Math.max(0, requiredSGPA).toFixed(2)}</b> over the next ${duration} semester(s).
                <br><span style="font-size:11px; color:var(--text-muted);">(Calculated based on ~16 credits per semester)</span>
            `;
        }
        textBox.innerHTML = html;

        if (!impossible) {
          const futureSems = [];
          for (let i = 1; i <= duration; i++) {
            futureSems.push({
              title: `Future Sem ${i}`,
              sgpa: Math.max(0, requiredSGPA).toFixed(2),
            });
          }
          graphBox.innerHTML = generateGraphHTML([...semesters, ...futureSems]);
        } else {
          graphBox.innerHTML = "";
        }
      });
    };

    //==========
    //execution
    waitForContent()
      .then((isReady) => {
        if (!isReady) return;
        const semesters = scrapeTranscript();
        const latestCGPA = semesters.length
          ? semesters[semesters.length - 1].cgpa
          : "-";
        window.FlexUtils.renderInternalPage(
          renderHTML(semesters),
          `Transcript <span style="font-size:14px; font-weight:400; color:var(--text-muted); margin-left:10px;">CGPA: ${latestCGPA}</span>`,
        );

        const overlay = document.getElementById("trans-modal-overlay");
        const openModal = (id) => {
          document.getElementById(id)?.classList.add("active");
          overlay?.classList.add("active");
        };
        const closeAll = () => {
          overlay?.classList.remove("active");
          document
            .querySelectorAll(".modern-modal")
            .forEach((m) => m.classList.remove("active"));
        };

        document
          .querySelectorAll(".modern-btn")
          .forEach((b) =>
            b.addEventListener("click", (e) =>
              openModal(`modal-${e.target.closest("button").dataset.id}`),
            ),
          );

        document.querySelectorAll(".calc-toggle-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const modalBody = document.getElementById(`modal-body-${id}`);
            const simBox = document.getElementById(`sim-box-${id}`);
            const realScore = document.getElementById(`real-score-${id}`);

            const isActive = btn.classList.toggle("active-calc");

            modalBody.querySelectorAll("tr").forEach((row) => {
              const staticPill = row.querySelector(".static-grade");
              const calcView = row.querySelector(".calc-view");
              if (staticPill && calcView) {
                staticPill.style.display = isActive ? "none" : "";
                calcView.style.display = isActive ? "block" : "none";
              }
            });

            if (simBox) simBox.style.display = isActive ? "flex" : "none";
            if (realScore)
              realScore.style.display = isActive ? "none" : "block";

            if (isActive) {
              const selects = modalBody.querySelectorAll(".calc-select");
              const updateCalc = () => {
                const val = calculateSGPA(modalBody);
                const display = document.getElementById(`sim-val-${id}`);
                if (display) display.innerText = val;
              };

              selects.forEach((s) => (s.onchange = updateCalc));

              updateCalc();
            }
          });
        });

        document
          .getElementById("btn-open-prereq")
          ?.addEventListener("click", () => {
            openModal("modal-prereq");
            initPrereqSystem();
          });

        document
          .getElementById("btn-open-planner")
          ?.addEventListener("click", () => {
            openModal("modal-planner");
            initPlannerSystem(semesters);
          });

        document
          .querySelectorAll(".modern-close-btn")
          .forEach((b) => b.addEventListener("click", closeAll));
        overlay?.addEventListener("click", closeAll);
      })
      .catch((e) => {
        console.error("Transcript Error:", e);
        document.body.classList.remove("modern-active");
      });
  } catch (e) {
    console.error("Transcript Page Error: ", e);
    document.body.classList.remove("modern-active");
  }
})();
