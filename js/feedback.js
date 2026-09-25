(function initFeedback() {
  const currentPath = window.location.pathname.toLowerCase();
  const isQuestionsPage = currentPath.includes("feedbackquestions");
  const isListPage = currentPath.includes("coursefeedback");

  if (!isQuestionsPage && !isListPage) {
    console.log("not a feedback page, exiting. Path was:", currentPath);
    return;
  }

  console.log("feedback script loaded"); //only for debug

  //==================
  //helpers
  //innerText is empty once the legacy grid is hidden, so scrape with textContent
  const clean = (t) => (t ? String(t).replace(/\s+/g, " ").trim() : "");
  const esc = window.FlexUtils.escapeHTML;

  //==================
  //LIST PAGE (/Student/CourseFeedback)
  //==================
  const runListModule = () => {
    try {
      const targetTable = document.querySelector("table");
      const alertEl = document.querySelector(".m-alert, .alert");

      if (!targetTable && !alertEl) {
        console.log("FlexRedesign: Table/Alert not found yet, retrying...");
        setTimeout(runListModule, 200);
        return;
      }

      const alertMessage = alertEl
        ? clean(alertEl.textContent).replace("Close", "").trim()
        : null;

      //the legacy <form> is parsed as empty (a <form> inside <tbody> gets closed
      //immediately), so the "Give Feedback" buttons are only tied to it through the
      //parser's form-owner pointer. Cloning their HTML into our UI drops that owner
      //and the button silently does nothing - so we keep a handle on the originals
      //and proxy-click them instead.
      const originalButtons = [];
      const courses = [];

      document.querySelectorAll("table tbody tr").forEach((row) => {
        if (row.cells.length < 5) return;

        const code = clean(row.cells[1].textContent);
        if (!code) return;

        const actionCell = row.cells[5];
        const originalBtn =
          actionCell?.querySelector('button[name="GiveFeedback"]') ||
          actionCell?.querySelector("button, input[type='submit']");

        let btnIndex = -1;
        if (originalBtn) {
          btnIndex = originalButtons.length;
          originalButtons.push(originalBtn);
        }

        courses.push({
          code,
          name: clean(row.cells[2].textContent),
          credits: clean(row.cells[3].textContent),
          status: clean(row.cells[4].textContent),
          btnIndex,
          btnLabel: clean(originalBtn?.textContent) || "Give Feedback",
        });
      });

      const alertHTML = alertMessage
        ? `<div class="dash-card alert-card fb-alert-card">
                        <div class="alert-content">
                            <div class="alert-icon">⚠️</div>
                            <div class="alert-text">${esc(alertMessage)}</div>
                        </div>
                    </div>`
        : "";

      const pending = courses.filter((c) =>
        c.status.toLowerCase().includes("not"),
      ).length;

      const summaryHTML = courses.length
        ? `<div class="fb-summary">
                        <div class="fb-summary-item">
                            <div class="fb-summary-val">${courses.length}</div>
                            <div class="fb-summary-lbl">Courses</div>
                        </div>
                        <div class="fb-summary-item">
                            <div class="fb-summary-val text-pending">${pending}</div>
                            <div class="fb-summary-lbl">Pending</div>
                        </div>
                        <div class="fb-summary-item">
                            <div class="fb-summary-val text-done">${courses.length - pending}</div>
                            <div class="fb-summary-lbl">Submitted</div>
                        </div>
                    </div>`
        : "";

      const tableRows = courses
        .map((c) => {
          const isPending = c.status.toLowerCase().includes("not");
          const action =
            c.btnIndex >= 0
              ? `<button class="modern-btn modern-btn-primary modern-btn-sm fb-trigger" data-btn-index="${c.btnIndex}">${esc(c.btnLabel)}</button>`
              : `<span class="fb-no-action">&mdash;</span>`;

          return `
                    <tr>
                        <td class="course-code-cell">${esc(c.code)}</td>
                        <td>
                            <div class="name-main">${esc(c.name)}</div>
                            <div class="name-sub">${esc(c.credits)} Credits</div>
                        </td>
                        <td>
                            <span class="status-badge ${isPending ? "pending" : "submitted"}">
                                ${esc(c.status)}
                            </span>
                        </td>
                        <td class="text-right">${action}</td>
                    </tr>`;
        })
        .join("");

      const finalHTML = `
                <div class="dashboard-wrapper feedback-view">
                    ${alertHTML}
                    ${summaryHTML}
                    <div class="dash-card no-hover feedback-main-card">
                        <div class="dash-card-title">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Feedback Status
                        </div>
                        <div class="table-modern-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Course Details</th>
                                        <th>Status</th>
                                        <th class="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows || '<tr><td colspan="4" class="text-center py-5">No courses found.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>`;

      window.FlexUtils.renderInternalPage(finalHTML, "Course Feedback");

      //proxy the click onto the original (still form-owned) button
      document.querySelectorAll(".fb-trigger").forEach((btn) => {
        btn.addEventListener("click", () => {
          const original = originalButtons[Number(btn.dataset.btnIndex)];
          if (!original) return;

          btn.disabled = true;
          btn.innerText = "Opening...";
          original.click();
        });
      });
    } catch (e) {
      console.error("FlexRedesign Error:", e);
      document.body.classList.remove("modern-active");
    }
  };

  //==================
  //QUESTIONS PAGE (/Student/FeedBackQuestions)
  //==================
  const runQuestionsModule = () => {
    try {
      const legacyForm = document.querySelector(
        'form[action*="SubmitFeedback"]',
      );
      const items = document.querySelectorAll(".m-list-timeline__item");

      if (!legacyForm || items.length === 0) {
        console.log("FlexRedesign: feedback questions not ready, retrying...");
        setTimeout(runQuestionsModule, 200);
        return;
      }

      //course title lives in the portlet head: "Feedback Questions (EE3009-Computer Architecture)"
      const headText = clean(
        document.querySelector(".m-portlet__head-text")?.textContent,
      );
      const courseTitle = headText.match(/\((.+)\)/)?.[1] || headText;

      const originalSubmit =
        legacyForm.querySelector("#submit") ||
        legacyForm.querySelector('button[type="submit"]');

      //scrape questions in document order
      const radioQuestions = []; //{ text, options: [{ label, input }] }
      const textQuestions = []; //{ text, textarea }
      const order = []; //render order: { type, index }

      items.forEach((item) => {
        const radios = item.querySelectorAll('input[type="radio"]');
        const textarea = item.querySelector('textarea[name="FB_Text"]');
        const text = clean(item.querySelector(".m-list-timeline__text")?.textContent);

        if (radios.length > 0) {
          const options = Array.from(radios).map((input) => ({
            label:
              clean(input.closest("label")?.textContent) ||
              clean(input.value),
            input,
          }));
          order.push({ type: "radio", index: radioQuestions.length });
          radioQuestions.push({ text, options });
        } else if (textarea) {
          order.push({ type: "text", index: textQuestions.length });
          textQuestions.push({ text, textarea });
        }
      });

      if (radioQuestions.length === 0 && textQuestions.length === 0) {
        console.log("FlexRedesign: no feedback questions found");
        return;
      }

      const total = radioQuestions.length;

      //the answer scale is identical for every question, so take it from the first one
      const scale = radioQuestions[0]?.options.map((o) => o.label) || [];

      //==================
      //html
      const scaleChips = scale
        .map(
          (label, i) =>
            `<button type="button" class="fb-chip" data-scale="${i}">${esc(label)}</button>`,
        )
        .join("");

      const autofillHTML = scale.length
        ? `<div class="dash-card no-hover fb-autofill-card">
                        <div class="dash-card-title">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Quick Fill
                        </div>
                        <p class="fb-hint">Pick the answer you want, then apply it to every question. You can still change any answer individually before you submit.</p>
                        <div class="fb-chips">${scaleChips}</div>
                        <div class="fb-autofill-actions">
                            <button type="button" id="fb-fill-all" class="modern-btn modern-btn-primary" disabled>Fill all questions</button>
                            <button type="button" id="fb-fill-empty" class="modern-btn modern-btn-outline" disabled>Fill unanswered only</button>
                            <button type="button" id="fb-clear" class="modern-btn modern-btn-ghost">Clear all</button>
                        </div>
                    </div>`
        : "";

      let counter = 0;
      const questionsHTML = order
        .map(({ type, index }) => {
          counter++;

          if (type === "radio") {
            const q = radioQuestions[index];
            const opts = q.options
              .map(
                (o, oi) =>
                  `<button type="button" class="fb-opt" data-q="${index}" data-o="${oi}">${esc(o.label)}</button>`,
              )
              .join("");

            return `
                        <div class="dash-card no-hover fb-q-card" id="fb-q-${index}" data-q-card="${index}">
                            <div class="fb-q-head">
                                <span class="fb-q-num">${counter}</span>
                                <div class="fb-q-text">${esc(q.text)}</div>
                            </div>
                            <div class="fb-options" role="radiogroup" aria-label="${esc(q.text)}">${opts}</div>
                        </div>`;
          }

          const q = textQuestions[index];
          return `
                    <div class="dash-card no-hover fb-q-card fb-text-card">
                        <div class="fb-q-head">
                            <span class="fb-q-num optional">${counter}</span>
                            <div class="fb-q-text">
                                ${esc(q.text)}
                                <span class="fb-optional-tag">Optional</span>
                            </div>
                        </div>
                        <textarea class="fb-textarea" data-t="${index}" rows="4" placeholder="Write your comments here..."></textarea>
                    </div>`;
        })
        .join("");

      const finalHTML = `
                <div class="dashboard-wrapper feedback-view fb-questions-view">
                    <div class="dash-card no-hover fb-course-card">
                        <div class="fb-course-meta">Giving feedback for</div>
                        <div class="fb-course-name">${esc(courseTitle)}</div>
                    </div>
                    ${autofillHTML}
                    <div class="fb-questions-list">${questionsHTML}</div>
                    <div class="fb-submit-bar">
                        <div class="fb-progress">
                            <div class="fb-progress-label">
                                <span id="fb-count">0</span> of ${total} answered
                            </div>
                            <div class="fb-progress-track">
                                <div class="fb-progress-fill" id="fb-progress-fill"></div>
                            </div>
                        </div>
                        <button type="button" id="fb-submit" class="modern-btn modern-btn-primary fb-submit-btn">Submit Feedback</button>
                    </div>

                    <div id="fb-modal-overlay" class="modal-overlay"></div>
                    <div id="fb-confirm-modal" class="modern-modal">
                        <div class="modern-modal-header">
                            <h3>Submit feedback?</h3>
                            <button class="modern-close-btn" data-fb-close="true">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p class="fb-confirm-text">
                                Your feedback for <strong>${esc(courseTitle)}</strong> will be submitted to Flex.
                                This cannot be undone or edited afterwards.
                            </p>
                            <div class="fb-confirm-actions">
                                <button type="button" class="modern-btn modern-btn-outline" data-fb-close="true">Go back</button>
                                <button type="button" id="fb-confirm-submit" class="modern-btn modern-btn-primary">Yes, submit</button>
                            </div>
                        </div>
                    </div>
                </div>`;

      window.FlexUtils.renderInternalPage(finalHTML, "Course Feedback");

      //==================
      //state sync - our UI only mirrors values onto the original inputs,
      //the legacy form is what actually gets submitted
      const countEl = document.getElementById("fb-count");
      const fillEl = document.getElementById("fb-progress-fill");
      const submitBtn = document.getElementById("fb-submit");
      const barEl = document.querySelector(".fb-submit-bar");

      const answeredCount = () =>
        radioQuestions.filter((q) => q.options.some((o) => o.input.checked))
          .length;

      const refreshProgress = () => {
        const done = answeredCount();
        const pct = total ? (done / total) * 100 : 100;

        if (countEl) countEl.innerText = String(done);
        if (fillEl) fillEl.style.width = `${pct}%`;
        barEl?.classList.toggle("complete", done === total);
        if (submitBtn) submitBtn.innerText =
          done === total
            ? "Submit Feedback"
            : `Submit Feedback (${total - done} left)`;
      };

      const selectOption = (qIndex, oIndex) => {
        const q = radioQuestions[qIndex];
        if (!q) return;

        const option = q.options[oIndex];
        if (!option) return;

        option.input.checked = true;
        option.input.dispatchEvent(new Event("change", { bubbles: true }));

        const card = document.querySelector(`[data-q-card="${qIndex}"]`);
        card?.classList.remove("unanswered");
        card?.querySelectorAll(".fb-opt").forEach((b) => {
          b.classList.toggle("selected", Number(b.dataset.o) === oIndex);
        });
      };

      const clearOption = (qIndex) => {
        const q = radioQuestions[qIndex];
        if (!q) return;

        q.options.forEach((o) => (o.input.checked = false));
        document
          .querySelector(`[data-q-card="${qIndex}"]`)
          ?.querySelectorAll(".fb-opt")
          .forEach((b) => b.classList.remove("selected"));
      };

      //reflect anything the legacy page already had selected
      radioQuestions.forEach((q, qi) => {
        const checkedIndex = q.options.findIndex((o) => o.input.checked);
        if (checkedIndex >= 0) selectOption(qi, checkedIndex);
      });
      textQuestions.forEach((q, ti) => {
        const box = document.querySelector(`.fb-textarea[data-t="${ti}"]`);
        if (box && q.textarea.value) box.value = q.textarea.value;
      });
      refreshProgress();

      //==================
      //events
      document.querySelectorAll(".fb-opt").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectOption(Number(btn.dataset.q), Number(btn.dataset.o));
          refreshProgress();
        });
      });

      document.querySelectorAll(".fb-textarea").forEach((box) => {
        box.addEventListener("input", () => {
          const q = textQuestions[Number(box.dataset.t)];
          if (q) q.textarea.value = box.value;
        });
      });

      //quick fill
      let chosenScale = null;
      const fillAllBtn = document.getElementById("fb-fill-all");
      const fillEmptyBtn = document.getElementById("fb-fill-empty");

      document.querySelectorAll(".fb-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          chosenScale = Number(chip.dataset.scale);
          document
            .querySelectorAll(".fb-chip")
            .forEach((c) => c.classList.toggle("selected", c === chip));
          if (fillAllBtn) fillAllBtn.disabled = false;
          if (fillEmptyBtn) fillEmptyBtn.disabled = false;
        });
      });

      //match by label so a question with a differently ordered scale still lines up
      const optionIndexFor = (q, scaleIndex) => {
        const wanted = scale[scaleIndex];
        const byLabel = q.options.findIndex((o) => o.label === wanted);
        return byLabel >= 0 ? byLabel : scaleIndex;
      };

      const applyFill = (onlyEmpty) => {
        if (chosenScale === null) return;

        radioQuestions.forEach((q, qi) => {
          if (onlyEmpty && q.options.some((o) => o.input.checked)) return;
          selectOption(qi, optionIndexFor(q, chosenScale));
        });
        refreshProgress();
      };

      fillAllBtn?.addEventListener("click", () => applyFill(false));
      fillEmptyBtn?.addEventListener("click", () => applyFill(true));

      document.getElementById("fb-clear")?.addEventListener("click", () => {
        radioQuestions.forEach((_, qi) => clearOption(qi));
        refreshProgress();
      });

      //==================
      //submit
      const overlay = document.getElementById("fb-modal-overlay");
      const modal = document.getElementById("fb-confirm-modal");

      const closeModal = () => {
        overlay?.classList.remove("active");
        modal?.classList.remove("active");
      };

      document
        .querySelectorAll("[data-fb-close]")
        .forEach((b) => b.addEventListener("click", closeModal));
      overlay?.addEventListener("click", closeModal);

      submitBtn?.addEventListener("click", () => {
        //every radio is `required`, and the legacy form is display:none while our UI is
        //up - an unanswered required control would make the browser block the submit
        //with no visible message, so we gate on completeness ourselves.
        const firstMissing = radioQuestions.findIndex(
          (q) => !q.options.some((o) => o.input.checked),
        );

        if (firstMissing >= 0) {
          radioQuestions.forEach((q, qi) => {
            const card = document.querySelector(`[data-q-card="${qi}"]`);
            card?.classList.toggle(
              "unanswered",
              !q.options.some((o) => o.input.checked),
            );
          });

          document.getElementById(`fb-q-${firstMissing}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return;
        }

        overlay?.classList.add("active");
        modal?.classList.add("active");
      });

      document
        .getElementById("fb-confirm-submit")
        ?.addEventListener("click", () => {
          closeModal();
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Submitting...";
          }

          //hand off to the legacy form - it carries FB_text_offer and the
          //FB_text_Question_Id / FB_Text pairs in the order the server expects
          if (originalSubmit) originalSubmit.click();
          else legacyForm.submit();
        });
    } catch (e) {
      console.error("FlexRedesign: Feedback Questions Error", e);
      document.body.classList.remove("modern-active");
    }
  };

  //==================
  const start = () => (isQuestionsPage ? runQuestionsModule() : runListModule());

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
