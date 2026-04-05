document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");
    
    console.log("Token check:", token ? "Found" : "Not found");

    if (!token) {

        alert("Please login first");

        window.location.href = "http://127.0.0.1:5000/login";

        return;

    }

    // Authenticated fetch wrapper: adds Authorization header and redirects on 401
    function authFetch(url, options = {}) {
        options = Object.assign({}, options);
        options.headers = Object.assign({}, options.headers || {});
        if (token) {
            options.headers.Authorization = 'Bearer ' + token;
        }

        return fetch(url, options).then(res => {
            if (res.status === 401) {
                // Token missing/expired — clear and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                window.location.href = 'http://127.0.0.1:5000/login';
                // return a rejected promise to stop further processing
                return Promise.reject(new Error('Unauthorized'));
            }
            return res;
        });
    }


    // ================= LOAD PROFILE =================

    authFetch("http://127.0.0.1:5000/profile", { method: "GET" })
    .then(res => res.json())
    .then(data => {
        document.getElementById("profile-name").textContent = data.name || "";
        document.getElementById("profile-branch").textContent = data.branch || "";
        document.getElementById("profile-skills").textContent = data.skills || "";
        const welcome = document.getElementById("profileNameElem");
        if (welcome) {
            welcome.textContent = data.name || "Student";
        }
    }).catch(err => console.warn('Profile load aborted:', err.message));



    // ================= LOAD JOB OPENINGS =================

    const opportunitiesList =
        document.getElementById("opportunities-list");


    async function loadJobs() {

        if (!opportunitiesList) return;

        const res = await authFetch("http://127.0.0.1:5000/jobs");

        const jobs = await res.json();

        opportunitiesList.innerHTML = "";

        if (jobs.length === 0) {

            opportunitiesList.innerHTML =
                "<p>No openings available yet</p>";

            return;

        }

        jobs.forEach(job => {

            const card =
                document.createElement("div");

            card.className =
                "card opportunity-card " + (job.is_past ? "expired" : "active");

            // Calculate skill match percentage
            const requiredSkills = job.skills.toLowerCase().split(',').map(s => s.trim());
            const userSkills = (document.getElementById("profile-skills")?.textContent || "").toLowerCase().split(',').map(s => s.trim());
            const matchedSkills = requiredSkills.filter(skill => userSkills.includes(skill)).length;
            const matchPercentage = Math.round((matchedSkills / requiredSkills.length) * 100) || 0;

            card.innerHTML = `

                <h4>${job.role}</h4>

                <p><strong>Company:</strong>
                ${job.company}</p>

                <p><strong>Skills:</strong>
                ${job.skills}</p>

                <p><strong>Deadline:</strong>
                ${job.deadline}</p>

                <p><strong>Skills Match:</strong> <span style="color: ${matchPercentage >= 75 ? '#28a745' : matchPercentage >= 50 ? '#ffc107' : '#dc3545'}">${matchPercentage}%</span></p>

                ${job.is_past ? '<span class="deadline-indicator">Expired</span>' : '<span class="deadline-indicator far">Active</span>'}

                <button onclick="openApplyForm(job.id, job.extra_fields)">
                Apply
                </button>

            `;

            opportunitiesList.appendChild(card);

        });

    }

    loadJobs();

            // ============ Define for dynamic form ==============//
            
    function openApplyForm(jobId, extraFields) {

    const fields = extraFields.split(",");

    let formHTML = "";

    fields.forEach(field => {
        if(field.trim() !== "") {
            formHTML += `
                <label>${field}</label>
                <input type="text" id="${field}" />
                <br>
            `;
        }
    });

    document.getElementById("dynamicForm").innerHTML = formHTML;

}
// ================= LOAD ML RECOMMENDED JOBS =================

async function loadRecommendedJobs() {

    const container =
        document.getElementById("recommended-list");

    if (!container) return;

    const res = await authFetch("http://127.0.0.1:5000/recommended-jobs");

    const jobs = await res.json();

    container.innerHTML = "";

    if (jobs.length === 0) {

        container.innerHTML =
            "<p>No recommendations yet</p>";

        return;
    }

    jobs.forEach(job => {

        const card =
            document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <h4>${job.role}</h4>

            <p>${job.company}</p>

            <p>Match Score:
            ${job.match_score}% ⭐</p>

        `;

        container.appendChild(card);

    });

}

loadRecommendedJobs();


    // ================= LOAD HACKATHONS =================

    const eventsList =
        document.getElementById("events-list");


    async function loadHackathons() {

        if (!eventsList) return;

        const res = await authFetch("http://127.0.0.1:5000/hackathons");

        const hackathons = await res.json();

        eventsList.innerHTML = "";

        if (hackathons.length === 0) {

            eventsList.innerHTML +=
                "<p>No hackathons available yet</p>";

            return;

        }

        hackathons.forEach(h => {

            const card =
                document.createElement("div");

            card.className =
                "card" + (h.is_past ? " expired" : "");

            card.innerHTML = `

                <h4>${h.title}</h4>

                <p><strong>Organizer:</strong>
                ${h.organizer}</p>

                <p><strong>Skills:</strong>
                ${h.skills}</p>

                <p><strong>Deadline:</strong>
                ${h.deadline}</p>

                <button onclick="window.open('${h.url}')">
                Register
                </button>

            `;

            eventsList.appendChild(card);

        });

    }

    loadHackathons();



    // ================= LOAD EVENTS =================

    async function loadEvents() {

        const res = await authFetch("http://127.0.0.1:5000/events");

        const events = await res.json();

        events.forEach(e => {

            const card =
                document.createElement("div");

            card.className =
                "card" + (e.is_past ? " expired" : "");

            card.innerHTML = `

                <h4>${e.title}</h4>

                <p><strong>Organizer:</strong>
                ${e.organizer}</p>

                <p><strong>Skills:</strong>
                ${e.skills}</p>

                <p><strong>Deadline:</strong>
                ${e.deadline}</p>

                <button onclick="window.open('${e.url}')">
                Register
                </button>

            `;

            eventsList.appendChild(card);

        });

    }

    loadEvents();



    // ================= UPLOAD RESUME =================

    const uploadResumeBtn =
        document.getElementById("upload-resume-btn");

    const resumeUpload =
        document.getElementById("resume-upload");

    const resumeStatus =
        document.getElementById("resume-status");


    if (uploadResumeBtn && resumeUpload) {

        uploadResumeBtn.addEventListener("click", async () => {

            const file = resumeUpload.files[0];

            if (!file) {

                resumeStatus.textContent = "Please select a file";

                return;

            }

            const formData = new FormData();

            formData.append("resume", file);

            const res = await authFetch(
                "http://127.0.0.1:5000/upload-resume",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await res.json();

            resumeStatus.textContent = data.message || "Upload failed";

        });

    }



    // ================= STREAK SYSTEM =================

    const streakCountElem =
        document.getElementById("streak-count");

    let streak = 0;


    function updateStreakUI() {

        if (streakCountElem) {

            streakCountElem.textContent = streak;

        }

    }


    function renderBadges(currentStreak) {

        const container = document.getElementById("badges-container");

        if (!container) return;

        container.innerHTML = "";
backe
        // Thresholds: 3 days -> bronze, 7 days -> silver, 30+ -> gold
        if (currentStreak >= 3) {
            const b = document.createElement('div');
            b.className = 'badge bronze';
            b.textContent = 'Bronze Streak (' + 3 + '+ days)';
            container.appendChild(b);
        }

        if (currentStreak >= 7) {
            const s = document.createElement('div');
            s.className = 'badge silver';
            s.textContent = 'Silver Streak (' + 7 + '+ days)';
            container.appendChild(s);
        }

        if (currentStreak >= 30) {
            const g = document.createElement('div');
            g.className = 'badge gold';
            g.textContent = 'Gold Streak (' + 30 + '+ days)';
            container.appendChild(g);
        }

        // If no badges yet, encourage next milestone
        if (container.children.length === 0) {
            const encourage = document.createElement('div');
            encourage.className = 'badge';
            encourage.style.background = '#6c757d';
            encourage.textContent = 'Keep checking in to earn badges!';
            container.appendChild(encourage);
        }

        // Add small icons to in-sidebar badges
        Array.from(container.children).forEach(child => {
            const text = child.textContent || '';
            let icon = '🏅';
            if (text.toLowerCase().includes('bronze')) icon = '🥉';
            else if (text.toLowerCase().includes('silver')) icon = '🥈';
            else if (text.toLowerCase().includes('gold')) icon = '🥇';
            const span = document.createElement('span');
            span.style.marginRight = '8px';
            span.textContent = icon;
            child.insertBefore(span, child.firstChild);
        });

    }

    // Build badge data and show modal
    function computeBadges(currentStreak) {
        // Gather counts from localStorage as fallback
        const appliedOpportunities = JSON.parse(localStorage.getItem('appliedOpportunities') || '[]');
        const appliedEvents = JSON.parse(localStorage.getItem('appliedEvents') || '[]');
        const applicationsCount = appliedOpportunities.length;
        const participationCount = appliedEvents.length;

            // Define badge definitions (with icons)
            const badges = [
                { id: 'streak-bronze', icon: '🥉', title: 'Streak Bronze', criteria: '3-day streak', earned: currentStreak >= 3, reason: currentStreak + ' days' },
                { id: 'streak-silver', icon: '🥈', title: 'Streak Silver', criteria: '7-day streak', earned: currentStreak >= 7, reason: currentStreak + ' days' },
                { id: 'streak-gold', icon: '🥇', title: 'Streak Gold', criteria: '30-day streak', earned: currentStreak >= 30, reason: currentStreak + ' days' },

                { id: 'apps-bronze', icon: '📄', title: 'Applicant Bronze', criteria: '1 application', earned: applicationsCount >= 1, reason: applicationsCount + ' applications' },
                { id: 'apps-silver', icon: '📑', title: 'Applicant Silver', criteria: '5 applications', earned: applicationsCount >= 5, reason: applicationsCount + ' applications' },
                { id: 'apps-gold', icon: '🏆', title: 'Applicant Gold', criteria: '10 applications', earned: applicationsCount >= 10, reason: applicationsCount + ' applications' },

                { id: 'part-bronze', icon: '🎟️', title: 'Participant Bronze', criteria: '1 event registration', earned: participationCount >= 1, reason: participationCount + ' events' },
                { id: 'part-silver', icon: '🎖️', title: 'Participant Silver', criteria: '5 event registrations', earned: participationCount >= 5, reason: participationCount + ' events' },
                { id: 'part-gold', icon: '🏅', title: 'Participant Gold', criteria: '10 event registrations', earned: participationCount >= 10, reason: participationCount + ' events' }
            ];

        return badges;
    }

    function openBadgesModal() {
        const modal = document.getElementById('badgesModal');
        const list = document.getElementById('badges-list');
        if (!modal || !list) return;
        list.innerHTML = '';

        // Fetch streak first to ensure up-to-date
        authFetch('http://127.0.0.1:5000/streak')
            .then(r => r.json())
            .then(data => {
                const badges = computeBadges(data.streak || 0);
                badges.forEach(b => {
                    const card = document.createElement('div');
                    card.className = 'badge-card' + (b.earned ? ' badge-earned' : ' badge-locked');

                    const row = document.createElement('div');
                    row.className = 'badge-row';

                    const icon = document.createElement('div');
                    icon.className = 'badge-icon';
                    icon.textContent = b.icon || '🏅';
                    row.appendChild(icon);

                    const meta = document.createElement('div');
                    meta.style.display = 'flex';
                    meta.style.flexDirection = 'column';
                    meta.innerHTML = `<strong>${b.title}</strong><span style="font-size:0.9em;color:#555;">${b.criteria}</span>`;
                    row.appendChild(meta);

                    card.appendChild(row);

                    const status = document.createElement('div');
                    status.style.marginTop = '8px';
                    status.innerHTML = b.earned ? `<span style="color:green;font-weight:bold;">Earned</span> <small style="margin-left:6px;color:#666;">(${b.reason})</small>` : `<span style="color:#888;">Locked</span> <small style="margin-left:6px;color:#666;">(${b.reason})</small>`;
                    card.appendChild(status);

                    list.appendChild(card);
                });
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            })
            .catch(err => {
                // Fallback to local values
                const badges = computeBadges(0);
                badges.forEach(b => {
                    const el = document.createElement('div');
                    el.style.border = '1px solid #ddd';
                    el.style.padding = '10px';
                    el.style.borderRadius = '8px';
                    el.innerHTML = `<strong>${b.title}</strong><div>${b.earned ? 'Earned' : 'Locked'} (${b.reason})</div>`;
                    list.appendChild(el);
                });
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
    }

    // Wire up modal open/close
    const viewBadgesBtn = document.getElementById('viewBadgesBtn');
    const closeBadgesBtn = document.getElementById('closeBadgesBtn');
    const badgesModal = document.getElementById('badgesModal');
    if (viewBadgesBtn) viewBadgesBtn.addEventListener('click', openBadgesModal);
    if (closeBadgesBtn) closeBadgesBtn.addEventListener('click', () => { if (badgesModal) { badgesModal.style.display = 'none'; document.body.style.overflow = ''; } });
    if (badgesModal) badgesModal.addEventListener('click', (e) => { if (e.target === badgesModal) { badgesModal.style.display = 'none'; document.body.style.overflow = ''; } });

    // Daily check-in button: manual increment of streak
    const checkInBtn = document.getElementById('checkInBtn');
    if (checkInBtn) {
        checkInBtn.addEventListener('click', async () => {
            try {
                const res = await authFetch('http://127.0.0.1:5000/streak', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'increment' })
                });

                const data = await res.json();
                if (!res.ok) {
                    alert(data.error || 'Could not check in');
                    return;
                }
                streak = data.streak;
                updateStreakUI();
                renderBadges(streak);
                alert('Checked in! Streak: ' + streak + ' days');
            } catch (err) {
                console.error(err);
                alert('Check-in failed');
            }
        });
    }


    // ================= LOAD STREAK =================

    fetch("http://127.0.0.1:5000/streak", {

        method: "GET",

        headers: {

            Authorization: "Bearer " + token

        }

    })

    .then(res => res.json())

    .then(data => {

        streak = data.streak;

        updateStreakUI();
        renderBadges(streak);

    });



    // ================= LOGOUT =================

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            e => {

                e.preventDefault();

                localStorage.removeItem("token");

                localStorage.removeItem("role");

                window.location.href =
                    "http://127.0.0.1:5000/login";

            }

        );

    }

});