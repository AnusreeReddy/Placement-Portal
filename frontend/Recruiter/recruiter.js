document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem("token");

    if (!token) {

        alert("Please login first");

        window.location.href = "http://127.0.0.1:5000/login";

        return;

    }


    const postForm =
        document.getElementById('postForm');

    const postHackathonForm =
        document.getElementById('postHackathonForm');

    const postEventForm =
        document.getElementById('postEventForm');

    const openingsContainer =
        document.getElementById(
            'my-openings-container'
        );

    const studentList =
        document.getElementById('student-list');


    // ================= POST JOB =================

    if (postForm) {

        postForm.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                const jobData = {

    company: document.getElementById('companyName').value,
    role: document.getElementById('jobRole').value,
    stipend: document.getElementById('stipend').value,
    duration: document.getElementById('duration').value,
    skills: document.getElementById('requiredSkills').value,
    url: document.getElementById('redirectingLink').value,
    deadline: document.getElementById('deadline').value,

    // 🔥 ADD THESE NEW FIELDS
    cgpa: document.getElementById('cgpa').value,
    year: document.getElementById('year').value,
    branches: document.getElementById('branches').value,
    job_type: document.getElementById('job_type').value
};

                const res = await fetch(

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



    // ================= POST HACKATHON =================

    if (postHackathonForm) {

        postHackathonForm.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                const hackData = {

                    title:
                        document.getElementById(
                            'hackTitle'
                        ).value,

                    description:
                        document.getElementById(
                            'hackDescription'
                        ).value,

                    organizer:
                        document.getElementById(
                            'hackOrganizer'
                        ).value,

                    skills:
                        document.getElementById(
                            'hackSkills'
                        ).value,

                    url:
                        document.getElementById(
                            'hackUrl'
                        ).value,

                    deadline:
                        document.getElementById(
                            'hackDeadline'
                        ).value

                };


                const res = await fetch(

                    "http://127.0.0.1:5000/post-hackathon",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                "Bearer " + token

                        },

                        body:
                            JSON.stringify(hackData)

                    }

                );

                const data =
                    await res.json();


                alert(data.message);


                postHackathonForm.reset();

            }

        );

    }



    // ================= POST EVENT =================

    if (postEventForm) {

        postEventForm.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                const eventData = {

                    title:
                        document.getElementById(
                            'eventTitle'
                        ).value,

                    description:
                        document.getElementById(
                            'eventDescription'
                        ).value,

                    organizer:
                        document.getElementById(
                            'eventOrganizer'
                        ).value,

                    skills:
                        document.getElementById(
                            'eventSkills'
                        ).value,

                    url:
                        document.getElementById(
                            'eventUrl'
                        ).value,

                    deadline:
                        document.getElementById(
                            'eventDeadline'
                        ).value

                };


                const res = await fetch(

                    "http://127.0.0.1:5000/post-event",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                "Bearer " + token

                        },

                        body:
                            JSON.stringify(eventData)

                    }

                );

                const data =
                    await res.json();


                alert(data.message);


                postEventForm.reset();

            }

        );

    }



    // ================= LOAD JOBS =================

    async function loadMyJobs() {

        if (!openingsContainer) return;


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


        openingsContainer.innerHTML = "";


        jobs.forEach(job => {

            const card =
                document.createElement("div");


            card.className = "job-card";


            card.innerHTML = `

                <h4>${job.role}</h4>

                <p><strong>Company:</strong>
                ${job.company}</p>

                <p><strong>Skills:</strong>
                ${job.skills}</p>

                <p><strong>Deadline:</strong>
                ${job.deadline}</p>

            `;


            openingsContainer.appendChild(card);

        });

    }


    loadMyJobs();



    // ================= LOAD STUDENTS =================

    async function loadStudents() {

        if (!studentList) return;


        const res = await fetch(

            "http://127.0.0.1:5000/students",

            {

                headers: {

                    Authorization:
                        "Bearer " + token

                }

            }

        );


        const students = await res.json();


        studentList.innerHTML = "";


        students.forEach(student => {

            const card =
                document.createElement("div");


            card.className = "student-card";


            card.innerHTML = `

                <h4>${student.name}</h4>

                <p><strong>Branch:</strong>
                ${student.branch}</p>

                <p><strong>Skills:</strong>
                ${student.skills}</p>

                <p><strong>Email:</strong>
                ${student.email}</p>

                <p><strong>Verified:</strong>
                ${student.verified ? 'Yes' : 'No'}</p>

                <button onclick="verifyStudent(${student.id})">
                ${student.verified ? 'Unverify' : 'Verify'}
                </button>

                ${student.resume ? `<button onclick="downloadResume(${student.id})">Download Resume</button>` : ''}

            `;


            studentList.appendChild(card);

        });

    }


    loadStudents();



    // ================= VERIFY STUDENT =================

    window.verifyStudent = async (studentId) => {

        const res = await fetch(

            `http://127.0.0.1:5000/verify-student/${studentId}`,

            {

                method: "POST",

                headers: {

                    Authorization:
                        "Bearer " + token

                }

            }

        );

        const data = await res.json();

        alert(data.message);

        loadStudents();  // Reload to update status

    };



    // ================= DOWNLOAD RESUME =================

    window.downloadResume = async (studentId) => {

        const res = await fetch(

            `http://127.0.0.1:5000/download-resume/${studentId}`,

            {

                headers: {

                    Authorization:
                        "Bearer " + token

                }

            }

        );

        if (res.ok) {

            const blob = await res.blob();

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');

            a.href = url;

            a.download = `resume_${studentId}.pdf`;

            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);

            document.body.removeChild(a);

        } else {

            alert('Resume not available');

        }

    };



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