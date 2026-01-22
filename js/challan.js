(function initChallan() {
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.includes("challan")) {
    console.log("not a challan page, exiting. Path was:", currentPath);
    return;
  }

  try {
    console.log("fee challan script loaded");

    const originalTable = document.querySelector(".m-section__content table table",);
    if (!originalTable) {
      console.warn("Challan table not found");
      return;
    }

    const rows = [];
    originalTable.querySelectorAll("tbody tr").forEach((row) => {
      const cells = row.cells;
      if (cells.length >= 6) {
        const onclickStr =
          cells[5].querySelector("a")?.getAttribute("onclick") || "";
        const idMatch = onclickStr.match(/\d+/);
        const challanId = idMatch ? idMatch[0] : null;

        if (challanId) {
          rows.push({
            amount: cells[1].innerText.trim(),
            generated: cells[2].innerText.trim(),
            due: cells[3].innerText.trim(),
            status: cells[4].innerText.trim(),
            challanId: challanId,
          });
        }
      }
    });

    const instructionsRaw =
      document.querySelector('td[style*="width:40%"]')?.innerHTML ||
      "No instructions available.";

    const finalHTML = `
            <div class="dashboard-wrapper challan-view">
                <div class="dash-card no-hover challan-main-card">
                    <div class="challan-card-header">
                        <div class="header-left">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2"/></svg>
                            <h3 class="card-heading">Student Challans</h3>
                        </div>
                        <button id="btnToggleInstructions" class="instr-toggle-btn">
                            📘 <span class="btn-text">Payment Instructions</span>
                        </button>
                    </div>
                    
                    <div class="table-modern-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Generated</th>
                                    <th>Due Date</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows
                                  .map(
                                    (r) => `
                                    <tr>
                                        <td class="amount-cell">${r.amount}</td>
                                        <td><span class="status-badge valid">${r.status}</span></td>
                                        <td class="text-muted">${r.generated}</td>
                                        <td class="text-danger font-weight-bold">${r.due}</td>
                                        <td class="text-right">
                                            <div class="btn-group-modern">
                                                <button class="btn-view action-trigger" data-id="${r.challanId}" data-type="view">View</button>
                                                <button class="btn-print action-trigger" data-id="${r.challanId}" data-type="print">Print</button>
                                            </div>
                                        </td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="instructionDrawer" class="outer-drawer">
                    <div class="drawer-content">
                        <div class="drawer-header-title">Payment Guidelines</div>
                        <div class="instructions-content legacy-theme-fix">
                            ${instructionsRaw}
                        </div>
                    </div>
                </div>
            </div>
        `;

    window.FlexUtils.renderInternalPage(finalHTML, "Challan");

    const toggleBtn = document.getElementById("btnToggleInstructions");
    const drawer = document.getElementById("instructionDrawer");

    toggleBtn?.addEventListener("click", () => {
      const isOpen = drawer.classList.toggle("is-open");
      toggleBtn.classList.toggle("active", isOpen);
      toggleBtn.querySelector(".btn-text").innerText = isOpen
        ? "Hide Instructions"
        : "Payment Instructions";
    });

    document.querySelectorAll(".action-trigger").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        const type = this.getAttribute("data-type");

        if (type === "print") {
          if (typeof window.ftn_PrintChallanForm === "function") {
            window.ftn_PrintChallanForm(id);
          } else {
            document
              .querySelector(`#btnPrintChallan[onclick*="${id}"]`)
              ?.click();
          }
        } else {
          if (typeof window.fn_StdFeeDetail === "function") {
            window.fn_StdFeeDetail(id);
          }
          window.$("#ChallanDetail").modal("show");
        }
      });
    });
  } catch (e) {
    console.error("FlexRedesign: Challan Error", e);
    document.body.classList.remove("modern-active");
  }
})();
