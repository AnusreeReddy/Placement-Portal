document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('postForm');
    const postSuccessMessage = document.getElementById('post-success-message');
    const applicationsContainer = document.getElementById('applications-container');
    const postedOpeningsContainer = document.getElementById('posted-openings-container');
    
    // Handle form submission to post a new opening
    if (postForm) {
        postForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newOpening = {
                id: Date.now(),
                company: document.getElementById('companyName').value,
                role: document.getElementById('jobRole').value,
                stipend: document.getElementById('stipend').value,
                duration: document.getElementById('duration').value,
                skills: document.getElementById('requiredSkills').value,
                url: document.getElementById('redirectingLink').value,
                deadline: document.getElementById('deadline').value,
                datePosted: new Date().toLocaleDateString()
            };

            let postedOpenings = JSON.parse(localStorage.getItem('postedOpenings')) || [];
            postedOpenings.push(newOpening);
            localStorage.setItem('postedOpenings', JSON.stringify(postedOpenings));

            if (postSuccessMessage) {
                postSuccessMessage.style.display = 'block';
                setTimeout(() => {
                    postSuccessMessage.style.display = 'none';
                }, 3000);
            }

            postForm.reset();
            renderPostedOpenings();
            renderApplicationsToReview();
        });
    }

    // Render the list of all posted openings
    function renderPostedOpenings() {
        const postedOpenings = JSON.parse(localStorage.getItem('postedOpenings')) || [];
        if (postedOpeningsContainer) {
            postedOpeningsContainer.innerHTML = '';
            if (postedOpenings.length === 0) {
                postedOpeningsContainer.innerHTML = '<p>No openings have been posted yet.</p>';
                return;
            }
            postedOpenings.forEach(opening => {
                const card = document.createElement('div');
                card.className = 'job-card';
                card.innerHTML = `
                    <h4>${opening.role} at ${opening.company}</h4>
                    <p><strong>Stipend:</strong> ${opening.stipend || 'N/A'}</p>
                    <p><strong>Duration:</strong> ${opening.duration || 'N/A'}</p>
                    <p><strong>Skills:</strong> ${opening.skills}</p>
                    <p><strong>Deadline:</strong> ${opening.deadline}</p>
                `;
                postedOpeningsContainer.appendChild(card);
            });
        }
    }

    // Render the list of openings that have applications
    function renderApplicationsToReview() {
        const postedOpenings = JSON.parse(localStorage.getItem('postedOpenings')) || [];
        const appliedOpportunities = JSON.parse(localStorage.getItem('appliedOpportunities')) || [];
        
        if (applicationsContainer) {
            applicationsContainer.innerHTML = '';

            const applicationsByJob = appliedOpportunities.reduce((acc, application) => {
                if (!acc[application.id]) {
                    acc[application.id] = [];
                }
                acc[application.id].push(application);
                return acc;
            }, {});

            if (Object.keys(applicationsByJob).length === 0) {
                applicationsContainer.innerHTML = '<p>No applications to review yet.</p>';
                return;
            }

            Object.keys(applicationsByJob).forEach(jobId => {
                const applicants = applicationsByJob[jobId];
                const opening = postedOpenings.find(o => o.id == jobId);

                if (!opening) return;

                const jobCard = document.createElement('div');
                jobCard.className = 'job-card';
                jobCard.innerHTML = `
                    <h4>${opening.role} at ${opening.company}</h4>
                    <p><strong>Deadline:</strong> ${opening.deadline}</p>
                    <button class="review-btn" data-job-id="${opening.id}">Review Applications (${applicants.length})</button>
                    <ul class="applicant-list" data-job-id="${opening.id}"></ul>
                `;
                applicationsContainer.appendChild(jobCard);
            });
        }
    }
    
    // Event listener for "Review Applications" button and new "View Resume" link
    if (applicationsContainer) {
        applicationsContainer.addEventListener('click', (e) => {
            const reviewBtn = e.target.closest('.review-btn');
            const viewResumeBtn = e.target.closest('.view-resume-btn');
            
            if (reviewBtn) {
                const jobId = reviewBtn.dataset.jobId;
                const applicantList = applicationsContainer.querySelector(`.applicant-list[data-job-id="${jobId}"]`);
                
                const appliedOpportunities = JSON.parse(localStorage.getItem('appliedOpportunities')) || [];
                const applicants = appliedOpportunities.filter(app => app.id == jobId);
                
                const isVisible = applicantList.style.display === 'block';
                applicantList.style.display = isVisible ? 'none' : 'block';
                reviewBtn.textContent = isVisible ? `Review Applications (${applicants.length})` : 'Hide Applicants';

                if (!isVisible && applicantList.innerHTML === '') {
                    applicants.forEach(applicant => {
                        let resumeContent = `Resume: <span style="color: red;">Not Available</span>`;
                        if (applicant.hasResume) {
                            resumeContent = `Resume: <button class="view-resume-btn" style="background: none; border: none; color: #007bff; text-decoration: underline; cursor: pointer;">View</button>`;
                        }
                        
                        const applicantItem = document.createElement('li');
                        applicantItem.className = 'applicant-item';
                        applicantItem.innerHTML = `
                            <p><strong>Name:</strong> ${applicant.applicantName || 'N/A'}</p>
                            <p><strong>Skills:</strong> ${applicant.applicantSkills || 'N/A'}</p>
                            <p>${resumeContent}</p>
                            <p><strong>Applied On:</strong> ${applicant.date}</p>
                        `;
                        applicantList.appendChild(applicantItem);
                    });
                }
            } else if (viewResumeBtn) {
                // Handle "View" button click
                alert('Simulating resume view. In a real application, this would open a PDF or image.');
            }
        });
    }

    // Initial render when the page loads
    renderPostedOpenings();
    renderApplicationsToReview();
});