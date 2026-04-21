/* ================= GLOBAL FUNCTION FOR DYNAMIC FIELDS ================= */

function addField() {

const name =
document.getElementById("fieldName").value;

const type =
document.getElementById("fieldType").value;

if (!name) {

alert("Enter field name first");

return;

}

const container =
document.getElementById(
"dynamicFieldsContainer"
);

const input =
document.createElement("input");

input.className =
"dynamic-field";

input.name = name;

input.dataset.type = type;

input.placeholder =
name + " (" + type + ")";

container.appendChild(input);

document.getElementById(
"fieldName"
).value = "";

}




/* ================= MAIN SCRIPT ================= */

document.addEventListener(
'DOMContentLoaded',
() => {

const token =
localStorage.getItem("token");

if (!token) {

alert("Please login first");

window.location.href =
"http://127.0.0.1:5000/login";

return;

}

const postForm =
document.getElementById(
'postForm'
);

const postHackathonForm =
document.getElementById(
'postHackathonForm'
);

const postEventForm =
document.getElementById(
'postEventForm'
);

const openingsContainer =
document.getElementById(
'my-openings-container'
);

const studentList =
document.getElementById(
'student-list'
);





/* ================= POST JOB ================= */

if (postForm) {

postForm.addEventListener(
'submit',
async (e) => {

e.preventDefault();

const extraFields = {};

document.querySelectorAll(
".dynamic-field"
).forEach(field => {

extraFields[field.name] =
field.dataset.type;

});

const jobData = {

company:
document.getElementById(
'companyName'
).value,

role:
document.getElementById(
'jobRole'
).value,

stipend:
document.getElementById(
'stipend'
).value,

duration:
document.getElementById(
'duration'
).value,

skills:
document.getElementById(
'requiredSkills'
).value,

url:
document.getElementById(
'redirectingLink'
).value,

deadline:
document.getElementById(
'deadline'
).value,

cgpa:
document.getElementById(
'cgpa'
).value,

year:
document.getElementById(
'year'
).value,

branches:
document.getElementById(
'branches'
).value,

job_type:
document.getElementById(
'job_type'
).value,

extra_fields:
extraFields

};

const res =
await fetch(

"http://127.0.0.1:5000/post-job",

{

method: "POST",

headers: {

"Content-Type":
"application/json",

Authorization:
"Bearer " + token

},

body:
JSON.stringify(jobData)

}

);

const data =
await res.json();

alert(data.message);

postForm.reset();

loadMyJobs();

}

);

}





/* ================= LOAD JOBS ================= */

async function loadMyJobs() {

if (!openingsContainer) return;

const res =
await fetch(

"http://127.0.0.1:5000/jobs",

{

headers: {

Authorization:
"Bearer " + token

}

}

);

const jobs =
await res.json();

openingsContainer.innerHTML =
"";

jobs.forEach(job => {

const card =
document.createElement("div");

card.className =
"job-card";

const requirementsHtml = job.extra_fields && Object.keys(job.extra_fields).length ?
    `<div><strong>Custom Requirements:</strong><ul>${Object.entries(job.extra_fields).map(([name, type]) => `<li>${name} (${type})</li>`).join("")}</ul></div>` :
    `<p><em>No custom requirements set.</em></p>`;

card.innerHTML = `

<h4>${job.role}</h4>

<p><strong>Company:</strong>
${job.company}</p>

<p><strong>Skills:</strong>
${job.skills}</p>

<p><strong>Deadline:</strong>
${job.deadline}</p>

${requirementsHtml}

`;

openingsContainer.appendChild(
card
);

});

}

loadMyJobs();





/* ================= LOAD APPLICATIONS ================= */

async function loadStudents() {

if (!studentList) return;

const res =
await fetch(

"http://127.0.0.1:5000/recruiter/applications",

{

headers: {

Authorization:
"Bearer " + token

}

}

);

const applications =
await res.json();

studentList.innerHTML =
"";

applications.forEach(app => {

const card =
document.createElement("div");

card.className =
"student-card";

card.innerHTML = `

<h4>${app.student.name} - ${app.job.role}</h4>

<p><strong>Company:</strong>
${app.job.company}</p>

<p><strong>Branch:</strong>
${app.student.branch}</p>

<p><strong>Skills:</strong>
${app.student.skills}</p>

<p><strong>CGPA:</strong>
${app.student.cgpa}</p>

<p><strong>Year:</strong>
${app.student.year}</p>

<p><strong>Email:</strong>
${app.student.email}</p>

<p><strong>Status:</strong>
${app.status}</p>

<p><strong>Applied Date:</strong>
${new Date(app.applied_date).toLocaleDateString()}</p>

${Object.keys(app.extra_data).length ? `<p><strong>Custom Data:</strong> ${JSON.stringify(app.extra_data)}</p>` : ""}

${app.student.resume ?
`<button onclick="downloadResume('${app.student.resume}')">
View Resume
</button>` : ""}

`;

studentList.appendChild(card);

});

}

loadStudents();





/* ================= VERIFY STUDENT ================= */

window.verifyStudent =
async (studentId) => {

const res =
await fetch(

`http://127.0.0.1:5000/verify-student/${studentId}`,

{

method: "POST",

headers: {

Authorization:
"Bearer " + token

}

}

);

const data =
await res.json();

alert(data.message);

loadStudents();

};





/* ================= DOWNLOAD RESUME ================= */

window.downloadResume =
async (filename) => {

const token = localStorage.getItem("token");

try {
    const res = await fetch(`http://127.0.0.1:5000/resume/${filename}`, {
        headers: {
            Authorization: "Bearer " + token
        }
    });

    if (!res.ok) {
        alert("Error downloading resume. Authorization failed.");
        return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
} catch (err) {
    console.error("Resume download error:", err);
    alert("Failed to download resume.");
}

};





/* ================= LOGOUT ================= */

const logoutBtn =
document.getElementById("logoutBtn");

if (logoutBtn) {

logoutBtn.addEventListener(

"click",

(e) => {

e.preventDefault();

localStorage.removeItem(
"token"
);

localStorage.removeItem(
"role"
);

window.location.href =
"http://127.0.0.1:5000/login";

}

);

}

});