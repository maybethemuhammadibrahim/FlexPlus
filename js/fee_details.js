(function initFeeDetails() {
    const path = window.location.pathname;
    if (!path.includes('StudentLedger') && !path.includes('FeeDetails') && !path.includes('ConsolidatedFeeReport')) return;

    
    const calculateStats = () => {
        let totalPaid = 0;
        let totalCourses = 0;
        let repeatedCredits = 0;
        const courseCounts = {};
        const allCourses = [];

        // 1. Sum up all payments
        document.querySelectorAll('#sample_CollectionDetail tbody tr').forEach(row => {
            const status = row.cells[9]?.innerText.toLowerCase() || '';
            if (status.includes('posted') || status.includes('paid')) {
                const amount = parseFloat(row.cells[5]?.innerText.replace(/,/g, '') || '0');
                totalPaid += amount;
            }
        });

        // 2. Count Courses & Check Repeats
        document.querySelectorAll('[id^="tblRegisteredCoursesDetail_"] tbody tr').forEach(row => {
            const titleFull = row.cells[1]?.innerText.trim() || '';
            const status = row.cells[3]?.innerText.toLowerCase() || '';

            if (status.includes('registered') || status.includes('approved')) {
                const parts = titleFull.split('-');
                if (parts.length >= 2) {
                    const code = parts[0].trim();
                    const credits = parseInt(parts[parts.length - 1]) || 3;
                    
                    allCourses.push({ code, credits });
                    courseCounts[code] = (courseCounts[code] || 0) + 1;
                    totalCourses++;
                }
            }
        });

        // 3. Calculate Repeat Cost
        Object.entries(courseCounts).forEach(([code, count]) => {
            if (count > 1) {
                const course = allCourses.find(c => c.code === code);
                repeatedCredits += (count - 1) * (course ? course.credits : 3);
            }
        });

        return {
            totalPaid,
            totalCourses,
            repeatedCount: Object.values(courseCounts).filter(c => c > 1).length,
            extraCost: repeatedCredits * 11000
        };
    };

    
    const parseSemesterDetails = (htmlContent, index) => {
        const temp = document.createElement('div');
        temp.innerHTML = htmlContent;

        // 1. Get Basic Stats
        const getTxt = (id) => temp.querySelector(`#${id}_${index}`)?.innerText.trim() || '0';
        const sgpa = getTxt('lbSGPA') || '-';
        const cgpa = getTxt('lbCGPA') || '-';

        // 2. Parse Courses
        const courses = [];
        temp.querySelectorAll(`#tblRegisteredCoursesDetail_${index} tbody tr`).forEach(row => {
            const cells = row.cells;
            if (cells && cells.length >= 5) {
                courses.push({
                    title: cells[1].innerText.trim(), // Title-Credits
                    type: cells[2].innerText.trim(),  // Regular/Repeater
                    status: cells[3].innerText.trim(), // Registered
                    date: cells[4].innerText.trim()    // Action Date
                });
            }
        });

        // 3. Parse Financial Breakdown (Combine Due, Discount, and Sponsored lists)
        const breakdown = [];
        
        // Helper to extract LI text: "Tuition Fee: 10,000"
        const extractListItems = (listId, type) => {
            temp.querySelectorAll(`#${listId}_${index} li`).forEach(li => {
                // Original code creates: <li>Title:<b>Amount</b></li>
                // We grab raw text and split by ':'
                const rawText = li.innerText.replace(/\s+/g, ' ').trim(); 
                const parts = rawText.split(':');
                if (parts.length > 1) {
                    breakdown.push({ 
                        label: parts[0].trim(), 
                        amount: parts[1].trim(),
                        type: type // 'due', 'discount', or 'sponsor'
                    });
                }
            });
        };

        extractListItems('tblDueInSem', 'due');
        extractListItems('tblDiscount', 'discount');
        extractListItems('tblSponsored', 'sponsor');

        return {
            sgpa, 
            cgpa, 
            courses, 
            financials: {
                arrears: getTxt('lbArrears'),
                dueTotal: getTxt('lbDueInSem'),
                discount: getTxt('lbDiscount'),
                sponsored: getTxt('lbSponsored'),
                collection: getTxt('lbCollection'),
                balance: getTxt('lbBalance'),
                breakdown
            }
        };
    };

    const attachCardListeners = () => {
        document.querySelectorAll('.semester-fee-card').forEach(card => {
            // Remove old listeners to prevent duplicates if function runs twice
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            newCard.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const title = this.getAttribute('data-title');
                
                // 1. Trigger Original Site's Logic
                const originalBtn = document.getElementById(`BtnhideshowInternal${index}`);
                if (originalBtn) originalBtn.click();

                // 2. Wait for AJAX Data
                const sourceId = `rowStdDetail_${index}`;
                let attempts = 0;
                
                // Add loading cursor
                document.body.style.cursor = 'wait';

                const poller = setInterval(() => {
                    attempts++;
                    const sourceDiv = document.getElementById(sourceId);
                    
                    // CRITICAL FIX: Don't just check if div exists.
                    // Check if the SGPA label has text inside it (indicating AJAX finished)
                    const sgpaLabel = sourceDiv?.querySelector(`#lbSGPA_${index}`);
                    const hasData = sgpaLabel && sgpaLabel.innerText.trim().length > 0;

                    if (hasData || attempts > 50) { // 50 attempts * 100ms = 5 seconds max wait
                        clearInterval(poller);
                        document.body.style.cursor = 'default';
                        
                        if (hasData) {
                            const parsedData = parseSemesterDetails(sourceDiv.innerHTML, index);
                            showModernModal(title, parsedData);
                        } else {
                            console.error("FlexRedesign: Timeout waiting for fee data.");
                        }
                    }
                }, 100); // Check every 100ms
            });
        });
    };

    
    const runModule = () => {
        try {
            // 1. Check if data is ready
            const mainTable = document.querySelector('#sample_CollectionDetail tbody');
            if (!mainTable || mainTable.children.length === 0) return false; // Not ready yet

            console.log("fee details script running");

            // 2. Expand all hidden sections momentarily to scrape data
            document.querySelectorAll('[id^="BtnhideshowInternal"]').forEach(btn => {
                if (btn.getAttribute('onclick')) btn.click();
            });

            // 3. Process Data (with small delay to let expansion happen)
            setTimeout(() => {
                const stats = calculateStats();
                const formatCurrency = (num) => "Rs. " + num.toLocaleString();

                const semesters = [];
                document.querySelectorAll('[id^="rowStdDetailHeader_"]').forEach(header => {
                    const index = header.id.split('_')[1];
                    const amounts = Array.from(header.querySelectorAll('p.text-center')).map(p => p.innerText.trim());
                    
                    semesters.push({
                        index,
                        title: header.querySelector('label')?.innerText || `Semester ${index}`,
                        due: amounts[1] || '0',
                        paid: amounts[4] || '0',
                        balance: amounts[5] || '0'
                    });
                });

                // 4. Build HTML
                const statsHTML = `
                    <div class="stats-row">
                        <div class="dash-card stat-card primary">
                            <div class="stat-icon-bg"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2"/></svg></div>
                            <div class="stat-label">Total Fees Paid</div>
                            <div class="stat-value">${formatCurrency(stats.totalPaid)}</div>
                            <div class="stat-sub">Lifetime payments</div>
                        </div>
                        <div class="dash-card stat-card">
                            <div class="stat-icon-bg"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke-width="2"/></svg></div>
                            <div class="stat-label">Paid Courses</div>
                            <div class="stat-value">${stats.totalCourses}</div>
                            <div class="stat-sub">Registered courses</div>
                        </div>
                        <div class="dash-card stat-card warning">
                            <div class="stat-icon-bg"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke-width="2"/></svg></div>
                            <div class="stat-label">Extra Costs</div>
                            <div class="stat-value text-danger">${stats.repeatedCount > 0 ? formatCurrency(stats.extraCost) : 'Rs. 0'}</div>
                            <div class="stat-sub">${stats.repeatedCount} repeated courses</div>
                        </div>
                    </div>`;

                const semesterCards = semesters.map(sem => `
                    <div class="dash-card semester-fee-card" data-index="${sem.index}" data-title="${sem.title}">
                        <div class="sem-card-header">
                            <div class="sem-identity">
                                <div class="sem-icon">${sem.title.substring(0, 3)}</div>
                                <h3 class="sem-title">${sem.title}</h3>
                            </div>
                            <div class="sem-status ${parseInt(sem.balance) > 0 ? 'outstanding' : 'cleared'}">
                                ${parseInt(sem.balance) > 0 ? 'Pending' : 'Paid'}
                            </div>
                        </div>
                        <div class="sem-stats-grid">
                            <div class="stat-item"><div class="lbl">Due</div><div class="val">${sem.due}</div></div>
                            <div class="stat-item"><div class="lbl">Paid</div><div class="val text-success">${sem.paid}</div></div>
                            <div class="stat-item"><div class="lbl">Balance</div><div class="val text-danger">${sem.balance}</div></div>
                        </div>
                    </div>`).join('');

                const finalHTML = `
                    <div class="dashboard-wrapper fee-details-view">
                        ${statsHTML}
                        <div class="dash-section-title">Semester Summaries</div>
                        <div class="semester-cards-grid">${semesterCards}</div>
                    </div>`;

                // 5. Render
                window.FlexUtils.renderInternalPage(finalHTML, "Fee Details");
                document.querySelector('.m-portlet__body')?.classList.add('hidden-legacy-source');

                // 6. Attach Event Listeners
                document.querySelectorAll('.semester-fee-card').forEach(card => {
                    card.addEventListener('click', function() {
                        const index = this.getAttribute('data-index');
                        const title = this.getAttribute('data-title');
                        const sourceId = `rowStdDetail_${index}`;

                        // Trigger AJAX load on legacy site
                        document.getElementById(`BtnhideshowInternal${index}`)?.click();

                        // Poll for data (Simplified)
                        let attempts = 0;
                        const poller = setInterval(() => {
                            attempts++;
                            const sourceDiv = document.getElementById(sourceId);
                            const hasData = sourceDiv?.innerHTML.length > 50; // simple check

                            if (hasData || attempts > 20) {
                                clearInterval(poller);
                                if (hasData) {
                                    const data = parseSemesterData(sourceDiv.innerHTML, index);
                                    // Generate Modal HTML (Simplified for brevity)
                                    const feeRows = data.financials.breakdown.map(f => `<div class="invoice-row"><span>${f.label}</span><span>${f.amount}</span></div>`).join('');
                                    const courseRows = data.courses.map(c => `<tr><td>${c.title}</td><td>${c.type}</td><td>${c.status}</td><td>${c.date}</td></tr>`).join('');
                                    
                                    const modalHTML = `
                                        <div id="modern-fee-modal" class="modern-modal-overlay">
                                            <div class="modern-modal-content slide-in-up">
                                                <div class="modal-header-modern"><h2>${title}</h2><button class="modal-close-btn">&times;</button></div>
                                                <div class="modal-body-grid">
                                                    <div class="modal-section"><h3 class="section-h3">Fees</h3><div class="invoice-card">${feeRows}<div class="invoice-divider"></div><div class="invoice-row highlight"><span>Balance</span><span>${data.financials.balance}</span></div></div></div>
                                                    <div class="modal-section"><h3 class="section-h3">Courses</h3><table class="modern-table"><thead><tr><th>Course</th><th>Type</th><th>Status</th><th>Date</th></tr></thead><tbody>${courseRows}</tbody></table></div>
                                                </div>
                                            </div>
                                        </div>`;
                                    
                                    document.body.insertAdjacentHTML('beforeend', modalHTML);
                                    const modal = document.getElementById('modern-fee-modal');
                                    modal.addEventListener('click', (e) => { if(e.target.classList.contains('modern-modal-overlay') || e.target.classList.contains('modal-close-btn')) modal.remove(); });
                                }
                            }
                        }, 200);
                    });
                });

            }, 1000); // End Timeout
            return true; // Success
        } catch (e) {
            console.error("FlexRedesign Error:", e);
            document.body.classList.remove('modern-active');
            return true; // Stop observer on error
        }
    };

    
    //If runModule returns false (data not ready), watch for changes.
    if (!runModule()) {
        const observer = new MutationObserver((mutations, obs) => {
            if (runModule()) obs.disconnect(); // Stop watching once UI is built
        });
        const target = document.querySelector('.m-portlet__body');
        if (target) observer.observe(target, { childList: true, subtree: true });
    }

})();