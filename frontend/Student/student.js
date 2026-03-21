document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");
    
    console.log("Token check:", token ? "Found" : "Not found");

    if (!token) {

        alert("Please login first");

        window.location.href = "http://127.0.0.1:5000/login";

        return;

    }


    // ================= LOAD PROFILE =================

    fetch("http://127.0.0.1:5000/profile", {

        method: "GET",

        headers: {

            Authorization: "Bearer " + token

        }

    })

    .then(res => res.json())

    .then(data => {

        document.getElementById("profile-name").textContent =
            data.name || "";

        document.getElementById("profile-branch").textContent =
            data.branch || "";

        document.getElementById("profile-skills").textContent =
            data.skills || "";

        const welcome =
            document.getElementById("profileNameElem");

        if (welcome) {

            welcome.textContent =
                data.name || "Student";

        }

    });



    // ================= LOAD JOB OPENINGS =================

    const opportunitiesList =
        document.getElementById("opportunities-list");


    async function loadJobs() {

        if (!opportunitiesList) return;

        const res = await fetch(
            "http://127.0.0.1:5000/jobs",
            {
                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );

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
                "card opportunity-card" + (job.is_past ? " expired" : "");

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

                <button onclick="window.open('${job.url}')">
                Apply
                </button>

            `;

            opportunitiesList.appendChild(card);

        });

    }

    loadJobs();
// ================= LOAD ML RECOMMENDED JOBS =================

async function loadRecommendedJobs() {

    const container =
        document.getElementById("recommended-list");

    if (!container) return;

    const res = await fetch(
        "http://127.0.0.1:5000/recommended-jobs",
        {
            headers: {
                Authorization:
                    "Bearer " + token
            }
        }
    );

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

        const res = await fetch(
            "http://127.0.0.1:5000/hackathons",
            {
                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );

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

        const res = await fetch(
            "http://127.0.0.1:5000/events",
            {
                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );

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

            const res = await fetch(
                "http://127.0.0.1:5000/upload-resume",
                {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + token
                    },
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