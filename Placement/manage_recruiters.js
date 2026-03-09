document.addEventListener('DOMContentLoaded', () => {
    const recruiterForm = document.getElementById('recruiterForm');
    const recruiterListElem = document.getElementById('recruiter-list');
    const submitBtn = document.getElementById('submitBtn');

    // Load recruiters from localStorage
    let recruiters = JSON.parse(localStorage.getItem('recruiters')) || [];

    function renderRecruiters() {
        if (!recruiterListElem) return;
        recruiterListElem.innerHTML = '';
        if (recruiters.length === 0) {
            recruiterListElem.innerHTML = '<p>No recruiters added yet.</p>';
            return;
        }

        recruiters.forEach(recruiter => {
            const card = document.createElement('div');
            card.className = 'recruiter-card';
            card.innerHTML = `
                <span class="delete-btn" data-id="${recruiter.id}">&times;</span>
                <h4>${recruiter.recruiterName}</h4>
                <p><strong>Company:</strong> ${recruiter.companyName}</p>
                <p><strong>Email:</strong> ${recruiter.email}</p>
                <p><strong>Contact:</strong> ${recruiter.contactNumber || 'N/A'}</p>
            `;
            recruiterListElem.appendChild(card);
        });
    }

    function saveRecruiters() {
        localStorage.setItem('recruiters', JSON.stringify(recruiters));
    }

    if (recruiterForm) {
        recruiterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const recruiterId = document.getElementById('recruiterId').value;
            const companyName = document.getElementById('companyName').value;
            const recruiterName = document.getElementById('recruiterName').value;
            const email = document.getElementById('email').value;
            const contactNumber = document.getElementById('contactNumber').value;

            if (recruiterId) {
                // Edit existing recruiter
                const index = recruiters.findIndex(r => r.id === parseInt(recruiterId));
                if (index !== -1) {
                    recruiters[index] = { id: parseInt(recruiterId), companyName, recruiterName, email, contactNumber };
                }
            } else {
                // Add new recruiter
                const newRecruiter = {
                    id: Date.now(),
                    companyName,
                    recruiterName,
                    email,
                    contactNumber
                };
                recruiters.push(newRecruiter);
            }

            saveRecruiters();
            recruiterForm.reset();
            submitBtn.textContent = 'Add Recruiter';
            renderRecruiters();
        });
    }

    if (recruiterListElem) {
        recruiterListElem.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const idToDelete = parseInt(deleteBtn.dataset.id);
                recruiters = recruiters.filter(r => r.id !== idToDelete);
                saveRecruiters();
                renderRecruiters();
            }
        });
    }

    // Initial render
    renderRecruiters();
});