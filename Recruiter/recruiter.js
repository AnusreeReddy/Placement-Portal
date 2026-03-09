document.addEventListener('DOMContentLoaded', () => {

    const postForm = document.getElementById('postForm');
    const myPostingsContainer = document.getElementById('my-openings-container');
    const studentListContainer = document.getElementById('student-list');
    
    // Simulating a logged-in recruiter for a front-end demo
    const loggedInRecruiter = 'Google'; 

    // Handle posting a new job
    if (postForm) {
        postForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newOpening = {
                id: Date.now(),
                recruiter: loggedInRecruiter,
                company: document.getElementById('companyName').value,
                role: document.getElementById('jobRole').value,
                stipend: document.getElementById('stipend').value || 'Not Specified',
                duration: document.getElementById('duration').value || 'N/A',
                skills: document.getElementById('requiredSkills').value || 'N/A',
                url: document.getElementById('redirectingLink').value,
                deadline: document.getElementById('deadline').value || 'N/A',
                datePosted: new Date().toLocaleDateString()
            };

            let postedOpenings = JSON.parse(localStorage.getItem('postedOpenings')) || [];
            postedOpenings.push(newOpening);
            localStorage.setItem('postedOpenings', JSON.stringify(postedOpenings));
            
            alert(`Opening for ${newOpening.role} at ${newOpening.company} has been posted!`);
            postForm.reset();
            renderMyPostings(); // Call this to update the list
        });
    }

    // Render the recruiter's own job postings
    function renderMyPostings() {
        if (!myPostingsContainer) {
            console.error('My Openings container not found.');
            return;
        }

        const allOpenings = JSON.parse(localStorage.getItem('postedOpenings')) || [];
        const myOpenings = allOpenings.filter(job => job.recruiter === loggedInRecruiter);

        myPostingsContainer.innerHTML = '';
        if (myOpenings.length === 0) {
            myPostingsContainer.innerHTML = '<p>You have not posted any jobs yet.</p>';
            return;
        }

        myOpenings.forEach(opening => {
            const card = document.createElement('div');
            card.className = 'job-card';
            card.innerHTML = `
                <h4>${opening.role}</h4>
                <p><strong>Company:</strong> ${opening.company}</p>
                <p><strong>Skills:</strong> ${opening.skills}</p>
                <p><strong>Deadline:</strong> ${opening.deadline}</p>
            `;
            myPostingsContainer.appendChild(card);
        });
    }

    // Render the list of all students
    function renderStudentProfiles() {
        if (!studentListContainer) {
            console.error('Student list container not found.');
            return;
        }
        
        const studentProfile = JSON.parse(localStorage.getItem('studentProfile'));

        studentListContainer.innerHTML = '';
        if (!studentProfile) {
            studentListContainer.innerHTML = '<p>No student profiles found.</p>';
            return;
        }

        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <h4>${studentProfile.name}</h4>
            <p><strong>Branch:</strong> ${studentProfile.branch}</p>
            <p><strong>Skills:</strong> ${studentProfile.skills}</p>
            <p><strong>Resume:</strong> ${studentProfile.hasResume ? '<span style="color: green;">Available</span>' : '<span style="color: red;">Not Available</span>'}</p>
            <a href="#">View Profile (Simulated)</a>
        `;
        studentListContainer.appendChild(card);
    }
    
    // Initial render when the page loads
    renderMyPostings();
    renderStudentProfiles();
});