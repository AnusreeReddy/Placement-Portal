document.addEventListener("DOMContentLoaded", () => {

/* ================= TOKEN CHECK ================= */

const token = localStorage.getItem("token");

if (!token) {
    alert("Please login first");
    window.location.href = "/login";
    return;
}

/* ================= AUTH FETCH ================= */

function authFetch(url, options = {}) {

    options.headers = {
        ...(options.headers || {}),
        Authorization: "Bearer " + token
    };

    return fetch(url, options).then(res => {

        if (res.status === 401) {

            localStorage.removeItem("token");
            localStorage.removeItem("role");

            window.location.href = "/login";

            return Promise.reject("Unauthorized");
        }

        return res;
    });
}

/* ================= STREAK SYSTEM ================= */

let streak = 0;

const checkInBtn = document.getElementById("checkInBtn");
const streakElem = document.getElementById("streak-count");

/* LOAD CURRENT STREAK */

let badges = JSON.parse(localStorage.getItem('badges')) || [];

authFetch("/streak")
.then(res => res.json())
.then(data => {

    streak = data.streak || 0;

    if (streakElem)
        streakElem.textContent = streak;

    // Award badges based on streak
    awardBadges();

    // Render badges
    renderBadges();

});

/* AWARD BADGES */

function awardBadges() {

    if (streak >= 7 && !badges.includes('Weekly Streak')) {
        badges.push('Weekly Streak');
        alert('🎉 Congrats! You earned the Weekly Streak badge!');
    }

    if (streak >= 30 && !badges.includes('Monthly Contributor')) {
        badges.push('Monthly Contributor');
        alert('🎉 Congrats! You earned the Monthly Contributor badge!');
    }

    if (streak >= 100 && !badges.includes('Century Streak')) {
        badges.push('Century Streak');
        alert('🎉 Congrats! You earned the Century Streak badge!');
    }

    localStorage.setItem('badges', JSON.stringify(badges));
}

/* RENDER BADGES */

function renderBadges() {

    const badgesContainer = document.getElementById('badges-container');

    if (!badgesContainer) return;

    badgesContainer.innerHTML = '';

    if (!badges.length) {
        badgesContainer.innerHTML = '<p>No badges earned yet. Keep logging in daily!</p>';
        return;
    }

    badges.forEach(badge => {

        const badgeElem = document.createElement('span');

        badgeElem.className = `badge ${badge.toLowerCase().replace(' ', '-')}`;

        badgeElem.textContent = badge;

        badgesContainer.appendChild(badgeElem);

    });
}

/* UPDATE STREAK */

if (checkInBtn) {

checkInBtn.addEventListener("click", async () => {

    try {

        const response = await authFetch("/streak", {
            method: "POST"
        });

        const data = await response.json();

        if (data.error) {

            alert(data.error);

        } else {

            streak = data.streak;

            if (streakElem)
                streakElem.textContent = streak;

            // Award badges after streak update
            awardBadges();

            // Re-render badges
            renderBadges();

            alert("🔥 Checked in! Your streak is now " + streak + " days.");

        }

    } catch (err) {

        console.error(err);
        alert("Error updating streak");

    }

});
}

/* ================= LOAD PROFILE ================= */

authFetch("/profile")
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

if (welcome)
welcome.textContent =
data.name || "Student";

localStorage.setItem("cgpa", data.cgpa || 0);
localStorage.setItem("year", data.year || 0);

});

/* ================= LOAD JOBS ================= */

const opportunitiesList =
document.getElementById("opportunities-list");
const showAllBtn = document.getElementById("show-all-btn");
const bestFitBtn = document.getElementById("best-fit-btn");
let currentJobs = [];
let currentApplyJobId = null;

const applyModal = document.getElementById("jobApplyModal");
const applyJobTitle = document.getElementById("applyJobTitle");
const applyJobCompany = document.getElementById("applyJobCompany");
const applyJobDeadline = document.getElementById("applyJobDeadline");
const applyJobDetails = document.getElementById("applyJobDetails");
const applyJobRequirements = document.getElementById("applyJobRequirements");
const closeApplyModalBtn = document.getElementById("closeApplyModalBtn");
const submitApplicationBtn = document.getElementById("submitApplicationBtn");

let userProfile = {};

function setActiveFilter(button) {
    if (showAllBtn) showAllBtn.classList.toggle("active-filter", button === showAllBtn);
    if (bestFitBtn) bestFitBtn.classList.toggle("active-filter", button === bestFitBtn);
}

if (showAllBtn) {
    showAllBtn.addEventListener("click", () => {
        setActiveFilter(showAllBtn);
        loadJobs();
    });
}

if (bestFitBtn) {
    bestFitBtn.addEventListener("click", () => {
        setActiveFilter(bestFitBtn);
        loadBestFitJobs();
    });
}

// Load student profile for apply form
authFetch("/profile")
.then(res => res.json())
.then(data => {
    userProfile = data;
})
.catch(err => console.error("Could not load profile:", err));

function renderRequirements(requirements, userProfile) {
    let html = `
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <strong style="display: block; margin-bottom: 12px;">Default Information (Required)</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: bold;">Name:</label>
                    <input type="text" name="default-name" value="${userProfile.name || ''}" disabled style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #e9e9e9; cursor: not-allowed;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: bold;">Branch:</label>
                    <input type="text" name="default-branch" value="${userProfile.branch || ''}" disabled style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #e9e9e9; cursor: not-allowed;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: bold;">Roll Number:</label>
                    <input type="text" name="default-roll_no" value="${userProfile.roll_no || ''}" disabled style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #e9e9e9; cursor: not-allowed;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: bold;">CGPA:</label>
                    <input type="number" name="default-cgpa" value="${userProfile.cgpa || ''}" disabled step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #e9e9e9; cursor: not-allowed;">
                </div>
            </div>
        </div>
    `;

    if (!requirements || !Object.keys(requirements).length) {
        html += "<p><em>No custom requirements were added for this opening.</em></p>";
    } else {
        html += `
            <strong style="display: block; margin-bottom: 12px;">Custom Requirements</strong>
            <div style="background: #f0f8ff; padding: 16px; border-radius: 8px; border-left: 4px solid #007bff;">
                ${Object.entries(requirements).map(([name, type]) => {
                    const inputType = type === 'number' ? 'number' : type === 'email' ? 'email' : 'text';
                    return `
                        <div style="margin-bottom: 12px;">
                            <label for="req-${name}" style="display: block; margin-bottom: 4px; font-weight: bold;">
                                ${name} 
                                <span style="color: #dc3545; font-weight: bold;">*</span>
                            </label>
                            <input type="${inputType}" id="req-${name}" name="${name}" required placeholder="Enter ${name}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    return html;
}

window.openApplyModal = (jobId) => {
    const job = currentJobs.find(j => j.id === jobId);
    if (!job) return;

    currentApplyJobId = jobId;

    applyJobTitle.textContent = `${job.role}`;
    applyJobCompany.innerHTML = `<strong>Company:</strong> ${job.company}`;
    applyJobDeadline.innerHTML = `<strong>Deadline:</strong> ${job.deadline}`;

    const details = [];
    if (job.cgpa) details.push(`<p><strong>Minimum CGPA:</strong> ${job.cgpa}</p>`);
    if (job.year) details.push(`<p><strong>Passout Year:</strong> ${job.year}</p>`);
    if (job.branches) details.push(`<p><strong>Branches:</strong> ${job.branches}</p>`);
    if (job.job_type) details.push(`<p><strong>Type:</strong> ${job.job_type}</p>`);
    if (job.url) details.push(`<p><strong>External Application Page:</strong> <a href="${job.url}" target="_blank" rel="noreferrer">Visit Link</a></p>`);

    applyJobDetails.innerHTML = details.join("") || "<p>No extra details available.</p>";
    applyJobRequirements.innerHTML = renderRequirements(job.extra_fields, userProfile);

    applyModal.style.display = "flex";
};

function closeApplyModal() {
    applyModal.style.display = "none";
    currentApplyJobId = null;
}

closeApplyModalBtn?.addEventListener("click", closeApplyModal);
applyModal?.addEventListener("click", event => {
    if (event.target === applyModal) closeApplyModal();
});

const applyForm = document.getElementById("applyForm");

applyForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentApplyJobId) {
        alert("Error: No job selected");
        return;
    }

    try {
        // Validate required custom fields
        const customInputs = applyForm.querySelectorAll('input[type="text"], input[type="number"], input[type="email"]');
        let hasError = false;
        let errorMsg = "";

        customInputs.forEach(input => {
            if (input.required && !input.value.trim()) {
                hasError = true;
                errorMsg = `Please fill in: ${input.placeholder || input.name}`;
            }
        });

        if (hasError) {
            alert(errorMsg);
            return;
        }

        const extra_data = {
            name: userProfile.name || "",
            branch: userProfile.branch || "",
            roll_no: userProfile.roll_no || "",
            cgpa: userProfile.cgpa || ""
        };

        // Collect all custom requirement fields
        customInputs.forEach(input => {
            if (input.name && !input.name.startsWith("default-")) {
                extra_data[input.name] = input.value || "";
            }
        });

        console.log("Submitting application:", { job_id: currentApplyJobId, extra_data });

        const response = await authFetch("/apply-job", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ job_id: currentApplyJobId, extra_data })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Application submission failed");
        }

        const data = await response.json();
        alert(data.message || "Application submitted successfully!");
        closeApplyModal();
        loadJobs();
    } catch (err) {
        console.error("Application submission error:", err);
        alert("Error: " + (err.message || "Unable to submit application."));
    }
});

async function loadJobs() {

if (!opportunitiesList) return;

const res =
await authFetch("/jobs");

const jobs =
await res.json();
currentJobs = jobs;

opportunitiesList.innerHTML = "";

if (!jobs.length) {

opportunitiesList.innerHTML =
"<p>No openings available yet</p>";

return;
}

jobs.forEach(job => {

const card =
document.createElement("div");

card.className =
"card opportunity-card";

const userCgpa =
parseFloat(localStorage.getItem("cgpa")) || 0;

const jobCgpa =
parseFloat(job.cgpa) || 0;

const userYear =
parseInt(localStorage.getItem("year")) || 0;

const jobYear =
parseInt(job.year) || 0;

let eligible = true;

if (jobCgpa > 0 && userCgpa < jobCgpa)
eligible = false;

if (jobYear > 0 && userYear !== jobYear)
eligible = false;

        const requirementsHtml = job.extra_fields && Object.keys(job.extra_fields).length ?
            `<p><strong>Custom Requirements:</strong> ${Object.keys(job.extra_fields).join(", ")}</p>` : "";

card.innerHTML = `

<h4>${job.role}</h4>

<p><strong>Company:</strong>
${job.company}</p>

<p><strong>Skills:</strong>
${job.skills}</p>

<p><strong>Deadline:</strong>
${job.deadline}</p>

${job.cgpa ? `<p><strong>Minimum CGPA:</strong> ${job.cgpa}</p>` : ""}
${job.year ? `<p><strong>Passout Year:</strong> ${job.year}</p>` : ""}
${job.branches ? `<p><strong>Branches:</strong> ${job.branches}</p>` : ""}
${job.job_type ? `<p><strong>Job Type:</strong> ${job.job_type}</p>` : ""}

${requirementsHtml}

<p><strong>Eligibility:</strong>
${eligible ? "✅ Eligible" : "❌ Not Eligible"}</p>

<button onclick="openApplyModal(${job.id})">Apply</button>

`;

opportunitiesList.appendChild(card);

});

}

loadJobs();

/* ================= RECOMMENDED JOBS ================= */

async function loadRecommendedJobs() {

const container =
document.getElementById(
"recommended-list"
);

if (!container) return;

try {

const res =
await authFetch(
"/recommended-jobs"
);

const jobs =
await res.json();

container.innerHTML = "";

if (!jobs.length) {

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

} catch (err) {

console.error("Recommended jobs error:", err);

}

}

loadRecommendedJobs();

/* ================= LOAD HACKATHONS ================= */

const eventsList =
document.getElementById("events-list");

async function loadHackathons() {

if (!eventsList) return;

try {

const res =
await authFetch("/hackathons");

const hackathons =
await res.json();

eventsList.innerHTML = "";

hackathons.forEach(h => {

const card =
document.createElement("div");

card.className = "card";

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

} catch {}

}

loadHackathons();

/* ================= LOAD EVENTS ================= */

async function loadEvents() {

if (!eventsList) return;

try {

const res =
await authFetch("/events");

const events =
await res.json();

events.forEach(e => {

const card =
document.createElement("div");

card.className = "card";

card.innerHTML = `

<h4>${e.title}</h4>

<p><strong>Organizer:</strong>
${e.organizer}</p>

<p><strong>Deadline:</strong>
${e.deadline}</p>

<button onclick="window.open('${e.url}')">
Register
</button>

`;

eventsList.appendChild(card);

});

} catch {}

}

loadEvents();

/* ================= AI ASSISTANT ================= */

window.askAI = async () => {
    const queryInput = document.getElementById("queryInput");
    const aiResult = document.getElementById("aiResult");

    if (!queryInput || !queryInput.value.trim()) {
        alert("Please enter a question");
        return;
    }

    const query = queryInput.value.trim();

    try {
        const res = await authFetch("/ask-ai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        if (!res.ok) {
            throw new Error("AI query failed");
        }

        const data = await res.json();
        aiResult.innerHTML = `<div style="background: #e3f2fd; padding: 12px; border-radius: 4px; margin-top: 12px; border-left: 4px solid #2196F3;"><strong>AI Response:</strong> ${data.answer}</div>`;
        queryInput.value = "";
    } catch (err) {
        console.error("AI error:", err);
        aiResult.innerHTML = `<div style="background: #ffebee; padding: 12px; border-radius: 4px; margin-top: 12px; border-left: 4px solid #f44336; color: #c62828;"><strong>Error:</strong> Failed to get AI response. Please try again.</div>`;
    }
};

/* ================= BADGES MODAL ================= */

const viewBadgesBtn = document.getElementById("viewBadgesBtn");
const badgesModal = document.getElementById("badgesModal");
const closeBadgesBtn = document.getElementById("closeBadgesBtn");
const badgesList = document.getElementById("badges-list");

if (viewBadgesBtn) {

    viewBadgesBtn.addEventListener("click", () => {

        if (!badgesList) return;

        const allBadges = [

            { name: 'Weekly Streak', desc: 'Log in for 7 consecutive days', earned: badges.includes('Weekly Streak') },

            { name: 'Monthly Contributor', desc: 'Log in for 30 consecutive days', earned: badges.includes('Monthly Contributor') },

            { name: 'Century Streak', desc: 'Log in for 100 consecutive days', earned: badges.includes('Century Streak') },

            { name: 'First Application', desc: 'Submit your first job application', earned: false }, // Placeholder

            { name: 'Profile Complete', desc: 'Complete your student profile', earned: false } // Placeholder

        ];

        badgesList.innerHTML = '';

        allBadges.forEach(badge => {

            const badgeItem = document.createElement('div');

            badgeItem.className = `badge-item ${badge.earned ? 'earned' : 'locked'}`;

            badgeItem.innerHTML = `

                <h4>${badge.name}</h4>

                <p>${badge.desc}</p>

                <span class="badge-status">${badge.earned ? '✅ Earned' : '🔒 Locked'}</span>

            `;

            badgesList.appendChild(badgeItem);

        });

        badgesModal.style.display = "flex";

    });

}

if (closeBadgesBtn) {

    closeBadgesBtn.addEventListener("click", () => {

        badgesModal.style.display = "none";

    });

}

if (badgesModal) {

    badgesModal.addEventListener("click", event => {

        if (event.target === badgesModal) {

            badgesModal.style.display = "none";

        }

    });

}

/* ================= LOGOUT ================= */

const logoutBtn =
document.getElementById("logoutBtn");

if (logoutBtn) {

logoutBtn.addEventListener("click", e => {

e.preventDefault();

localStorage.removeItem("token");
localStorage.removeItem("role");

window.location.href =
"/login";

});

}

});