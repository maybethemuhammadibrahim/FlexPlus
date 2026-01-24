(function initFeeDetails() {
    const path = window.location.pathname;
    if (!path.includes('StudentLedger') && !path.includes('FeeDetails') && !path.includes('ConsolidatedFeeReport')) return;

    // [DIAGRAM: Logic Flow]
    // 1. Expand Rows -> 2. Wait -> 3. Scrape Data (Ledger Logic) -> 4. Render UI -> 5. Delegate Clicks

    const calculateStats = () => {
        let totalPaid = 0;
        
        // Data Structures for logic
        // ledger: tracks the final status of a course per semester
        // Key: "SemesterID_CourseCode" (e.g., "1_SS2018")
        // Value: { credits: 3, status: 'Active' | 'Dropped' }
        const semesterLedger = {}; 
        
        // globalCourseCounts: tracks how many times a course was validly taken across ALL semesters
        const globalCourseCounts = {}; 

        // 1. Sum up all payments
        document.querySelectorAll('#sample_CollectionDetail tbody tr').forEach(row => {
            const status = row.cells[9]?.innerText.toLowerCase() || '';
            if (status.includes('posted') || status.includes('paid')) {
                const amount = parseFloat(row.cells[5]?.innerText.replace(/,/g, '') || '0');
                totalPaid += amount;
            }
        });

        // 2. Scan All Semester Tables (Net Status Approach)
        const tables = document.querySelectorAll('[id^="tblRegisteredCoursesDetail_"]');
        
        tables.forEach(table => {
            // Get Semester Index from ID (e.g., tblRegisteredCoursesDetail_1 -> 1)
            const semIndex = table.id.split('_')[1];

            table.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.cells;
                if (cells.length < 5) return;

                const titleFull = cells[1].innerText.trim();     // Title
                const type = cells[2].innerText.trim();          // Registration / Drop
                const status = cells[3].innerText.trim();        // Approved / Pending

                // Only care about Approved transactions
                if (status !== 'Approved') return;

                // Extract Code and Credits
                // Logic: Split by dash, Code is first part. Credits is last part (if numeric)
                let code = titleFull.split('-')[0].trim();
                let credits = 3; // Default

                // Regex to find credits at the end: "- 3" or "-3" or "(3)"
                const creditMatch = titleFull.match(/[-|–]\s*(\d+)\s*$/) || titleFull.match(/\((\d+)\)/);
                if (creditMatch) {
                    credits = parseInt(creditMatch[1]);
                }

                const uniqueKey = `${semIndex}_${code}`;

                // LOGIC CORE: Determine Net Status
                if (type === 'Registration') {
                    // Initialize or overwrite as Active
                    semesterLedger[uniqueKey] = { credits: credits, status: 'Active' };
                } else if (type === 'Drop') {
                    // Mark as dropped (Even if registered previously, this kills the registration)
                    if (semesterLedger[uniqueKey]) {
                        semesterLedger[uniqueKey].status = 'Dropped';
                    } else {
                        // Edge case: Drop appears before registration or standalone
                        semesterLedger[uniqueKey] = { credits: credits, status: 'Dropped' };
                    }
                }
            });
        });

        // 3. Aggregate Final Counts
        let totalCourses = 0;
        let repeatedCredits = 0;
        let repeatedCount = 0;

        // Iterate through our Ledger to build global counts
        Object.entries(semesterLedger).forEach(([key, data]) => {
            if (data.status === 'Active') {
                const code = key.split('_')[1]; // Extract 'SS2018' from '1_SS2018'
                
                totalCourses++;
                
                // Add to global history for repeat checking
                if (!globalCourseCounts[code]) {
                    globalCourseCounts[code] = { count: 0, credits: data.credits };
                }
                globalCourseCounts[code].count++;
            }
        });

        // 4. Calculate Repeats based on Global Counts
        Object.values(globalCourseCounts).forEach(course => {
            if (course.count > 1) {
                repeatedCount += (course.count - 1); // 1st time is free, rest are repeats
                repeatedCredits += (course.count - 1) * course.credits;
            }
        });

        return {
            totalPaid,
            totalCourses,
            repeatedCount,
            extraCost: repeatedCredits * 11000
        };
    };

    const parseSemesterDetails = (htmlContent, index) => {
        const temp = document.createElement('div');
        temp.innerHTML = htmlContent;

        const getTxt = (id) => temp.querySelector(`#${id}_${index}`)?.innerText.trim() || '0';
        const sgpa = getTxt('lbSGPA') || '-';
        const cgpa = getTxt('lbCGPA') || '-';

        const courses = [];
        temp.querySelectorAll(`#tblRegisteredCoursesDetail_${index} tbody tr`).forEach(row => {
            const cells = row.cells;
            if (cells && cells.length >= 5) {
                courses.push({
                    title: cells[1].innerText.trim(),
                    type: cells[2].innerText.trim(),
                    status: cells[3].innerText.trim(),
                    date: cells[4].innerText.trim()
                });
            }
        });

        const breakdown = [];
        const extractListItems = (listId, type) => {
            temp.querySelectorAll(`#${listId}_${index} li`).forEach(li => {
                const rawText = li.innerText.replace(/\s+/g, ' ').trim(); 
                const parts = rawText.split(':');
                if (parts.length > 1) {
                    breakdown.push({ 
                        label: parts[0].trim(), 
                        amount: parts[1].trim(),
                        type: type 
                    });
                }
            });
        };

        extractListItems('tblDueInSem', 'due');
        extractListItems('tblDiscount', 'discount');
        extractListItems('tblSponsored', 'sponsor');

        return {
            sgpa, cgpa, courses, 
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

    // FIX 1: Event Delegation helper
    const setupEventDelegation = () => {
        document.body.addEventListener('click', function(e) {
            const card = e.target.closest('.semester-fee-card');
            if (!card) return;

            const index = card.getAttribute('data-index');
            const title = card.getAttribute('data-title');
            
            // 1. Trigger Original Site's Logic (Hidden Button)
            const originalBtn = document.getElementById(`BtnhideshowInternal${index}`);
            if (originalBtn) originalBtn.click();

            // 2. Wait for AJAX Data
            const sourceId = `rowStdDetail_${index}`;
            let attempts = 0;
            document.body.style.cursor = 'wait';

            const poller = setInterval(() => {
                attempts++;
                const sourceDiv = document.getElementById(sourceId);
                const sgpaLabel = sourceDiv?.querySelector(`#lbSGPA_${index}`);
                const hasData = sgpaLabel && sgpaLabel.innerText.trim().length > 0;

                if (hasData || attempts > 50) {
                    clearInterval(poller);
                    document.body.style.cursor = 'default';
                    
                    if (hasData) {
                        const parsedData = parseSemesterDetails(sourceDiv.innerHTML, index);
                        if(window.showModernModal) {
                            window.showModernModal(title, parsedData);
                        } else {
                            renderFallbackModal(title, parsedData);
                        }
                    } 
                }
            }, 100);
        });
    };
    
    // Internal fallback modal renderer (Responsive Table Update Applied)
    const renderFallbackModal = (title, data) => {
        const feeRows = data.financials.breakdown.map(f => `<div class="invoice-row"><span>${f.label}</span><span>${f.amount}</span></div>`).join('');
        
        // Updated Course Rows with scroll-cell class
        const courseRows = data.courses.map(c => `
            <tr>
                <td class="scroll-cell">${c.title}</td>
                <td class="scroll-cell">${c.type}</td>
                <td class="scroll-cell">${c.status}</td>
                <td class="scroll-cell">${c.date}</td>
            </tr>
        `).join('');
        
        // Updated Modal HTML with table-responsive wrapper and updated classes
        const modalHTML = `
            <div id="modern-fee-modal" class="modern-modal-overlay active">
                <div class="modern-modal-content slide-in-up">
                    <div class="modal-header-modern">
                        <h2>${title}</h2>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body-grid">
                        <div class="modal-section">
                            <h3 class="section-h3">Fees</h3>
                            <div class="invoice-card">
                                ${feeRows}
                                <div class="invoice-divider"></div>
                                <div class="invoice-row highlight">
                                    <span>Balance</span>
                                    <span>${data.financials.balance}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-section">
                            <h3 class="section-h3">Courses</h3>
                            <div class="table-responsive">
                                <table class="modern-table">
                                    <thead>
                                        <tr>
                                            <th class="scroll-cell">Course</th>
                                            <th class="scroll-cell">Type</th>
                                            <th class="scroll-cell">Status</th>
                                            <th class="scroll-cell">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${courseRows}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('modern-fee-modal');
        const close = () => modal.remove();
        modal.querySelector('.modal-close-btn').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if(e.target === modal) close(); });
    };

    const runModule = () => {
        try {
            const mainTable = document.querySelector('#sample_CollectionDetail tbody');
            if (!mainTable || mainTable.children.length === 0) return false;

            console.log("fee details script running");

            // FIX 2: Smart Expansion
            document.querySelectorAll('[id^="BtnhideshowInternal"]').forEach(btn => {
                const index = btn.id.replace('BtnhideshowInternal', '');
                const detailRow = document.getElementById(`rowStdDetail_${index}`);
                
                if (detailRow && (detailRow.style.display === 'none' || detailRow.innerText.trim() === '')) {
                    btn.click();
                }
            });

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
                            <div class="sem-status ${parseInt(sem.balance.replace(/,/g,'')) > 0 ? 'outstanding' : 'cleared'}">
                                ${parseInt(sem.balance.replace(/,/g,'')) > 0 ? 'Pending' : 'Paid'}
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

                window.FlexUtils.renderInternalPage(finalHTML, "Fee Details");
                document.querySelector('.m-portlet__body')?.classList.add('hidden-legacy-source');
                
                // Init the global event listener
                setupEventDelegation();

            }, 2000); 
            return true;
        } catch (e) {
            console.error("FlexRedesign Error:", e);
            document.body.classList.remove('modern-active');
            return true;
        }
    };

    if (!runModule()) {
        const observer = new MutationObserver((mutations, obs) => {
            if (runModule()) obs.disconnect();
        });
        const target = document.querySelector('.m-portlet__body');
        if (target) observer.observe(target, { childList: true, subtree: true });
    }

})();