
(function initFeedback() {
    const currentPath = window.location.pathname.toLowerCase();
    if (!currentPath.includes('feedback')) {
        console.log("not a feedback page, exiting. Path was:", currentPath);
        return;
    }

    console.log("feedback script loaded");//only for debug

    const runModule = () => {
        try {
            
            const isQuestionsPage = currentPath.includes('feedbackquestions');
            
            
            const targetTable = document.querySelector('table');
            const alertEl = document.querySelector('.m-alert, .alert');

            if (!targetTable && !alertEl) {
                console.log("FlexRedesign: Table/Alert not found yet, retrying...");
                setTimeout(runModule, 200);
                return;
            }

            
            const alertMessage = alertEl ? alertEl.innerText.replace('Close', '').trim() : null;
            const courses = [];
            
            document.querySelectorAll('table tbody tr').forEach(row => {
                if (row.cells.length >= 5) {
                    const code = row.cells[1].innerText.trim();
                    if (code !== "") {
                        courses.push({
                            code: code,
                            name: row.cells[2].innerText.trim(),
                            credits: row.cells[3].innerText.trim(),
                            status: row.cells[4].innerText.trim(),
                            originalAction: row.cells[5].innerHTML
                        });
                    }
                }
            });

            
            const alertHTML = alertMessage ? `
                <div class="dash-card alert-card">
                    <div class="alert-content">
                        <div class="alert-icon">⚠️</div>
                        <div class="alert-text">${alertMessage}</div>
                    </div>
                </div>` : '';

            const tableRows = courses.map(c => `
                <tr>
                    <td class="course-code-cell">${c.code}</td>
                    <td>
                        <div class="name-main">${c.name}</div>
                        <div class="name-sub">${c.credits} Credits</div>
                    </td>
                    <td>
                        <span class="status-badge ${c.status.toLowerCase().includes('not') ? 'pending' : 'submitted'}">
                            ${c.status}
                        </span>
                    </td>
                    <td class="text-right">${c.originalAction || '—'}</td>
                </tr>`).join('');

            const finalHTML = `
                <div class="dashboard-wrapper feedback-view">
                    ${alertHTML}
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

            
            if (window.FlexUtils) {
                window.FlexUtils.renderInternalPage(finalHTML, "Course Feedback");
            } else {
                console.error("FlexRedesign: FlexUtils not found! Ensure utils.js is loaded.");
            }

        } catch (e) {
            console.error("FlexRedesign Error:", e);
        }
    };

    if (document.readyState === 'complete') {
        runModule();
    } else {
        window.addEventListener('load', runModule);
    }

})();