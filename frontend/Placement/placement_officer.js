document.addEventListener("DOMContentLoaded", () => {

/* ================= AUTH CHECK ================= */

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "placementOfficer") {
    alert("Access denied. Placement officers only. Please login as a Placement Officer.");
    window.location.href = "/login";
    return;
}

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

/* ================= LOGOUT ================= */

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login";
    });
}

/* ================= LOAD ALL STUDENTS ================= */

async function loadAllStudents() {
    const container = document.getElementById("students-list-container");
    if (!container) return;

    try {
        const res = await authFetch("/placement/all-students");
        if (!res.ok) throw new Error("Failed to load students");

        const students = await res.json();
        container.innerHTML = "";

        if (students.length === 0) {
            container.innerHTML = "<p>No students found.</p>";
            return;
        }

        students.forEach(student => {
            const card = document.createElement("div");
            card.className = "student-card";
            card.innerHTML = `
                <h4>${student.name}</h4>
                <p><strong>Email:</strong> ${student.email}</p>
                <p><strong>Branch:</strong> ${student.branch || "N/A"}</p>
                <p><strong>Roll No:</strong> ${student.roll_no || "N/A"}</p>
                <p><strong>CGPA:</strong> ${student.cgpa || "N/A"}</p>
                <p><strong>Year:</strong> ${student.year || "N/A"}</p>
                <p><strong>Skills:</strong> ${student.skills || "N/A"}</p>
                <p><strong>Applications:</strong> ${student.applications_count}</p>
                <p><strong>Status:</strong> ${student.verified ? "✅ Verified" : "⏳ Pending"}</p>
                <button class="view-btn" onclick="viewStudentDetails(${student.id})">View Details</button>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading students:", err);
        container.innerHTML = "<p style='color: red;'>Error loading students. Please try again.</p>";
    }
}

/* ================= VIEW STUDENT DETAILS ================= */

window.viewStudentDetails = async (studentId) => {
    try {
        const res = await authFetch(`/placement/student-details/${studentId}`);
        if (!res.ok) throw new Error("Failed to load student details");

        const data = await res.json();
        const student = data.student;
        const applications = data.applications;

        const modal = document.getElementById("studentModal");
        const content = document.getElementById("studentDetailsContent");

        let applicationsHtml = "";
        if (applications.length === 0) {
            applicationsHtml = "<p>No applications yet.</p>";
        } else {
            applicationsHtml = applications.map(app => `
                <div style="background: #f0f0f0; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                    <p><strong>${app.company} - ${app.role}</strong></p>
                    <p>Status: <span style="font-weight: bold; color: ${app.status === 'accepted' ? '#28a745' : app.status === 'rejected' ? '#dc3545' : '#ffc107'};">${app.status || 'pending'}</span></p>
                    <p>Applied: ${new Date(app.applied_date).toLocaleDateString()}</p>
                </div>
            `).join("");
        }

        content.innerHTML = `
            <h4>${student.name}</h4>
            <p><strong>Email:</strong> ${student.email}</p>
            <p><strong>Branch:</strong> ${student.branch || "N/A"}</p>
            <p><strong>Roll Number:</strong> ${student.roll_no || "N/A"}</p>
            <p><strong>CGPA:</strong> ${student.cgpa || "N/A"}</p>
            <p><strong>Year:</strong> ${student.year || "N/A"}</p>
            <p><strong>Skills:</strong> ${student.skills || "N/A"}</p>
            <p><strong>Status:</strong> ${student.verified ? "✅ Verified" : "⏳ Pending"}</p>
            ${student.resume ? `<p><strong>Resume:</strong> <a href="javascript:downloadResume('${student.resume}')" style="color: #007bff; cursor: pointer;">Download</a></p>` : ""}
            <hr>
            <h5>Applications (${applications.length})</h5>
            ${applicationsHtml}
        `;

        modal.classList.add("active");
    } catch (err) {
        console.error("Error loading student details:", err);
        alert("Error loading student details.");
    }
};

window.closeStudentModal = () => {
    document.getElementById("studentModal").classList.remove("active");
};

/* ================= LOAD ALL JOBS ================= */

async function loadAllJobs() {
    const container = document.getElementById("jobs-list-container");
    if (!container) return;

    try {
        const res = await authFetch("/placement/all-jobs");
        if (!res.ok) throw new Error("Failed to load jobs");

        const jobs = await res.json();
        container.innerHTML = "";

        if (jobs.length === 0) {
            container.innerHTML = "<p>No job postings found.</p>";
            return;
        }

        jobs.forEach(job => {
            const card = document.createElement("div");
            card.className = "job-card";
            card.innerHTML = `
                <h4>${job.role}</h4>
                <p><strong>Company:</strong> ${job.company}</p>
                <p><strong>Posted By:</strong> ${job.posted_by}</p>
                <p><strong>Stipend:</strong> ${job.stipend || "N/A"}</p>
                <p><strong>Duration:</strong> ${job.duration || "N/A"}</p>
                <p><strong>Skills Required:</strong> ${job.skills || "N/A"}</p>
                <p><strong>Deadline:</strong> ${job.deadline || "N/A"}</p>
                <p><strong>Min CGPA:</strong> ${job.cgpa || "N/A"}</p>
                <p><strong>Year:</strong> ${job.year || "N/A"}</p>
                <p><strong>Applications:</strong> ${job.applications_count}</p>
                <button class="view-btn" onclick="viewJobApplications(${job.id})">View Applicants</button>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading jobs:", err);
        container.innerHTML = "<p style='color: red;'>Error loading jobs. Please try again.</p>";
    }
}

/* ================= VIEW JOB APPLICATIONS ================= */

window.viewJobApplications = async (jobId) => {
    try {
        const res = await authFetch(`/placement/job-applications/${jobId}`);
        if (!res.ok) throw new Error("Failed to load applications");

        const data = await res.json();
        const job = data.job;
        const applications = data.applications;

        const modal = document.getElementById("jobModal");
        const content = document.getElementById("jobApplicationsContent");

        let applicationsHtml = "";
        if (applications.length === 0) {
            applicationsHtml = "<p>No applications yet.</p>";
        } else {
            applicationsHtml = applications.map(app => `
                <div style="background: #f0f0f0; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                    <p><strong>${app.student_name}</strong></p>
                    <p>Email: ${app.student_email}</p>
                    <p>Branch: ${app.student_branch} | CGPA: ${app.student_cgpa}</p>
                    <p>Status: <span style="font-weight: bold; color: ${app.status === 'accepted' ? '#28a745' : app.status === 'rejected' ? '#dc3545' : '#ffc107'};">${app.status || 'pending'}</span></p>
                    <p>Applied: ${new Date(app.applied_date).toLocaleDateString()}</p>
                </div>
            `).join("");
        }

        content.innerHTML = `
            <p><strong>Job:</strong> ${job.role} at ${job.company}</p>
            <p><strong>Deadline:</strong> ${job.deadline}</p>
            <hr>
            <h5>Applicants (${applications.length})</h5>
            ${applicationsHtml}
        `;

        modal.classList.add("active");
    } catch (err) {
        console.error("Error loading applications:", err);
        alert("Error loading applications.");
    }
};

window.closeJobModal = () => {
    document.getElementById("jobModal").classList.remove("active");
};

/* ================= SWITCH STUDENT VIEW ================= */

window.switchStudentView = (view) => {
    if (view === 'list') {
        loadAllStudents();
    }
};

/* ================= DOWNLOAD RESUME ================= */

window.downloadResume = async (filename) => {
    try {
        const res = await authFetch(`/resume/${filename}`);
        if (!res.ok) {
            alert("Error downloading resume.");
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

/* ================= INITIAL LOAD ================= */

loadAllStudents();
loadAllJobs();

});
