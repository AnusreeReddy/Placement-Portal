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

    document.getElementById("profile-cgpa").textContent =
        data.cgpa || "";

    document.getElementById("profile-year").textContent =
        data.year || "";

    const welcome =
        document.getElementById("profileNameElem");

    if (welcome) {
        welcome.textContent =
            data.name || "Student";
    }
    localStorage.setItem("cgpa", data.cgpa || 0);
    localStorage.setItem("year", data.year || 0);

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
                Authorization: "Bearer " + token
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

    // ✅ GET USER DATA (VERY IMPORTANT)
    const userCgpa = parseFloat(localStorage.getItem("cgpa")) || 0;
    const userYear = parseInt(localStorage.getItem("year")) || 0;

    jobs.forEach(job => {

        const card = document.createElement("div");

        card.className =
            "card opportunity-card" + (job.is_past ? " expired" : "");

        // ================= SKILL MATCH =================
        const requiredSkills = (job.skills || "")
            .toLowerCase()
            .split(',')
            .map(s => s.trim());

        const userSkills = (document.getElementById("profile-skills")?.textContent || "")
            .toLowerCase()
            .split(',')
            .map(s => s.trim());

        const matchedSkills = requiredSkills.filter(skill =>
            userSkills.includes(skill)
        ).length;

        const matchPercentage = Math.round(
            (matchedSkills / requiredSkills.length) * 100
        ) || 0;

        // ================= ELIGIBILITY =================
        let eligible = true;

        
        const userCgpa = parseFloat(localStorage.getItem("cgpa")) || 0;
        const jobCgpa = parseFloat(job.cgpa) || 0;

        if (jobCgpa > 0 && userCgpa < jobCgpa) {
            eligible = false;
        }

        const userYear = parseInt(localStorage.getItem("year")) || 0;
        const jobYear = parseInt(job.year) || 0;

        if (jobYear > 0 && userYear !== jobYear) {
            eligible = false;
        }

        const eligibilityText = eligible
            ? "<span style='color:green'>✅ Eligible</span>"
            : "<span style='color:red'>❌ Not Eligible</span>";

        console.log("User CGPA:", userCgpa);
        console.log("User Year:", userYear);
        console.log("Job CGPA:", job.cgpa);
        console.log("Job Year:", job.year);

        // ================= UI =================
        card.innerHTML = `

            <h4>${job.role}</h4>

            <p><strong>Company:</strong> ${job.company}</p>

            <p><strong>Skills:</strong> ${job.skills}</p>

            <p><strong>Deadline:</strong> ${job.deadline}</p>

            <p><strong>CGPA Required:</strong> ${job.cgpa || "Not specified"}</p>

            <p><strong>Passout Year:</strong> ${job.year || "Any"}</p>

            <p><strong>Eligibility:</strong> ${eligibilityText}</p>

            <p><strong>Skills Match:</strong>
                <span style="color: ${
                    matchPercentage >= 75 ? '#28a745' :
                    matchPercentage >= 50 ? '#ffc107' :
                    '#dc3545'
                }">
                    ${matchPercentage}%
                </span>
            </p>

            ${job.is_past
                ? '<span class="deadline-indicator">Expired</span>'
                : '<span class="deadline-indicator far">Active</span>'
            }

            ${
                eligible
                ? `<button onclick="window.open('${job.url}')">Apply</button>`
                : `<button disabled style="background:gray;cursor:not-allowed;">
                        Not Eligible
                   </button>`
            }

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

            const token = localStorage.getItem("token"); // ✅ MOVE HERE

        if (!token) {
            alert("User not logged in");
            return;
        }

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


   window.askAI = async function ()  {

    const query = document.getElementById("queryInput").value;

    const res = await fetch("/ask-ai", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({ query })
});

    const data = await res.json();

    document.getElementById("aiResult").innerHTML = data.answer;
}


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

// 🔥 BADGES DATA
const badges = [
    { name: "Beginner", desc: "1-day streak", earned: true },
    { name: "Consistent", desc: "3-day streak", earned: false },
    { name: "Pro", desc: "7-day streak", earned: false },
    { name: "Champion", desc: "15-day streak", earned: false }
];

// 🔥 LOAD BADGES FUNCTION
function loadBadges() {
    const container = document.getElementById("badges-list");
    container.innerHTML = "";

    badges.forEach(badge => {
        const div = document.createElement("div");

        div.className = "badge-card " + (badge.earned ? "badge-earned" : "badge-locked");

        div.innerHTML = `
            <div class="badge-row">
                <span class="badge-icon">🏆</span>
                <strong>${badge.name}</strong>
            </div>
            <div>${badge.desc}</div>
        `;

        container.appendChild(div);
    });
}

// 🔥 OPEN MODAL + LOAD DATA
document.getElementById("viewBadgesBtn").onclick = () => {
    document.getElementById("badgesModal").style.display = "flex";
    loadBadges();
};

// 🔥 CLOSE MODAL
document.getElementById("closeBadgesBtn").onclick = () => {
    document.getElementById("badgesModal").style.display = "none";
};


});