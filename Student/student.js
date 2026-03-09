// student.js

document.addEventListener('DOMContentLoaded', () => {

    const streakCountElem = document.getElementById('streak-count');
    const checkInBtn = document.getElementById('checkInBtn');
    const badgesContainer = document.getElementById('badges-container');
    const opportunitiesList = document.getElementById('opportunities-list');
    const eventsList = document.getElementById('events-list');
    const showAllBtn = document.getElementById('show-all-btn');
    const bestFitBtn = document.getElementById('best-fit-btn');

    // --- Part 1: Profile Display & Saving Logic ---

    // Load and display saved profile data
    const savedProfile = JSON.parse(localStorage.getItem('studentProfile')) || {
        name: "John Doe",
        branch: "Computer Science",
        skills: "HTML, CSS, JavaScript, React"
    };

    const profileNameElem = document.getElementById('profile-name');
    const profileBranchElem = document.getElementById('profile-branch');
    const profileSkillsElem = document.getElementById('profile-skills');

    if (profileNameElem) profileNameElem.textContent = savedProfile.name;
    if (profileBranchElem) profileBranchElem.textContent = savedProfile.branch;
    if (profileSkillsElem) profileSkillsElem.textContent = savedProfile.skills;

    // Logic to save the profile from the "build_profile.html" page
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        // Pre-fill form if data exists in localStorage
        const nameInput = document.getElementById('name');
        const branchInput = document.getElementById('branch');
        const skillsInput = document.getElementById('skills');
        const resumeInput = document.getElementById('resume');
        
        if (savedProfile) {
            if (nameInput) nameInput.value = savedProfile.name || '';
            if (branchInput) branchInput.value = savedProfile.branch || '';
            if (skillsInput) skillsInput.value = savedProfile.skills || '';
            if (resumeInput) resumeInput.value = savedProfile.resume || '';
        }
        
        // Save profile on form submission
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevents the page from reloading

            const newProfile = {
                name: nameInput.value,
                branch: branchInput.value,
                skills: skillsInput.value,
                resume: resumeInput.value,
                hasResume: !!resumeInput.value 
            };

            localStorage.setItem('studentProfile', JSON.stringify(newProfile));
            alert('Profile saved successfully!');
            window.location.href = 'student_dashboard.html';
        });
    }

    // --- Part 2: Daily Check-in and Gamification Logic ---
    let lastCheckInDate = localStorage.getItem('lastCheckInDate');
    let streak = parseInt(localStorage.getItem('streak')) || 0;
    let badges = JSON.parse(localStorage.getItem('badges')) || [];

    function updateGamificationUI() {
        if (!streakCountElem || !badgesContainer) return;
        streakCountElem.textContent = streak;
        badgesContainer.innerHTML = '';
        badges.forEach(badge => {
            const badgeElem = document.createElement('span');
            badgeElem.className = `badge ${badge.toLowerCase().replace(' ', '-')}`;
            badgeElem.textContent = badge;
            badgesContainer.appendChild(badgeElem);
        });
    }

    function awardBadges() {
        if (streak >= 7 && !badges.includes('Weekly Streak')) {
            badges.push('Weekly Streak');
            alert('🎉 Congrats! You earned the Weekly Streak badge!');
        }
        if (streak >= 30 && !badges.includes('Monthly Contributor')) {
            badges.push('Monthly Contributor');
            alert('🚀 Awesome! You earned the Monthly Contributor badge!');
        }
    }

    if (checkInBtn) {
        checkInBtn.addEventListener('click', () => {
            const today = new Date().toDateString();
            if (lastCheckInDate !== today) {
                streak++;
                lastCheckInDate = today;
                localStorage.setItem('lastCheckInDate', lastCheckInDate);
                localStorage.setItem('streak', streak);
                awardBadges();
                localStorage.setItem('badges', JSON.stringify(badges));
                updateGamificationUI();
                alert('Checked in! Your streak is now ' + streak + ' days.');
            } else {
                alert('You have already checked in today!');
            }
        });
    }

    updateGamificationUI();

    // --- Part 3: Dynamic Data Fetching and Rendering ---
    const opportunities = [
        { id: 1, type: 'Internship', company: 'Google', role: 'Software Engineer Intern', stipend: '₹80,000/month', duration: '6 months', details: 'Cutting-edge AI and machine learning projects.', url: 'https://careers.google.com/jobs/', skills: 'Python, Machine Learning, AI', deadline: '2025-10-01' },
        { id: 2, type: 'Placement', company: 'Microsoft', role: 'Data Analyst', stipend: '₹12 LPA', duration: 'Full-time', details: 'Analyze large datasets to drive business decisions.', url: 'https://jobs.microsoft.com/', skills: 'SQL, Python, Excel', deadline: '2025-11-25' },
        { id: 3, type: 'Internship', company: 'Amazon', role: 'Cloud Support Associate', stipend: '₹70,000/month', duration: '4 months', details: 'Provide technical assistance to AWS customers.', url: 'https://www.amazon.jobs/en/', skills: 'AWS, Cloud Computing, Linux', deadline: '2025-12-15' },
    ];
    
    // Hard-coded events data for display
    const events = [
        { id: 4, type: 'Hackathon', title: 'Code Fiesta 2024', organizer: 'Tech Innovators Club', date: 'October 25, 2024', details: 'A 24-hour coding challenge.', url: 'https://devpost.com/hackathons', deadline: '2025-10-24' },
        { id: 5, type: 'Workshop', title: 'Intro to React.js', organizer: 'Dev Community', date: 'November 10, 2024', details: 'Learn the fundamentals of building modern web applications.', url: 'https://www.eventbrite.com/', deadline: '2025-11-09' },
        { id: 6, type: 'Seminar', title: 'Future of AI in Industry', organizer: 'Alumni Network', date: 'November 20, 2024', details: 'A talk by industry leaders on the latest trends in AI.', url: 'https://www.linkedin.com/events/', deadline: '2025-11-19' },
    ];

    const newOpenings = JSON.parse(localStorage.getItem('postedOpenings')) || [];
    const allOpportunities = [...opportunities, ...newOpenings];
    
    function addMatchingData(studentProfile, opportunities) {
        const studentSkills = studentProfile && studentProfile.skills ? studentProfile.skills.split(',').map(s => s.trim().toLowerCase()) : [];
        return opportunities.map(job => {
            const jobSkills = job.skills ? job.skills.split(',').map(s => s.trim().toLowerCase()) : [];
            const matchedSkills = studentSkills.filter(skill => jobSkills.includes(skill));
            const unmatchedSkills = jobSkills.filter(skill => !studentSkills.includes(skill));
            const totalSkills = jobSkills.length;
            const accuracy = totalSkills > 0 ? ((matchedSkills.length / totalSkills) * 100).toFixed(0) : 0;
            return {
                ...job,
                matchedSkills,
                unmatchedSkills,
                accuracy: parseInt(accuracy)
            };
        });
    }

    const processedOpportunities = addMatchingData(savedProfile, allOpportunities);

    function recommendJobs() {
        return processedOpportunities.filter(job => job.accuracy > 20).sort((a, b) => b.accuracy - a.accuracy);
    }
    
    function renderOpportunities(opportunitiesToShow) {
        if (!opportunitiesList) return;
        opportunitiesList.innerHTML = '';
        if (opportunitiesToShow.length === 0) {
            opportunitiesList.innerHTML = '<p>No opportunities found. Try updating your profile with more skills or check the "Show All Opportunities" filter.</p>';
            return;
        }

        const today = new Date();
        const daysToDeadlineAlert = 7;
        const alertShown = sessionStorage.getItem('highPriorityAlertShown');

        if (!alertShown) {
            opportunitiesToShow.forEach(item => {
                const deadlineDate = item.deadline ? new Date(item.deadline) : null;
                const isDeadlineNear = deadlineDate && (deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= daysToDeadlineAlert;
                
                if (item.accuracy >= 50 && isDeadlineNear) {
                    alert(`🚨 High-Priority Alert! The deadline for ${item.role} at ${item.company} is near. Don't miss out!`);
                    sessionStorage.setItem('highPriorityAlertShown', 'true');
                    return;
                }
            });
        }
        
        opportunitiesToShow.forEach(item => {
            const hasDeadlinePassed = item.deadline ? new Date(item.deadline) < new Date() : false;
            
            let deadlineIndicator = '';
            if (item.deadline && !hasDeadlinePassed) {
                const daysRemaining = Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysRemaining <= 5) {
                    deadlineIndicator = `<div class="deadline-indicator near">${daysRemaining} Days Left</div>`;
                } else {
                    deadlineIndicator = `<div class="deadline-indicator far">${daysRemaining} Days Left</div>`;
                }
            }
            
            const matchedTags = item.matchedSkills.map(s => `<span class="skill-tag matched-skill">${s}</span>`).join('');
            const unmatchedTags = item.unmatchedSkills.map(s => `<span class="skill-tag unmatched-skill">${s}</span>`).join('');
            
            const card = document.createElement('div');
            card.className = `card opportunity-card ${hasDeadlinePassed ? 'expired' : ''}`;
            card.innerHTML = `
                ${deadlineIndicator}
                <h4>${item.role} (${item.type || 'Placement'})</h4>
                <p><strong>Company:</strong> ${item.company}</p>
                <p><strong>Stipend/Salary:</strong> ${item.stipend || 'Not Specified'}</p>
                <p><strong>Duration:</strong> ${item.duration || 'N/A'}</p>
                <p><strong>Details:</strong> ${item.details || 'A new opportunity posted by the Placement Officer.'}</p>
                <p><strong>Deadline:</strong> ${item.deadline || 'N/A'}</p>
                ${hasDeadlinePassed ? '<p style="color: red; font-weight: bold;">Deadline Passed</p>' : ''}
                <div class="skills-summary">
                    <p><strong>Required Skills:</strong> ${item.skills || 'N/A'}</p>
                    <p class="match-accuracy">Match Accuracy: ${item.accuracy}%</p>
                    <p><strong>Skills Matched:</strong> ${matchedTags || 'None'}</p>
                    <p><strong>Skills Missing:</strong> ${unmatchedTags || 'None'}</p>
                </div>
                <div class="apply-btn-group">
                    <button class="apply-btn" data-id="${item.id}" data-type="opportunity" data-action="auto" ${hasDeadlinePassed ? 'disabled' : ''}>Auto Apply</button>
                    <button class="manual-btn" data-id="${item.id}" data-type="opportunity" data-action="manual" ${hasDeadlinePassed ? 'disabled' : ''}>Manual Apply</button>
                </div>
            `;
            opportunitiesList.appendChild(card);
        });
    }

    // Function to render events
    function renderEvents() {
        if (!eventsList) return;
        eventsList.innerHTML = '';
        
        events.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card event-card';
            card.innerHTML = `
                <h4>${item.title} (${item.type})</h4>
                <p><strong>Organizer:</strong> ${item.organizer}</p>
                <p><strong>Date:</strong> ${item.date}</p>
                <p><strong>Details:</strong> ${item.details}</p>
                <button class="register-btn" data-event-id="${item.id}" data-event-title="${item.title}">Register</button>
            `;
            eventsList.appendChild(card);
        });
    }

    // Event listeners for the filter buttons
    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
            showAllBtn.classList.add('active-filter');
            bestFitBtn.classList.remove('active-filter');
            renderOpportunities(processedOpportunities);
        });
    }
    
    if (bestFitBtn) {
        bestFitBtn.addEventListener('click', () => {
            bestFitBtn.classList.add('active-filter');
            showAllBtn.classList.remove('active-filter');
            const recommended = recommendJobs();
            renderOpportunities(recommended);
        });
    }

    // --- Event Delegation for dynamic buttons ---
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.apply-btn, .manual-btn, .register-btn');
        if (!button) return;

        const action = button.dataset.action;
        const type = button.dataset.type;

        if (action === 'auto') {
            const id = button.dataset.id;
            const item = allOpportunities.find(o => o.id == id);
            
            const profile = JSON.parse(localStorage.getItem('studentProfile'));
            if (!profile || !profile.skills || profile.skills.length === 0) {
                alert('Please complete your profile (add skills) before using Auto Apply!');
                return;
            }
            
            let appliedOpportunities = JSON.parse(localStorage.getItem('appliedOpportunities')) || [];
            const applicationDate = new Date().toLocaleDateString();

            appliedOpportunities.push({
                ...item,
                applicantName: profile.name,
                applicantSkills: profile.skills,
                date: applicationDate,
                method: 'Auto-Applied'
            });
            localStorage.setItem('appliedOpportunities', JSON.stringify(appliedOpportunities));
            alert(`Your application for ${item.role} was submitted successfully!`);
            
            button.textContent = 'Applied';
            button.disabled = true;
        } else if (action === 'manual') {
            const id = button.dataset.id;
            const item = allOpportunities.find(o => o.id == id);
            window.open(item.url, '_blank');
        } else if (button.classList.contains('register-btn')) {
            const eventId = button.dataset.eventId;
            const eventTitle = button.dataset.eventTitle;
            alert(`You have successfully registered for the event: "${eventTitle}". Check your email for more details!`);
            button.textContent = 'Registered';
            button.disabled = true;
        }
    });


    // --- Your Applications Logic (for a separate page) ---
    function renderApplicationsPage() {
        const applicationsList = document.getElementById('applications-list');
        if (!applicationsList) return;

        const appliedOpportunities = JSON.parse(localStorage.getItem('appliedOpportunities')) || [];

        if (appliedOpportunities.length === 0) {
            applicationsList.innerHTML = '<p>You have not applied for any opportunities yet.</p>';
            return;
        }

        const sortedApplications = appliedOpportunities.sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedApplications.forEach(app => {
            const card = document.createElement('div');
            card.className = 'application-card';
            card.innerHTML = `
                <h4>${app.role} at ${app.company}</h4>
                <p><strong>Application Date:</strong> ${app.date}</p>
                <p><strong>Method:</strong> ${app.method}</p>
                <p><strong>Status:</strong> <span class="status-pending">Pending Review</span></p>
            `;
            applicationsList.appendChild(card);
        });
    }

    // Initial render based on the current page
    if (window.location.pathname.endsWith('student_dashboard.html')) {
        renderOpportunities(processedOpportunities);
        renderEvents();
    } else if (window.location.pathname.endsWith('your_applications.html')) {
        renderApplicationsPage();
    }
});