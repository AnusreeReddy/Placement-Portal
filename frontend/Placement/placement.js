document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");

    if (!token) {

        alert("Please login first");

        window.location.href = "../Login/login.html";

        return;
    }

    const postForm = document.getElementById("postForm");

    const postedOpeningsContainer = document.getElementById("posted-openings-container");


    // ================= POST JOB =================

    if (postForm) {

        postForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const jobData = {

                company: document.getElementById("companyName").value,
                role: document.getElementById("jobRole").value,
                stipend: document.getElementById("stipend").value,
                duration: document.getElementById("duration").value,
                skills: document.getElementById("requiredSkills").value,
                url: document.getElementById("redirectingLink").value,
                deadline: document.getElementById("deadline").value
            };

            const res = await fetch("http://127.0.0.1:5000/post-job", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify(jobData)
            });

            const data = await res.json();

            alert(data.message);

            postForm.reset();

            loadJobs();
        });
    }


    // ================= LOAD JOBS =================

    async function loadJobs() {

        const res = await fetch("http://127.0.0.1:5000/jobs", {

            headers: {

                "Authorization": "Bearer " + token
            }
        });

        const jobs = await res.json();

        postedOpeningsContainer.innerHTML = "";

        jobs.forEach(job => {

            const card = document.createElement("div");

            card.className = "job-card";

            card.innerHTML = `

                <h4>${job.role} at ${job.company}</h4>

                <p><strong>Skills:</strong> ${job.skills}</p>

                <p><strong>Deadline:</strong> ${job.deadline}</p>

            `;

            postedOpeningsContainer.appendChild(card);
        });
    }


    loadJobs();

});