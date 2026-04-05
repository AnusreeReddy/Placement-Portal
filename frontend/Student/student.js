document.addEventListener("DOMContentLoaded", async () => {

const token = localStorage.getItem("token");

if (!token) {
    alert("Please login first");
    window.location.href = "http://127.0.0.1:5000/login";
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

            window.location.href =
                "http://127.0.0.1:5000/login";

            return Promise.reject("Unauthorized");
        }

        return res;
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


async function loadJobs() {

if (!opportunitiesList) return;

const res =
await authFetch("/jobs");

const jobs =
await res.json();

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
"card opportunity-card" +
(job.is_past ? " expired" : "");


const requiredSkills =
(job.skills || "")
.toLowerCase()
.split(",")
.map(s => s.trim());


const userSkills =
(document.getElementById(
"profile-skills"
)?.textContent || "")
.toLowerCase()
.split(",")
.map(s => s.trim());


const matchedSkills =
requiredSkills.filter(skill =>
userSkills.includes(skill)
).length;


const matchPercentage =
Math.round(
(matchedSkills /
requiredSkills.length) * 100
) || 0;


/* eligibility logic */

let eligible = true;


const userCgpa =
parseFloat(localStorage.getItem("cgpa")) || 0;

const jobCgpa =
parseFloat(job.cgpa) || 0;

if (jobCgpa > 0 && userCgpa < jobCgpa)
eligible = false;


const userYear =
parseInt(localStorage.getItem("year")) || 0;

const jobYear =
parseInt(job.year) || 0;

if (jobYear > 0 && userYear !== jobYear)
eligible = false;


const eligibilityText =
eligible
? "✅ Eligible"
: "❌ Not Eligible";


card.innerHTML = `

<h4>${job.role}</h4>

<p><strong>Company:</strong>
${job.company}</p>

<p><strong>Skills:</strong>
${job.skills}</p>

<p><strong>Deadline:</strong>
${job.deadline}</p>

<p><strong>CGPA Required:</strong>
${job.cgpa || "Not specified"}</p>

<p><strong>Passout Year:</strong>
${job.year || "Any"}</p>

<p><strong>Eligibility:</strong>
${eligibilityText}</p>

<p><strong>Skills Match:</strong>

<span style="color:${
matchPercentage >= 75
? "#28a745"
: matchPercentage >= 50
? "#ffc107"
: "#dc3545"
}">

${matchPercentage}%

</span>

</p>

${
eligible
? `<button onclick="window.open('${job.url}')">Apply</button>`
: `<button disabled style="background:gray">
Not Eligible
</button>`
}

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

}

loadRecommendedJobs();


/* ================= LOAD HACKATHONS ================= */

const eventsList =
document.getElementById("events-list");


async function loadHackathons() {

if (!eventsList) return;

const res =
await authFetch("/hackathons");

const hackathons =
await res.json();

eventsList.innerHTML = "";


hackathons.forEach(h => {

const card =
document.createElement("div");

card.className =
"card" +
(h.is_past ? " expired" : "");

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


/* ================= LOAD EVENTS ================= */

async function loadEvents() {

const res =
await authFetch("/events");

const events =
await res.json();

events.forEach(e => {

const card =
document.createElement("div");

card.className =
"card" +
(e.is_past ? " expired" : "");

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


/* ================= STREAK SYSTEM ================= */

let streak = 0;

const streakElem =
document.getElementById("streak-count");

fetch("/streak", {
headers: {
Authorization: "Bearer " + token
}
})
.then(res => res.json())
.then(data => {

streak = data.streak;

if (streakElem)
streakElem.textContent = streak;

});


/* ================= AI ASSISTANT ================= */

window.askAI = async function () {

const query =
document.getElementById(
"queryInput"
).value;

const res =
await authFetch("/ask-ai", {
method: "POST",
headers: {
"Content-Type":
"application/json"
},
body:
JSON.stringify({ query })
});

const data =
await res.json();

document.getElementById(
"aiResult"
).innerHTML =
data.answer;

};


/* ================= LOGOUT ================= */

document.getElementById("logoutBtn")
.addEventListener("click", e => {

e.preventDefault();

localStorage.removeItem("token");
localStorage.removeItem("role");

window.location.href =
"/login";

});


});